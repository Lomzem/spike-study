import { createContext } from 'svelte'
import { writable, type Writable } from 'svelte/store'

const [useConvexAuthReady, setConvexAuthReadyContext] =
  createContext<Writable<boolean>>()

export function provideConvexAuthReady() {
  const convexAuthReady = writable(false)
  setConvexAuthReadyContext(convexAuthReady)
  return convexAuthReady
}

export { useConvexAuthReady }
