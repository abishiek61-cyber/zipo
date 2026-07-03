import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    axios.get('/auth/me', { withCredentials: true })
      .then(r => setUser(r.data.user)).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])
  const loginWithGoogle = () => { window.location.href = '/auth/google' }
  const logout = async () => {
    await axios.post('/auth/logout', {}, { withCredentials: true })
    setUser(null); window.location.href = '/'
  }
  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
export const useAuth = () => useContext(AuthContext)
