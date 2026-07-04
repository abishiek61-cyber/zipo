import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

// 🟢 Set up the base URL dynamically based on environment
const API_BASE = import.meta.env.VITE_API_URL || '';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Appending API_BASE ensures Vercel targets Railway, while Localhost works via the fallback empty string
    axios.get(`${API_BASE}/auth/me`, { withCredentials: true })
      .then(r => setUser(r.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // Forces the browser window to hop over directly to the Railway backend domain for the Google login handshake
  const loginWithGoogle = () => { 
    window.location.href = `${API_BASE}/auth/google` 
  }

  const logout = async () => {
    await axios.post(`${API_BASE}/auth/logout`, {}, { withCredentials: true })
    setUser(null); 
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
