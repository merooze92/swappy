import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'
import AuthContext from './context.js'

const tokenKey = 'swappy-session-token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => sessionStorage.getItem(tokenKey))
  const [loading, setLoading] = useState(Boolean(token))

  useEffect(() => {
    if (!token) return undefined

    let active = true
    api('/auth/me', { token })
      .then(({ user: currentUser }) => {
        if (active) setUser(currentUser)
      })
      .catch(() => {
        if (active) {
          sessionStorage.removeItem(tokenKey)
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  const signIn = useCallback(({ token: nextToken, user: nextUser }) => {
    sessionStorage.setItem(tokenKey, nextToken)
    setToken(nextToken)
    setUser(nextUser)
    setLoading(false)
  }, [])

  const signOut = useCallback(() => {
    sessionStorage.removeItem(tokenKey)
    setToken(null)
    setUser(null)
    setLoading(false)
  }, [])

  const value = useMemo(() => ({ user, token, loading, signIn, signOut }), [user, token, loading, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
