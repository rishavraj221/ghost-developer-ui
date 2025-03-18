import { Badge, DropdownMenu } from '@radix-ui/themes'
import React, { useCallback, useMemo, useState } from 'react'
import { createEditor, Transforms, Text, Range } from 'slate'
import { Slate, Editable, withReact, ReactEditor } from 'slate-react'

const options = ['Option 1', 'Option 2', 'Option 3']

const RichEditor = () => {
  const editor = useMemo(() => withReact(createEditor()), [])
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  const initialValue = [
    {
      type: 'paragraph',
      children: [{ text: 'Type "/" to see the dropdown' }]
    }
  ]

  const handleKeyDown = (event) => {
    if (event.key === '/') {
      const { selection } = editor
      if (selection && Range.isCollapsed(selection)) {
        const domRange = ReactEditor.toDOMRange(editor, selection)
        const rect = domRange.getBoundingClientRect()
        setDropdownPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX })
        setShowDropdown(true)
      }
    }
  }

  const handleSelectOption = (option) => {
    const badge = {
      type: 'badge',
      children: [{ text: option }]
    }
    Transforms.insertNodes(editor, badge)
    setShowDropdown(false)
  }

  const renderElement = useCallback((props) => {
    const { attributes, children, element } = props
    if (element.type === 'badge') {
      return (
        <span {...attributes}>
          <Badge>{children}</Badge>{' '}
        </span>
      )
    }
    return <span {...attributes}>{children}</span>
  }, [])

  return (
    <>
      <Slate editor={editor} initialValue={initialValue} onChange={(value) => console.log(value)}>
        <Editable
          style={{ width: '100%', height: 300 }}
          // rows={10}
          placeholder="Type here..."
          onKeyDown={handleKeyDown}
          renderElement={renderElement}
        />

        <DropdownMenu.Root open={showDropdown}>
          <DropdownMenu.Content
            // sideOffset={5}
            style={{
              position: 'absolute',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: 300
            }}
            onEscapeKeyDown={() => setShowDropdown(false)}
            onInteractOutside={() => setShowDropdown(false)}
          >
            {options.map((option, index) => (
              <DropdownMenu.Item key={index} onMouseDown={() => handleSelectOption(option)}>
                {option}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        {/* // <ul
            //   style={{
            //     position: 'absolute',
            //     top: dropdownPosition.top,
            //     left: dropdownPosition.left,
            //     background: 'white',
            //     border: '1px solid #ddd',
            //     listStyle: 'none',
            //     padding: '5px'
            //   }}
            // >
            //   {options.map((option, index) => (
            //     <li
            //       key={index}
            //       style={{ padding: '5px', cursor: 'pointer' }}
            //       onMouseDown={() => handleSelectOption(option)}
            //     >
            //       {option}
            //     </li>
            //   ))}
            // </ul> */}
      </Slate>
    </>
  )
}

export default RichEditor
