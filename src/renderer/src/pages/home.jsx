import React, { useEffect, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { useLazyProjectManagerGhostQuery } from '../redux/services/base-app'
import { FaGhost } from 'react-icons/fa'
import { CircularProgress } from '@mui/material'
import { API_BASE_URL, API_PREFIX } from '../settings'
// import { ipcRenderer } from 'electron'

const NOT_STARTED = 'not_started'
const IN_PROGRESS = 'in_progress'
const FINISHED = 'finished'
const STATUS = 'status'
const CODE = 'code'
const TEXT = 'text'
const HELLO_WORLD = 'hello_world'

const defaultTasks = [
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
]

const RecursiveTaskList = ({ tasks, level = 0 }) => {
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
                  <Checkbox checked={task.completed} />
                )}
                <span>{task.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {task?.subtasks?.length > 0 && (
                <RecursiveTaskList tasks={task.subtasks} level={level + 1} />
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ))}
    </div>
  )
}

const SideBarList = ({ modules, selectedModule, setSelectedModule }) => {
  return (
    <ul className="space-y-2">
      {modules.map((module, i) => (
        <li key={i}>
          <Button
            variant={
              `${selectedModule.folder_path}/${selectedModule.module_name}` ===
              `${module.folder_path}/${module.module_name}`
                ? 'default'
                : 'outline'
            }
            className="w-full justify-start"
            onClick={() => setSelectedModule(module)}
          >
            {`${module.folder_path}/${module.module_name}`}
          </Button>
        </li>
      ))}
    </ul>
  )
}

