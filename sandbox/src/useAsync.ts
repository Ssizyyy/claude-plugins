import { useCallback, useEffect, useState } from "react"

export function useAsync<T>(fn: () => Promise<T>) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true })
  const retry = useCallback(() => {
    setState({ loading: true })
    fn().then(
      (data) => setState({ data, loading: false }),
      (e: Error) => setState({ error: e.message, loading: false }),
    )
  }, [fn])
  useEffect(() => {
    let live = true
    fn().then(
      (data) => live && setState({ data, loading: false }),
      (e: Error) => live && setState({ error: e.message, loading: false }),
    )
    return () => {
      live = false
    }
  }, [fn])
  return { ...state, retry }
}
