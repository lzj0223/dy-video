import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  type TDownloadApi = {
    add: (url: string, fileName?: string) => Promise<void>
    pause: (taskId: string) => Promise<void>
    resume: (taskId: string) => Promise<void>
    cancel: (taskId: string) => Promise<void>
    getAll: () => Promise<void>
    getStats: () => Promise<void>
    clearCompleted: () => Promise<void>
    getInitialState: () => Promise<void>
    onDownloadEvent: <
      K extends keyof TDownloadEventCallbacks,
      F extends TDownloadEventCallbacks[K]
    >(
      channel: K,
      callback: F
    ) => void
  }

  interface Window {
    electron: ElectronAPI
    downloadApi: TDownloadApi
  }
}
