// File: src/pages/CodeAssistant.js
import React, { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import {
  Section,
  Container,
  Flex,
  Grid,
  Box,
  TextField,
  Button,
  TextArea,
  Text,
  Card,
  Heading,
  Badge,
  Dialog,
  IconButton,
  Separator,
  Spinner,
  Switch
} from '@radix-ui/themes'
import { FaGhost, FaCog, FaPlus, FaPencilAlt, FaTrash } from 'react-icons/fa'
import RichEditor from '../components/RichEditor'
import {
  useLazyGhostBuilderQuery,
  useLazyProjectManagerGhostQuery
} from '../redux/services/base-app'
import path from 'path'

const DEFAULT_CODEBASE = {
  title: '',
  path: '',
  techStack: '',
  isEditing: true
}

const CODEBASE_ID_PREFIX = 'CB_'

const DEFAULT_ASSISTANT_MESSAGE = { role: 'assistant', content: 'What do you want to build?' }

const CodeAssistant = () => {
  const [codebases, setCodebases] = useState([DEFAULT_CODEBASE])
  const [conversation, setConversation] = useState([DEFAULT_ASSISTANT_MESSAGE])
  const [contextConversation, setContextConversation] = useState([])
  const [currentInput, setCurrentInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attachCodebaseInfo, setAttachCodebaseInfo] = useState(false)

  const [ghostBuilder] = useLazyGhostBuilderQuery()

  const getCodebaseInfo = async () => {
    let codebaseInfo = ''

    if (!attachCodebaseInfo) return codebaseInfo

    const tempCodebases = [...getConnectedCodebases()]

    for (let i = 0; i < tempCodebases.length; i++) {
      const codebase = tempCodebases[i]

      const dirStructure = await window.api.readDirStructure(codebase.path, true)

      codebaseInfo += `\n\n**Codebase ${i + 1}**\n\n`
      codebaseInfo += `Tech Stack - ${codebase.techStack}\n`
      codebaseInfo += `Codebase Id - ${CODEBASE_ID_PREFIX}${i + 1}\n`
      codebaseInfo += `Folder Structure - \n${dirStructure.join('\n')}`
    }

    console.log(codebaseInfo)

    return codebaseInfo
  }

  const getCodeInfo = async (userInput) => {
    let codeInfo = ''

    if (!attachCodebaseInfo) return codeInfo

    const matches = [...userInput.matchAll(/\$(.*?)\$/g)].map((match) => match[1])
    console.log('matches', matches)

    for (let i = 0; i < matches.length; i++) {
      const codeTitle = matches[i].split('/')[0]
      const relativePath = matches[i].replace(`${codeTitle}/`, '')

      console.log('code title', codeTitle)
      console.log('relative path', relativePath)

      const temp = getConnectedCodebases().filter((cd) => cd.title === codeTitle)
      console.log('temp', temp)

      if (temp.length > 0) {
        const codebaseIndex = getConnectedCodebases()
          .map((cd) => cd.title)
          .indexOf(codeTitle)
        console.log('codebase index', codebaseIndex)

        const codePath = await window.api.pathJoin([temp[0].path, relativePath])
        console.log('code path', codePath)

        const code = await window.api.readFile(codePath)

        codeInfo += `\n\n**Code Info:**\n\n`
        codeInfo += `Codebase Id: ${CODEBASE_ID_PREFIX}${codebaseIndex + 1}\n`
        codeInfo += `File Path: ${CODEBASE_ID_PREFIX}${codebaseIndex + 1}/${matches[i].replace(`${codeTitle}/`, '')}\n`
        codeInfo += `File Code: \n`
        codeInfo += code
      }
    }

    console.log(codeInfo)

    return codeInfo
  }

  const handleUserInput = async (e) => {
    if (currentInput.trim() === '') return

    const tempConversation = [...conversation]
    tempConversation.push({
      role: 'user',
      content: currentInput
    })
    setConversation(tempConversation)

    const codebaseInfo = await getCodebaseInfo()
    const codeInfo = await getCodeInfo(currentInput)

    try {
      setIsLoading(true)

      const res = await ghostBuilder({
        conversation: tempConversation,
        codebase_info: codebaseInfo,
        code_info: codeInfo
      }).unwrap()

      if (res?.context || res?.user_response || res?.doubt_to_ask) {
        setConversation([
          ...tempConversation,
          {
            role: 'assistant',
            content: res?.doubt_to_ask || res?.user_response
          }
        ])

        if (res?.codes?.length > 0) {
          for (let i = 0; i < res.codes.length; i++) {
            const code = res.codes[i]
            console.log('code', code)

            const codebase_index = parseInt(code.codebase_id.replace(CODEBASE_ID_PREFIX, '')) - 1
            console.log('codebase index', codebase_index)

            const full_path = await window.api.pathJoin([codebases[codebase_index].path, code.path])
            console.log('full path', full_path)

            await window.api.createFile(full_path, code.code)
          }
        }
      }
    } catch (ex) {
      console.log(ex)
    } finally {
      setIsLoading(false)
    }

    setCurrentInput('')
  }

  const handleUpdateCodebase = (e, index, name) => {
    const tempCodebases = [...codebases]

    tempCodebases[index][name] = e.target.value

    setCodebases(tempCodebases)
  }

  const handleSelectDirectory = async (index) => {
    const tempCodebases = [...codebases]

    const path = await window.api.selectFolder()

    if (!path) return

    tempCodebases[index].path = path

    setCodebases(tempCodebases)
  }

  const handleCreateNewFile = async (filePath, fileContent) => {
    const result = await window.api.createFile(filePath, fileContent)

    console.log(result)
  }

  const handleCreateNewDirectory = async (dirPath) => {
    const result = await window.api.createDir(dirPath)

    console.log(result)
  }

  const handleAddCodebaseDisabled = () => {
    return codebases.at(-1).path && codebases.at(-1).title
  }

  const handleAddCodebase = () => {
    const tempCodebases = [...codebases]

    tempCodebases.at(-1).isEditing = false

    tempCodebases.push({
      title: '',
      path: '',
      techStack: '',
      isEditing: true
    })

    setCodebases(tempCodebases)
  }

  const handleEditCodebase = (index) => {
    const tempCodebases = [...codebases]

    const codebase = tempCodebases.splice(index, 1)

    tempCodebases[tempCodebases.length - 1].title = codebase[0].title
    tempCodebases[tempCodebases.length - 1].techStack = codebase[0].techStack
    tempCodebases[tempCodebases.length - 1].path = codebase[0].path

    setCodebases(tempCodebases)
  }

  const handleRemoveCodebase = (index) => {
    const tempCodebases = [...codebases]

    tempCodebases.splice(index, 1)

    setCodebases(tempCodebases)
  }

  const getConnectedCodebases = () => {
    return codebases.filter((cd) => !cd.isEditing)
  }

  const handleResetConversation = () => {
    setConversation([DEFAULT_ASSISTANT_MESSAGE])
  }

  return (
    <Dialog.Root>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Connect Codebases</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Connect your frontend and backend codebases
        </Dialog.Description>

        {codebases.map((cd, i) => (
          <Flex key={i} direction="column" gap="3">
            {cd.isEditing ? (
              <>
                {getConnectedCodebases().length > 0 && <Separator my="2" size="4" />}
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Codebase Title
                  </Text>
                  <TextField.Root
                    value={cd.title}
                    onChange={(e) => handleUpdateCodebase(e, i, 'title')}
                    placeholder="Eg. UI / Frontend ..."
                  />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Tech Stack
                  </Text>
                  <TextField.Root
                    value={cd.techStack}
                    onChange={(e) => handleUpdateCodebase(e, i, 'techStack')}
                    placeholder="Eg. React, Material UI"
                  />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Select Codebase
                  </Text>
                  <TextField.Root
                    value={cd.path}
                    readOnly
                    onClick={() => handleSelectDirectory(i)}
                    placeholder="Eg. /Users/user/Documents/react-ui ..."
                  />
                </label>
              </>
            ) : (
              <Flex overflow="hidden" align="center" justify="between" gap="3" mb="4">
                <Flex align="center" gap="3" overflow="hidden">
                  <Heading size="4">{cd.title}</Heading>

                  <Flex overflowX="scroll">
                    <Badge size="3">{cd.path}</Badge>
                  </Flex>
                </Flex>

                <IconButton size="1" variant="ghost" onClick={() => handleEditCodebase(i)}>
                  <FaPencilAlt />
                </IconButton>

                <IconButton
                  size="1"
                  variant="ghost"
                  color="tomato"
                  onClick={() => handleRemoveCodebase(i)}
                >
                  <FaTrash />
                </IconButton>
              </Flex>
            )}
          </Flex>
        ))}

        <Flex mt="4">
          <Button
            variant="outline"
            disabled={!handleAddCodebaseDisabled()}
            onClick={handleAddCodebase}
          >
            <FaPlus /> Add Codebase
          </Button>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <Button>Save</Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>

      <Container className="w-full h-screen">
        <Flex direction="column" className="h-screen box-border">
          <Flex p="4" align="center" justify="between">
            <Flex align="center" gap="3">
              <FaGhost className="text-gray-700 w-5 h-5" />
              <Heading size="4">Ghost Builder</Heading>

              {getConnectedCodebases().length > 0 && (
                <Badge color="blue">{`${getConnectedCodebases().length} codebases connected`}</Badge>
              )}

              <Dialog.Trigger>
                <Button variant="outline" radius="full" size="2">
                  {getConnectedCodebases().length > 0 ? 'Modify' : 'Connect'}
                </Button>
              </Dialog.Trigger>
            </Flex>

            <Flex gap="3" align="center">
              {conversation.length > 1 && (
                <Button variant="soft" onClick={handleResetConversation}>
                  Reset
                </Button>
              )}
              <FaCog className="text-gray-600 w-5 h-5" />
            </Flex>
          </Flex>

          <Flex
            direction="column"
            flexGrow="1"
            overflowY="auto"
            gap="2"
            p="4"
            className="bg-gray-50"
          >
            {conversation.map((msg, index) => (
              <Flex key={index} align="center" justify={msg.role === 'user' ? 'end' : 'start'}>
                <Card className={`${msg.role === 'user' ? 'bg-blue-400' : ''} max-w-xl`}>
                  <Flex align="center" gap="2">
                    <Markdown
                      remarkPlugins={[remarkMath, remarkGfm]} // Include both plugins
                      rehypePlugins={[rehypeKatex]}
                      className="text-sm"
                    >
                      {msg.content}
                    </Markdown>
                  </Flex>
                </Card>
              </Flex>
            ))}

            {isLoading && <Spinner size="2" />}
          </Flex>

          <Flex direction="column" gap="4" p="4">
            <Text as="label" size="2">
              <Flex align="center" gap="2">
                <Switch
                  value={attachCodebaseInfo}
                  onClick={(e) => setAttachCodebaseInfo(!attachCodebaseInfo)}
                />{' '}
                Attach Codebase Info
              </Flex>
            </Text>

            <Flex align="center" justify="between" gap="2">
              <TextArea
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Mention engineering terms to do"
                className="w-full"
                variant="classic"
                size="3"
                rows={8}
              />
              <Button onClick={handleUserInput}>Send</Button>
            </Flex>
          </Flex>
        </Flex>
      </Container>
    </Dialog.Root>
  )
}

export default CodeAssistant
