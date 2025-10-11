import axios, { AxiosInstance } from 'axios'
import download from 'nodejs-file-downloader'
import { resolve } from 'node:path'
import filenamify from 'filenamify'
import { ensureDir } from 'fs-extra'

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  Referer: 'https://www.douyin.com/'
}

export default class Download {
  private saveDir: string

  private request: AxiosInstance

  constructor(config: TiktokCollectionConfigItem, author: TiktokAuthorConfigItem) {
    this.saveDir = resolve(filenamify(author.name), filenamify(config.name))
    this.request = axios.create({
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Referer: 'https://www.douyin.com/'
      }
    })
  }

  async download(item: TiktokAwemeItem): Promise<void> {
    const fileName = `${filenamify(item.title)}.mp4`

    try {
      await ensureDir(this.saveDir)
    } catch (error) {
      console.error('downloadVideoQueue: 下载目录创建失败', error)
      throw error
    }

    let totalSize: string = '0'
    new download({
      url: item.url,
      directory: this.saveDir,
      fileName,
      headers,
      maxAttempts: 3,
      skipExistingFileName: true,
      onResponse: (response) => {
        totalSize = getFileSize(response.headers['content-length'])
        return true
      },
      onProgress: (percentage) => {
        parentPort.postMessage({ type: 'progress', message: { id, percentage, totalSize } })
      },
      onBeforeSave: (finalName) => {
        if (last) parentPort.postMessage({ type: 'record', record: true })
        return finalName
      }
    })
  }
}
