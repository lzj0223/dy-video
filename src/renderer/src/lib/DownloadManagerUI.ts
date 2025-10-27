// 在渲染进程中监听下载事件
class DownloadManagerUI {
  private downloadApi: TDownloadApi
  constructor() {
    this.setupEventListeners()
    this.requestInitialState()

    this.downloadApi = window.downloadApi
  }

  private setupEventListeners(): void {
    // 监听单个任务更新
    this.downloadApi.onDownloadEvent('download-task-updated', (data) => {
      this.updateTaskUI(data.task)
    })

    // 监听任务进度更新
    this.downloadApi.onDownloadEvent('download-progress', (data) => {
      this.updateProgress(data.task)
    })

    // 监听任务状态变化
    this.downloadApi.onDownloadEvent('download-started', (data) => {
      console.log(`Download started: ${data.task.fileName}`)
    })

    this.downloadApi.onDownloadEvent('download-completed', (data) => {
      console.log(`Download completed: ${data.task.fileName}`)
      this.showCompletionMessage(data.task)
    })

    this.downloadApi.onDownloadEvent('download-paused', (data) => {
      console.log(`Download paused: ${data.task.fileName}`)
    })

    // 监听批量更新
    this.downloadApi.onDownloadEvent('download-batch-update', (data) => {
      this.refreshTaskList(data.tasks)
    })

    // 监听队列统计更新
    this.downloadApi.onDownloadEvent('download-queue-stats', (data) => {
      this.updateStatsDisplay(data.stats)
    })

    // 监听初始状态
    this.downloadApi.onDownloadEvent('download-initial-state', (data) => {
      this.initializeUI(data.tasks, data.stats)
    })
  }

  private async requestInitialState(): Promise<void> {
    await this.downloadApi.getInitialState()
  }

  private updateTaskUI(task: TDownloadTask): void {
    // 更新单个任务的 UI
    // const taskElement = document.querySelector(`[data-task-id="${task.id}"]`)
    // if (taskElement) {
    //   this.updateTaskElement(taskElement, task)
    // }
    console.log('Task updated:', task)
  }

  private updateProgress(task: TDownloadTask): void {
    // 更新进度条和速度显示
    // const progressElement = document.querySelector(`[data-task-id="${task.id}"] .progress`)
    // const speedElement = document.querySelector(`[data-task-id="${task.id}"] .speed`)
    //
    // if (progressElement) {
    //   progressElement.textContent = `${Math.round(task.progress * 100)}%`
    // }
    //
    // if (speedElement) {
    //   speedElement.textContent = this.formatSpeed(task.speed)
    // }
    console.log('updateProgress:', task)
  }

  private refreshTaskList(tasks: TDownloadTask[]): void {
    // 刷新整个任务列表
    // 实现你的 UI 更新逻辑
    console.log('Tasks updated:', tasks)
  }

  private updateStatsDisplay(stats: TDownloadQueueStats): void {
    // 更新统计信息显示
    console.log('Queue stats updated:', stats)
  }

  private initializeUI(tasks: TDownloadTask[], stats: TDownloadQueueStats): void {
    // 使用初始数据初始化 UI
    this.refreshTaskList(tasks)
    this.updateStatsDisplay(stats)
  }

  public formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond === 0) return '0 B/s'
    const k = 1024
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k))
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  private showCompletionMessage(task: TDownloadTask): void {
    // 显示下载完成通知
    if (Notification.permission === 'granted') {
      new Notification('下载完成', {
        body: `文件 "${task.fileName}" 下载完成`,
        icon: '/path/to/icon.png'
      })
    }
  }
}

export default new DownloadManagerUI()
