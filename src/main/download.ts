// DownloadQueueManager.ts
import Datastore from 'nedb-promises'
import { basename, join } from 'path'
import { app, DownloadItem, session, ipcMain, BrowserWindow } from 'electron'

export class DownloadQueueManager {
  private db: Datastore<unknown>
  private activeDownloads: Map<string, DownloadItem> = new Map()
  private concurrentLimit: number = 2 // 默认并发下载数为2
  private queue: TDownloadTask[] = []
  private mainWindow: BrowserWindow
  constructor(mainWindow: BrowserWindow) {
    // 初始化 NeDB 数据库，数据文件存放在用户数据目录
    this.db = Datastore.create({
      filename: join(app.getPath('userData'), 'downloads.db'),
      autoload: true,
      timestampData: true // 自动添加 createdAt 和 updatedAt 字段
    })
    this.mainWindow = mainWindow

    this.restoreQueue()

    this.setupSessionHandler()
    this.setupIpcHandlers()
  }

  // 恢复未完成的下载队列
  private async restoreQueue(): Promise<void> {
    try {
      // 查找所有未最终完成的任务

      this.queue = await this.db.find({
        status: { $in: ['queued', 'downloading', 'paused', 'interrupted'] }
      })

      // 将之前正在下载的任务重置为中断状态，等待重新加入队列
      for (const task of this.queue) {
        if (task.status === 'downloading') {
          task.status = 'interrupted'
          await this.updateTaskInDb(task)
        }
      }

      this.processQueue() // 重启队列处理
    } catch (error) {
      console.error('Failed to restore download queue:', error)
    }
  }

  // 设置 Electron 的下载事件处理器
  private setupSessionHandler(): void {
    session.defaultSession.on('will-download', (_event, item) => {
      const task = this.queue.find((t) => t.url === item.getURLChain()[0])
      if (task) {
        this.handleDownloadItem(task, item)
      }
    })
  }

  private setupIpcHandlers(): void {
    // 添加下载任务
    ipcMain.handle('download-add', async (_event, url: string, fileName?: string) => {
      return await this.addDownload(url, fileName)
    })

    // 暂停下载
    ipcMain.handle('download-pause', async (_event, taskId: string) => {
      await this.pauseDownload(taskId)
    })

    // 恢复下载
    ipcMain.handle('download-resume', async (_event, taskId: string) => {
      await this.resumeDownload(taskId)
    })

    // 取消下载
    ipcMain.handle('download-cancel', async (_event, taskId: string) => {
      await this.cancelDownload(taskId)
    })

    // 获取所有任务
    ipcMain.handle('download-get-all', async () => {
      return await this.getAllTasks()
    })

    // 获取队列统计
    ipcMain.handle('download-get-stats', async () => {
      return await this.getQueueStats()
    })

    // 清空已完成任务
    ipcMain.handle('download-clear-completed', async () => {
      await this.clearCompleted()
    })
  }

  // 处理具体的下载项
  private handleDownloadItem(task: TDownloadTask, item: DownloadItem): void {
    // 阻止 Electron 默认的保存对话框
    const fileName = task.fileName || basename(item.getURLChain()[0])
    const savePath = join(app.getPath('downloads'), fileName)

    item.setSavePath(savePath)
    task.savePath = savePath
    task.status = 'downloading'
    task.startTime = new Date().toISOString()

    this.activeDownloads.set(task.id, item)

    // 监听下载进度更新
    item.on('updated', (_event, state) => {
      if (state === 'interrupted') {
        task.status = 'interrupted'
        this.updateTaskInDb(task)
      } else if (state === 'progressing') {
        task.receivedBytes = item.getReceivedBytes()
        task.totalBytes = item.getTotalBytes()
        task.progress =
          item.getTotalBytes() > 0 ? item.getReceivedBytes() / item.getTotalBytes() : 0

        // 这里可以添加下载速度计算逻辑
        this.updateTaskInDb(task)
        this.emitTaskUpdate(task)
      }
    })

    // 监听下载完成事件
    item.once('done', (_event, state) => {
      this.activeDownloads.delete(task.id)

      switch (state) {
        case 'completed':
          task.status = 'completed'
          task.progress = 1
          break
        case 'cancelled':
          task.status = 'cancelled'
          break
        case 'interrupted':
          task.status = 'interrupted'
          break
      }

      task.endTime = new Date().toISOString()
      this.updateTaskInDb(task)
      this.processQueue() // 开始下一个任务
    })
  }

