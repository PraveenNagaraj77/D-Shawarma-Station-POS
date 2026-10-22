import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

const AuthContext = createContext(null)

const TOKEN_KEY = 'dss_access_token'
const USER_KEY = 'dss_user'

function readStoredUser() {
  try {
    const storedUser = localStorage.getItem(USER_KEY)
    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY),
  )
  const [user, setUser] = useState(readStoredUser)

  const login = useCallback((loginData) => {
    const nextToken = loginData?.token
    const nextUser = loginData?.user

    if (!nextToken || !nextUser) {
      throw new Error('The server returned an invalid login response.')
    }

    localStorage.setItem(TOKEN_KEY, nextToken)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))

    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [token, user, login, logout],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}
