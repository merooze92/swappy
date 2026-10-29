import { useCallback, useState } from 'react'

export function useSubmission() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const run = useCallback(async (action, successMessage) => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const result = await action()
      setMessage(successMessage)
      return result
    } catch (requestError) {
      setError(requestError.message || 'The request could not be completed.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, message, error, run }
}
