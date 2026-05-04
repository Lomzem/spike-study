import { createContext } from 'svelte'

export interface ConvexAuthReadyContext {
  readonly current: boolean
  set(value: boolean): void
}

const [useConvexAuthReady, setConvexAuthReadyContext] =
  createContext<ConvexAuthReadyContext>()

export function provideConvexAuthReady(context: ConvexAuthReadyContext) {
  setConvexAuthReadyContext(context)
  return context
}

export { useConvexAuthReady }
