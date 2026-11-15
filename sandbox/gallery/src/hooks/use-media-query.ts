import { useEffect, useState } from 'react'

// Shim for registry items that import @/hooks/use-media-query.
export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const m = matchMedia(query)
    const on = () => setMatch(m.matches)
    on()
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [query])
  return match
}
export default useMediaQuery
