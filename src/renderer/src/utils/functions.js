import fs from 'fs'
import path from 'path'

const foldersToSkip = ['node_modules', 'venv', '__pycache__', '.next', '.git', 'out']

export const getFolderStructure = ({ dir, depth = 0, as_array = false }) => {
  const files = fs.readdirSync(dir)
  const folderStructure = []

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    // Skip folders listed in foldersToSkip
    if (stat.isDirectory() && foldersToSkip.includes(file)) {
      return // Skip this folder and continue
    }

    if (stat.isDirectory()) {
      folderStructure.push({
        name: file,
        type: 'directory',
        children: getFolderStructure({ dir: filePath, depth: depth + 1 })
      })
    } else {
      folderStructure.push({
        name: file,
        type: 'file'
      })
    }
  })

  if (as_array) return getFolderStructureArray(folderStructure)

  return folderStructure
}

function getFolderStructureArray(structure, indent = '') {
  let result = [] // Initialize an array to hold the folder structure

  structure.forEach((item) => {
    // Add the current item to the result array with its name and indentation
    result.push(`${indent}- ${item.name}`)

    // If the item is a directory and has children, process its children recursively
    if (item.type === 'directory' && item.children) {
      const children = getFolderStructureArray(item.children, indent + '  ')
      result = result.concat(children) // Concatenate the result with the children's structure
    }
  })

  return result // Return the final structure array
}