const ModuleViewer = ({ modules }) => {
  const [selectedModule, setSelectedModule] = useState(modules[0])

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <ScrollArea className="w-1/4 bg-white shadow-lg">
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4">Modules</h2>

          <Tabs defaultValue="ui">
            <TabsList>
              <TabsTrigger value="ui">Frontend</TabsTrigger>
              <TabsTrigger value="api">Backend</TabsTrigger>
            </TabsList>

            <TabsContent value="ui">
              <SideBarList
                modules={modules.filter((m) => m.folder_id.includes('ui'))}
                selectedModule={selectedModule}
                setSelectedModule={setSelectedModule}
              />
            </TabsContent>

            <TabsContent value="api">
              <SideBarList
                modules={modules.filter((m) => m.folder_id.includes('api'))}
                selectedModule={selectedModule}
                setSelectedModule={setSelectedModule}
              />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      {/* Details and Code View */}
      <div className="flex-1 p-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              <div className="flex justify-between items-center">
                {`${selectedModule.folder_path} - ${selectedModule.module_name}`}
                <Button onClick={() => navigator.clipboard.writeText(selectedModule.code)}>
                  Copy Code
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4">
              <p>
                <strong>Folder Path:</strong> {selectedModule.folder_path}
              </p>
              <p>
                <strong>Module Name:</strong> {selectedModule.module_name}
              </p>
              <h3 className="mt-4 font-semibold">Acceptance Criteria:</h3>
              <ul className="list-disc list-inside">
                {selectedModule.acceptance_criteria.map((criterion, index) => (
                  <li key={index}>{criterion}</li>
                ))}
              </ul>
            </div>

            <div className="relative p-4" style={{ maxWidth: '90%' }}>
              <SyntaxHighlighter language="javascript" style={darcula}>
                {selectedModule.code}
              </SyntaxHighlighter>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const HomePage = () => {
  const [frontendPath, setFrontendPath] = useState('')
  const [backendPath, setBackendPath] = useState('')
  const [tasks, setTasks] = useState([])
  const [epics, setEPICs] = useState([])
  const [tasksBucket, setTasksBucket] = useState([])
  const [conversation, setConversation] = useState([
    { role: 'assistant', content: 'What do you want to build?' }
  ])
  const [currentInput, setCurrentInput] = useState('')
  const [builderCommand, setBuilderCommand] = useState({})
  const [codes, setCodes] = useState([])

  const [askGhost, { isFetching: queryGhostThinking }] = useLazyProjectManagerGhostQuery()

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

  const toggleTaskCompletion = ({
    tasks,
    taskId,
    isCompleted = false,
    isRunning = false,
    setTasks
  }) => {
    const updateTasks = (tasks) => {
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i]

        if (task.id === taskId) {
          tasks[i].completed = isCompleted
          tasks[i].running = isRunning

          return tasks
        }

        if (task?.subtasks?.length > 0) {
          task.subtasks = updateTasks(task.subtasks)
        }
      }

      return tasks
    }

    const tempTasks = updateTasks([...tasks])
    setTasks(tempTasks)
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
      const epics = apiResponse.epics
      setEPICs(epics)

      setBuilderCommand({
        is_query_clear: true,
        epics: epics,
        reply_to_user: apiResponse?.reply_to_user
      })

      const tempTasks = []
      const tempTasksBucket = []
      for (let i = 0; i < epics.length; i++) {
        const subtasks = []

        for (let j = 0; j < epics[i].stories.length; j++) {
          const subsubtasks = []

          for (let k = 0; k < epics[i].stories[j].tasks.length; k++) {
            tempTasksBucket.push({
              id: epics[i].stories[j].tasks[k].id,
              name: epics[i].stories[j].tasks[k].task,
              completed: false,
              running: false,
              progress: 0
            })

            subsubtasks.push({
              id: epics[i].stories[j].tasks[k].id,
              title: epics[i].stories[j].tasks[k].task,
              completed: false,
              running: false
            })
          }

          subtasks.push({
            id: epics[i].stories[j].id,
            title: epics[i].stories[j].title,
            completed: false,
            running: false,
            subtasks: subsubtasks
          })
        }

        tempTasks.push({
          id: epics[i]?.id,
          title: epics[i]?.title,
          completed: false,
          running: false,
          subtasks
        })
      }

      setTasks(tempTasks)
      setTasksBucket(tempTasksBucket)

      const eventSource = new EventSource(
        `${API_BASE_URL}/${API_PREFIX}/app-service-v2/?job-id=${apiResponse.uid}&ui-dir-path=${frontendPath}&api-dir-path=${backendPath}`
      )

      const tempCodes = []

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)

        console.log('ssr data check : ', data)

        if (data?.type === STATUS) {
          for (const [taskId, value] of Object.entries(data.content)) {
            toggleTaskCompletion({
              tasks: tempTasks,
              taskId,
              isCompleted: value === FINISHED,
              isRunning: value === IN_PROGRESS,
              setTasks
            })

            const tempIndex = tempTasksBucket.map((tt) => tt.id).indexOf(taskId)
            if (tempIndex > -1) {
              tempTasksBucket[tempIndex].running = value === IN_PROGRESS
              tempTasksBucket[tempIndex].completed = value === FINISHED
            }
          }
        } else if (data?.type === CODE) {
          tempCodes.push(data.content)
          setCodes(tempCodes)
        } else if (data?.type === FINISHED) {
          eventSource.close()
        }
      }
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
          <CardTitle>Ghost Builder</CardTitle>
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
          {builderCommand?.is_query_clear ? (
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

      <div
        className=" grid grid-cols-2 gap-6"
        style={{ display: 'flex', justifyContent: 'space-between' }}
      >
        <div style={{ width: '50%' }}>
          <Card>
            <CardHeader>
              <CardTitle>EPIC and Stories</CardTitle>
            </CardHeader>
            <CardContent>
              <RecursiveTaskList tasks={tasks} />
            </CardContent>
          </Card>
        </div>

        {/* Tasks Bucket Card */}
        <div style={{ width: '50%' }}>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Tasks Bucket</CardTitle>
                <span className="text-sm text-gray-500">{tasksBucket.length} tasks</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasksBucket.map((task, index) => (
                  <div key={index} className="flex justify-between items-center border rounded p-2">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center space-x-2">
                        {task.running ? (
                          <CircularProgress size={20} />
                        ) : (
                          <Checkbox checked={task.completed} />
                        )}
                        <span>{task.title}</span>
                      </div>
                      <div className="text-gray-800">{task.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {codes.length > 0 && <ModuleViewer modules={codes} />}
    </div>
  )
}

export default HomePage
