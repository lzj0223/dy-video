// 定义事件回调类型
type TTaskUpdateCallback = (data: { task: TDownloadTask; timestamp: string; type: string }) => void

type TBatchUpdateCallback = (data: {
  tasks: TDownloadTask[]
  timestamp: string
  type: string
}) => void

type TStatsUpdateCallbackData = {
  stats: TDownloadQueueStats
  timestamp: string
  type: string
}
type TStatsUpdateCallback = (data: TStatsUpdateCallbackData) => void

type TGenericCallback = (data: unknown) => void

// 定义事件映射接口
type TDownloadEventCallbacks = {
  'download-task-updated': TTaskUpdateCallback
  'download-queued': TTaskUpdateCallback
  'download-started': TTaskUpdateCallback
  'download-progress': TTaskUpdateCallback
  'download-paused': TTaskUpdateCallback
  'download-resumed': TTaskUpdateCallback
  'download-completed': TTaskUpdateCallback
  'download-cancelled': TTaskUpdateCallback
  'download-interrupted': TTaskUpdateCallback
  'download-batch-update': TBatchUpdateCallback
  'download-queue-stats': TStatsUpdateCallback
  'download-initial-state': TGenericCallback
  'download-completed-cleared': TGenericCallback
}
