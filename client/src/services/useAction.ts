import { useState } from 'react'

export function useAction() {
  const [error, setError] = useState<string | null>(null)
  const run = async (action: () => Promise<void>) => {
    setError(null)
    try { await action() } catch (cause) { setError(cause instanceof Error ? cause.message : 'The action could not be completed.') }
  }
  return { error, run }
}
