import { useSyncExternalStore } from 'react'
import { useHomeService } from './homeStore'

export function useHome() {
  const service = useHomeService()
  const snapshot = useSyncExternalStore(service.subscribe, service.getSnapshot, service.getSnapshot)
  return { ...snapshot, service }
}
