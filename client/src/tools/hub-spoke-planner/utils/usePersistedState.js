import { useEffect, useState } from 'react'
import { store } from './planHelpers'

// useState that is read from and written back to localStorage (shortlist, plan history, outlines, drafts).
export default function usePersistedState(key, fallback) {
  const [value, setValue] = useState(() => store.get(key) ?? fallback)
  useEffect(() => {
    store.set(key, value)
  }, [key, value])
  return [value, setValue]
}