  // 添加下载任务到队列
  public async addDownload(url: string, fileName?: string): Promise<string> {
    const task: TDownloadTask = {
      id: this.generateTaskId(),
      url,
      fileName: fileName || basename(url),
      savePath: '',
      status: 'queued',
      addedTime: new Date().toISOString(),
      receivedBytes: 0,
      totalBytes: 0,
      progress: 0,
      speed: 0
    }

    // 保存到数据库和内存队列
    await this.db.insert(task)
    this.queue.push(task)

    this.processQueue()
    return task.id
  }

  // 暂停下载任务
  public async pauseDownload(taskId: string): Promise<void> {
    const task = this.queue.find((t) => t.id === taskId)
    if (!task) return
    const downloadItem = this.activeDownloads.get(taskId)

    if (downloadItem && !downloadItem.isPaused()) {
      downloadItem.pause()
      task.status = 'paused'
      await this.updateTaskInDb(task)
    } else if (task && task.status === 'queued') {
      task.status = 'paused'
      await this.updateTaskInDb(task)
    }
  }

  // 恢复下载任务
  public async resumeDownload(taskId: string): Promise<void> {
    const task = this.queue.find((t) => t.id === taskId)
    if (!task) return
    const downloadItem = this.activeDownloads.get(taskId)

    if (downloadItem && downloadItem.isPaused()) {
      downloadItem.resume()
      task.status = 'downloading'
      await this.updateTaskInDb(task)
    } else if (task && (task.status === 'paused' || task.status === 'interrupted')) {
      task.status = 'queued'
      await this.updateTaskInDb(task)
      this.processQueue()
    }
  }

  // 取消下载任务
  public async cancelDownload(taskId: string): Promise<void> {
    const task = this.queue.find((t) => t.id === taskId)
    if (!task) return
    const downloadItem = this.activeDownloads.get(taskId)

    if (downloadItem) {
      downloadItem.cancel()
    }

    if (task) {
      task.status = 'cancelled'
      task.endTime = new Date().toISOString()
      await this.updateTaskInDb(task)
      this.queue = this.queue.filter((t) => t.id !== taskId)
    }
  }

  // 处理下载队列，控制并发
  private async processQueue(): Promise<void> {
    const activeCount = this.queue.filter((t) => t.status === 'downloading').length
    const availableSlots = this.concurrentLimit - activeCount

    if (availableSlots <= 0) return

    // 找到等待中的任务（队列中或中断的）
    const pendingTasks = this.queue
      .filter((t) => t.status === 'queued' || t.status === 'interrupted')
      .slice(0, availableSlots)

    for (const task of pendingTasks) {
      task.status = 'downloading'
      await this.updateTaskInDb(task)

      // 触发 will-download 事件
      session.defaultSession.downloadURL(task.url)
    }
  }

  // 更新数据库中的任务信息
  private async updateTaskInDb(task: TDownloadTask): Promise<void> {
    await this.db.update({ id: task.id }, { $set: task }, {})
  }

  // 生成唯一任务ID
  private generateTaskId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 发送任务更新事件（可通过 IPC 发送到渲染进程）
  private emitTaskUpdate(task: TDownloadTask): void {
    // 这里可以通过 IPC 将更新发送到渲染进程
    this.mainWindow.webContents.send('download-update', task)
    console.log(task)
  }

  // 获取队列统计信息
  public async getQueueStats(): Promise<TDownloadQueueStats> {
    const stats: TDownloadQueueStats = {
      total: 0,
      queued: 0,
      downloading: 0,
      completed: 0,
      paused: 0,
      cancelled: 0,
      interrupted: 0
    }

    const tasks: TDownloadTask[] = await this.db.find({})
    tasks.forEach((task) => {
      stats.total++
      if (stats[task.status] !== undefined) {
        stats[task.status]++
      }
    })

    return stats
  }

  // 获取所有任务
  public async getAllTasks(): Promise<TDownloadTask[]> {
    return ((await this.db.find({}).sort({ createdAt: -1 })) ?? []) as TDownloadTask[]
  }

  // 清空已完成的任务
  public async clearCompleted(): Promise<void> {
    await this.db.remove({ status: 'completed' }, { multi: true })
    this.queue = this.queue.filter((t) => t.status !== 'completed')
  }
}
