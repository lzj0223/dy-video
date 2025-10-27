// types.ts
type TDownloadTask = {
  id: string // 任务唯一ID
  url: string // 下载文件URL
  fileName: string // 用户指定文件名
  savePath: string // 文件实际保存路径
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'cancelled' | 'interrupted'
  addedTime: string // ISO 8601格式的任务添加时间
  startTime?: string // 下载开始时间
  endTime?: string // 下载结束时间
  receivedBytes: number // 已接收字节数
  totalBytes: number // 文件总字节数
  progress: number // 下载进度 (0-1)
  speed: number // 下载速度 (字节/秒)
}

type TDownloadQueueStats = {
  total: number
  queued: number
  downloading: number
  completed: number
  paused: number
  cancelled: number
  interrupted: number
}
