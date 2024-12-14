import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  useLazyApiSupervisorQuery,
  useLazyFolderGhostQuery,
  useLazyQueryGhostQuery,
  useLazySupervisorQuery,
  useLazyUiSupervisorQuery
} from '../redux/services/base-app'
import { useDispatch } from 'react-redux'
import { FaGhost } from 'react-icons/fa'
import { CircularProgress } from '@mui/material'

// import { ipcRenderer } from 'electron'

const RecursiveTaskList = ({ tasks, toggleTaskCompletion, level = 0 }) => {
  return (
    <div className={`pl-${level * 4} space-y-2`}>
      {tasks.map((task) => (
        <Accordion type="single" collapsible key={task.id} className="w-full">
          <AccordionItem value={task.id}>
            <AccordionTrigger>
              <div className="flex items-center space-x-2">
                {task.running ? (
                  <CircularProgress size={20} />
                ) : (
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                  />
                )}
                <span>{task.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {task?.subtasks?.length > 0 && (
                <RecursiveTaskList
                  tasks={task.subtasks}
                  toggleTaskCompletion={(parentId, subtaskId) =>
                    toggleTaskCompletion(task.id, subtaskId || parentId)
                  }
                  level={level + 1}
                />
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ))}
    </div>
  )
}

const HomePage = () => {
  // State for paths and tasks
  const dispatch = useDispatch()

  const [frontendPath, setFrontendPath] = useState('')
  const [backendPath, setBackendPath] = useState('')
  const [tasks, setTasks] = useState([
    {
      id: 'task1',
      title: 'Frontend Tasks',
      completed: false,
      running: false,
      subtasks: []
    },
    {
      id: 'task2',
      title: 'Backend Tasks',
      completed: false,
      running: false,
      subtasks: []
    }
  ])
  const [conversation, setConversation] = useState([
    { role: 'assistant', content: 'What do you want to build?' }
  ])
  const [currentInput, setCurrentInput] = useState('')
  const [builderCommand, setBuilderCommand] = useState({})

  const [askGhost, { isFetching: queryGhostThinking }] = useLazyQueryGhostQuery()
  const [askSupervisor, { isFetching: supervisorThinking }] = useLazySupervisorQuery()
  const [askUISupervisor, { isFetching: uiSupervisorThinking }] = useLazyUiSupervisorQuery()
  const [askAPISupervisor, { isFetching: apiSupervisorThinking }] = useLazyApiSupervisorQuery()
  const [askFolderGhost, { isFetching: folderGhostThinking }] = useLazyFolderGhostQuery()

  // Function to select directory (mock Electron dialog)
  const selectDirectory = async (type) => {
    // In a real Electron app, you'd use electron.dialog.showOpenDialog()
    // const path = window.prompt(`Select ${type} directory path:`)
    const path = await window.api.selectFolder()
    if (type === 'frontend') {
      setFrontendPath(path || '')
    } else {
      setBackendPath(path || '')
    }
  }

  const toggleTaskCompletion = (taskId, subtaskId = null) => {
    const updateTasks = (tasks) => {
      return tasks.map((task) => {
        // If this task matches the taskId
        if (task.id === taskId) {
          // If no subtaskId is specified, toggle the entire task
          if (!subtaskId) {
            const newCompletedState = !task.completed
            const updateAllSubtasks = (subtasks, completed) => {
              return subtasks.map((subtask) => ({
                ...subtask,
                completed,
                ...(subtask.subtasks
                  ? { subtasks: updateAllSubtasks(subtask.subtasks, completed) }
                  : {})
              }))
            }

            return {
              ...task,
              completed: newCompletedState,
              subtasks: task.subtasks ? updateAllSubtasks(task.subtasks, newCompletedState) : []
            }
          }

          // If subtaskId is specified, find and toggle the subtask
          const updateSubtasks = (subtasks) => {
            return subtasks.map((subtask) => {
              if (subtask.id === subtaskId) {
                // Toggle this subtask
                const newCompletedState = !subtask.completed
                return {
                  ...subtask,
                  completed: newCompletedState,
                  subtasks: subtask.subtasks ? updateSubtasks(subtask.subtasks) : []
                }
              }

              // Recursively update deeper levels
              return {
                ...subtask,
                subtasks: subtask.subtasks ? updateSubtasks(subtask.subtasks) : []
              }
            })
          }

          const updatedSubtasks = updateSubtasks(task.subtasks || [])
          const allSubtasksCompleted = updatedSubtasks.every((st) => st.completed)

          return {
            ...task,
            subtasks: updatedSubtasks,
            completed: allSubtasksCompleted
          }
        }

        // If task doesn't match, return it unchanged
        return {
          ...task,
          subtasks: task.subtasks ? updateTasks(task.subtasks) : []
        }
      })
    }

    const updatedTasks = updateTasks(tasks)

    // Update the state with the new task structure
    setTasks(updatedTasks)
  }

  // Generate project based on query (mock function)
  const generateProject = async () => {
    //
  }

  // Mock API call to fetch follow-up questions
  const fetchFollowUpQuestion = async (conversation) => {
    try {
      const res = await askGhost({ conversation }).unwrap()

      return res
    } catch (error) {
      console.error(error)
    }
  }

  const handleUserInput = async () => {
    if (!currentInput.trim()) return

    // Add user input to the conversation
    const updatedConversation = [...conversation, { role: 'user', content: currentInput }]
    setConversation(updatedConversation)

    // Fetch follow-up question from the API
    const apiResponse = await fetchFollowUpQuestion(updatedConversation)

    if (apiResponse?.is_query_clear) {
      setBuilderCommand({
        to_build: apiResponse.to_build,
        reply_to_user: apiResponse.reply_to_user
      })

      const supervisorResponse = await askSupervisor({
        query: apiResponse.to_build,
        ui_dir_path: frontendPath,
        api_dir_path: backendPath
      }).unwrap()

      const tempTasks = [...tasks]

      tempTasks[0].subtasks = supervisorResponse?.ui_supervisor_prompts?.map((query, i) => {
        return { id: i + 1, completed: false, running: false, title: query }
      })
      tempTasks[1].subtasks = supervisorResponse?.api_supervisor_prompts?.map((query, i) => {
        return { id: i + 1, completed: false, running: false, title: query }
      })

      setTasks(tempTasks)

      const ui_tasks = supervisorResponse?.ui_supervisor_prompts
      tempTasks[0].running = true
      setTasks(tempTasks)
      for (let i = 0; i < ui_tasks?.length; i++) {
        const { agents } = await askUISupervisor({
          query: ui_tasks[i],
          ui_dir_path: frontendPath
        }).unwrap()

        tempTasks[0].subtasks[i].subtasks = agents.map((ag, ind) => {
          return {
            id: ind + 1,
            completed: false,
            running: false,
            title: `${ag.folder_name} - (${ag.tasks.length} tasks) `,
            subtasks: ag.tasks.map((agt, sind) => {
              return {
                id: sind + 1,
                completed: false,
                running: false,
                title: agt
              }
            })
          }
        })

        tempTasks[0].subtasks[i].running = true
        setTasks(tempTasks)

        for (let j = 0; j < agents.length; j++) {
          const { folder_agent_id, folder_name, tasks, new_dependencies } = agents[j]

          tempTasks[0].subtasks[i].subtasks[j].running = true
          setTasks(tempTasks)

          for (let k = 0; k < tasks.length; k++) {
            tempTasks[0].subtasks[i].subtasks[j].subtasks[k].running = true
            setTasks(tempTasks)

            await askFolderGhost({
              folder_agent_id,
              agent_prompt: tasks[k],
              ui_dir_path: frontendPath,
              api_dir_path: backendPath
            })

            tempTasks[0].subtasks[i].subtasks[j].subtasks[k].completed = true
            tempTasks[0].subtasks[i].subtasks[j].subtasks[k].running = false
            setTasks(tempTasks)
          }

          tempTasks[0].subtasks[i].subtasks[j].completed = true
          tempTasks[0].subtasks[i].subtasks[j].running = false
          setTasks(tempTasks)
        }

        tempTasks[0].subtasks[i].completed = true
        tempTasks[0].subtasks[i].running = false
        setTasks(tempTasks)
      }

      tempTasks[0].running = false
      tempTasks[0].completed = true
      setTasks(tempTasks)

      const api_tasks = supervisorResponse?.api_supervisor_prompts
      tempTasks[1].running = true
      setTasks(tempTasks)
      for (let i = 0; i < api_tasks?.length; i++) {
        const { agents } = await askAPISupervisor({
          query: api_tasks[i],
          api_dir_path: backendPath
        }).unwrap()

        tempTasks[1].subtasks[i].subtasks = agents.map((ag, ind) => {
          return {
            id: ind + 1,
            completed: false,
            running: false,
            title: `${ag.folder_name} - (${ag.tasks.length} tasks) `,
            subtasks: ag.tasks.map((agt, sind) => {
              return {
                id: sind + 1,
                completed: false,
                running: false,
                title: agt
              }
            })
          }
        })

        tempTasks[1].subtasks[i].running = true
        setTasks(tempTasks)

        for (let j = 0; j < agents.length; j++) {
          const { folder_agent_id, folder_name, tasks, new_dependencies } = agents[j]

          tempTasks[1].subtasks[i].subtasks[j].running = true
          setTasks(tempTasks)

          for (let k = 0; k < tasks.length; k++) {
            tempTasks[1].subtasks[i].subtasks[j].subtasks[k].running = true
            setTasks(tempTasks)

            await askFolderGhost({
              folder_agent_id,
              agent_prompt: tasks[k],
              ui_dir_path: frontendPath,
              api_dir_path: backendPath
            }).unwrap()

            tempTasks[1].subtasks[i].subtasks[j].subtasks[k].completed = true
            tempTasks[1].subtasks[i].subtasks[j].subtasks[k].running = false
            setTasks(tempTasks)
          }

          tempTasks[1].subtasks[i].subtasks[j].completed = true
          tempTasks[1].subtasks[i].subtasks[j].running = false
          setTasks(tempTasks)
        }

        tempTasks[1].subtasks[i].completed = true
        tempTasks[1].subtasks[i].running = false
        setTasks(tempTasks)
      }

      tempTasks[1].running = false
      tempTasks[1].completed = true
      setTasks(tempTasks)
    } else {
      // Add system response to the conversation
      setConversation((prev) => [
        ...prev, // upto time t
        { role: 'assistant', content: apiResponse?.doubt_to_ask } // t = t+1
      ])

      // Reset input field
      setCurrentInput('')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">Welcome to Lean Alive</h1>
        <p className="text-xl text-slate-600">Your project setup and task management assistant</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Setup Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Directory Selection */}
          <div className="space-y-4">
            <div>
              <Label>Frontend Codebase</Label>
              <div className="flex space-x-2">
                <Input value={frontendPath} placeholder="Select Frontend Directory" readOnly />
                <Button onClick={() => selectDirectory('frontend')}>Browse</Button>
              </div>
            </div>

            <div>
              <Label>Backend Codebase</Label>
              <div className="flex space-x-2">
                <Input value={backendPath} placeholder="Select Backend Directory" readOnly />
                <Button onClick={() => selectDirectory('backend')}>Browse</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Conversation Display */}
          <div
            className="space-y-4 max-h-64 overflow-y-auto border p-4 rounded"
            style={{ maxHeight: 250, overflowY: 'scroll' }}
          >
            {conversation.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                style={{
                  alignItems: 'center',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                {message.role === 'assistant' && (
                  <div className="mr-2">
                    <FaGhost className="text-gray-500 w-7 h-7" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-lg max-w-xs ${
                    message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          {/* User Input */}
          {builderCommand?.to_build ? (
            <div
              className={`flex `}
              style={{
                alignItems: 'center'
              }}
            >
              <div className="mr-2">
                <FaGhost className="text-gray-500 w-7 h-7" />
              </div>

              <div className={`p-3 rounded-lg max-w-xs bg-blue-500 text-white`}>
                {builderCommand?.reply_to_user}
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleUserInput()
              }}
              className="flex space-x-2 mt-4"
            >
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Type your response..."
                disabled={queryGhostThinking}
              />
              <Button type="submit" disabled={queryGhostThinking}>
                {queryGhostThinking ? 'Loading...' : 'Send'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <RecursiveTaskList tasks={tasks} toggleTaskCompletion={toggleTaskCompletion} />
        </CardContent>
      </Card>
    </div>
  )
}

export default HomePage
