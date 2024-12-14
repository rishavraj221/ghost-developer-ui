import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Define custom APIs for renderer
const api = {
  selectFolder: async (): Promise<string | null> => {
    // Expose a method to select a folder
    return ipcRenderer.invoke('select-folder')
  },
  ping: () => {
    // Example of sending a ping message
    ipcRenderer.send('ping')
  }
}

const envs = {
  API_PREFIX: process.env.REACT_APP_API_PREFIX,
  API_URL: process.env.REACT_APP_API_BASE_URL,
  SECRET_KEY: process.env.ELECTRON_APP_SECRET_KEY
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// fallback to global injection (not recommended for production).
if (process.contextIsolated) {
  try {
    // Expose built-in Electron API and custom APIs
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('env', envs)
  } catch (error) {
    console.error('Error exposing APIs to renderer:', error)
  }
} else {
  // Fallback for non-context-isolated environments (unsafe)
  // @ts-ignore (define these in your .d.ts file if needed)
  window.electron = electronAPI
  // @ts-ignore (define these in your .d.ts file if needed)
  window.api = api
  window.env = envs
}
