import { app, shell, BrowserWindow, ipcMain, globalShortcut, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'
import { getFolderStructure } from './functions.js'

// Load environment variables
config()

let mainWindow: BrowserWindow | null = null

// Function to create the main browser window
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false // Disable sandboxing if not required
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()

    // Open DevTools in development mode
    if (is.dev) {
      mainWindow?.webContents.openDevTools()
    }

    // Register a global shortcut to toggle DevTools
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      if (mainWindow?.webContents.isDevToolsOpened()) {
        mainWindow?.webContents.closeDevTools()
      } else {
        mainWindow?.webContents.openDevTools()
      }
    })
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the appropriate content (development or production)
  const rendererURL = process.env['ELECTRON_RENDERER_URL']
  if (is.dev && rendererURL) {
    mainWindow
      .loadURL(rendererURL)
      .catch((err) => console.error('Failed to load renderer URL:', err))
  } else {
    mainWindow
      .loadFile(join(__dirname, '../renderer/index.html'))
      .catch((err) => console.error('Failed to load index.html:', err))
  }

  // Cleanup when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Function to set up IPC handlers
function setupIpcHandlers(): void {
  // IPC handler for folder selection
  ipcMain.handle('select-folder', async () => {
    if (!mainWindow) {
      console.warn('Main window is not available for folder selection.')
      return null
    }
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('create-file', async (_event, filePath: string, content: string) => {
    try {
      const dir = path.dirname(filePath)

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      fs.writeFileSync(filePath, content, 'utf8')
      return { success: true }
    } catch (error) {
      // Narrowing down the type of `error`
      if (error instanceof Error) {
        console.error('Error creating file:', error.message)
        return { success: false, error: error.message }
      }
      console.error('Unknown error occurred')
      return { success: false, error: 'An unknown error occurred' }
    }
  })

  ipcMain.handle('create-dir', async (_event, dirPath: string) => {
    try {
      fs.mkdirSync(dirPath, { recursive: true })
      return { success: true }
    } catch (error) {
      // Narrowing down the type of `error`
      if (error instanceof Error) {
        console.error('Error creating directory:', error.message)
        return { success: false, error: error.message }
      }
      console.error('Unknown error occurred')
      return { success: false, error: 'An unknown error occurred' }
    }
  })

  ipcMain.handle('read-dir-structure', async (_event, dirPath: string, asArray: boolean) => {
    try {
      const res = await getFolderStructure({ dirPath, as_array: asArray })
      return res
    } catch (error) {
      // Narrowing down the type of `error`
      if (error instanceof Error) {
        console.error('Error creating directory:', error.message)
        return { success: false, error: error.message }
      }
      console.error('Unknown error occurred')
      return { success: false, error: 'An unknown error occurred' }
    }
  })

  ipcMain.handle('path-join', async (_event, params: [string]) => {
    try {
      const res = path.join(...params)
      return res
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message)
      }
      console.error('unknown error occurred')
      return 'Error'
    }
  })

  ipcMain.handle('read-file', async (_event, path: string) => {
    try {
      const res = fs.readFileSync(path, 'utf8')
      return res
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message)
      }
      console.error('unknown error occurred')
      return 'Error'
    }
  })

  // Example: Test IPC communication
  ipcMain.on('ping', () => console.log('pong received from renderer'))
}

// App lifecycle management
app.whenReady().then(() => {
  // Set application user model ID (Windows only)
  electronApp.setAppUserModelId('com.electron')

  // Watch shortcuts in development mode
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow() // Create the main window
  setupIpcHandlers() // Set up IPC handlers

  // Re-create the window when the app is activated (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Clean up resources when the app is quitting
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
