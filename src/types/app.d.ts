import { type ListEventType } from '@/modules/list/event'
import { type DislikeEventType } from '@/modules/dislike/event'

declare global {
  // eslint-disable-next-line no-var
  var event_list: ListEventType
  // eslint-disable-next-line no-var
  var event_dislike: DislikeEventType
}

export {}
