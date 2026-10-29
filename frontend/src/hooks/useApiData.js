import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'

export function useApiData(path, refresh = 0) {
  const { token } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => api(path, { token }), [path, token])

  useEffect(() => {
    let active = true
    load()
      .then((result) => {
        if (active) {
          setData(result)
          setError('')
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [load, refresh])

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await load()
      setData(result)
      setError('')
      return result
    } catch (requestError) {
      setError(requestError.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [load])

  return { data, loading, error, reload }
}
