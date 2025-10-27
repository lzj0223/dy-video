import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const downloadApi = {
  // 命令式 API
  add: (url: string, fileName?: string) => ipcRenderer.invoke('download-add', url, fileName),
  pause: (taskId: string) => ipcRenderer.invoke('download-pause', taskId),
  resume: (taskId: string) => ipcRenderer.invoke('download-resume', taskId),
  cancel: (taskId: string) => ipcRenderer.invoke('download-cancel', taskId),
  getAll: () => ipcRenderer.invoke('download-get-all'),
  getStats: () => ipcRenderer.invoke('download-get-stats'),
  clearCompleted: () => ipcRenderer.invoke('download-clear-completed'),
  getInitialState: () => ipcRenderer.invoke('download-get-initial-state'),

  // 事件监听 API
  onDownloadEvent: <K extends keyof TDownloadEventCallbacks, F extends TDownloadEventCallbacks[K]>(
    channel: K,
    callback: F
  ) => {
    // 清理之前的监听器
    ipcRenderer.removeAllListeners(channel)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ipcRenderer.on(channel, (_event, data: Parameters<F>[0]) => callback(data))
  },

  // 移除事件监听
  removeDownloadListener: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
}
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('downloadApi', downloadApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.downloadApi = downloadApi
}
