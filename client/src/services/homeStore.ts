import { createContext, useContext } from 'react'
import { MockHomeService } from './mockHomeService.ts'
import type { HomeService } from './models.ts'

let storage: Storage | undefined
try { storage = globalThis.localStorage } catch { /* Browser may block storage. */ }
export const homeService: HomeService = new MockHomeService(storage)
export const HomeServiceContext = createContext<HomeService>(homeService)
export const useHomeService = () => useContext(HomeServiceContext)
