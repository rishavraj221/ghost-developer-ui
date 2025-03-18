import { ElectronAPI } from '@electron-toolkit/preload'

// Ensure `api` and `envs` are declared as types as well
declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      selectFolder: () => Promise<string | null>
      createFile: (filePath: string, fileContent: string) => Promise<string | null>
      createDir: (dirPath: string) => Promise<string | null>
      readDirStructure: (dirPath: string, asArray: boolean) => Promise<string | null>
      pathJoin: (params: [string]) => Promise<string | null>
      readFile: (path: string) => Promise<string | null>
      ping: () => void
    }
    env: {
      API_PREFIX: string
      API_URL: string
      SECRET_KEY: string
    }
  }
}
