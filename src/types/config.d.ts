declare namespace LX {
  type AddMusicLocationType = 'top' | 'bottom'

  interface User {
    name: string
    password: string
    maxSnapshotNum?: number
    'list.addMusicLocationType'?: AddMusicLocationType
  }

  interface Env {
    USER_SYNC: DurableObjectNamespace
    KV: KVNamespace
    LX_USERS: string
    SERVER_NAME: string
  }
}
