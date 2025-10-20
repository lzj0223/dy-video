type TiktokAuthorConfigItem = {
  name: string // 作者姓名
}

type TiktokCollectionConfigItem = {
  mixId: string // 合计id
  cookies: string
  name: string // 合集名称
}

type TiktokAwemeItem = {
  id: string
  title: string
  url: string
  raw: TRawItem | null | undefined
}

type TRawItem = {
  aweme_id: string
  item_title: string
  video: {
    play_addr: { url_list: string[] }
    bit_rate?: {
      play_addr: {
        url_list: string[]
      }
    }[]
  }
}
