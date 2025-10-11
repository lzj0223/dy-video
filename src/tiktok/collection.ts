const API = 'https://www.douyin.com/aweme/v1/web/mix/aweme/'

import axios, { AxiosInstance } from 'axios'

export default class Collection {
  private request: AxiosInstance

  private mixId: string

  private cursor: number = 0

  private count: number = 20

  constructor(config: TiktokCollectionConfigItem) {
    this.request = axios.create({
      baseURL: API,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Cookie: config.cookies
      }
    })
    this.mixId = config.mixId
  }

  async fetchList(): Promise<{
    list: TiktokAwemeItem[]
    hasMore: boolean
  }> {
    const resp: {
      aweme_list: TRawItem[]
      has_more: number
    } = await this.request.get(API, {
      params: {
        mix_id: this.mixId,
        cursor: this.cursor,
        count: this.count
      }
    })

    this.cursor += this.count
    return {
      list: resp.aweme_list.map((item) => ({
        id: item.aweme_id,
        title: item.item_title,
        url:
          item.video?.bit_rate?.[0]?.play_addr?.url_list?.[0] ??
          item.video?.play_addr?.url_list?.[0],
        raw: item
      })),
      hasMore: resp.has_more >= 1
    }
  }
}
