import { createStore, del, get, set } from 'idb-keyval'

export interface BlobCache {
  get: (key: string) => Promise<Blob | undefined>
  set: (key: string, value: Blob) => Promise<void>
  del: (key: string) => Promise<void>
}

export function createBlobCache(dbName: string, storeName: string): BlobCache {
  const store = createStore(dbName, storeName)
  return {
    get: (key) => get<Blob>(key, store),
    set: (key, value) => set(key, value, store),
    del: (key) => del(key, store),
  }
}
