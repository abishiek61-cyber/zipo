import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, loginWithGoogle, logout } = useAuth()
  const loc = useLocation()
  const a = p => loc.pathname === p ? 'text-white' : 'text-white/40 hover:text-white transition-colors'

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-sm">
      <Link to="/" className="flex items-center gap-1">
        <span className="text-white text-base font-bold tracking-widest">ZIP</span>
        <span className="text-blue-400 text-base font-bold tracking-widest">O</span>
        <span className="ml-2 text-xs text-white/20 font-normal tracking-normal hidden sm:inline">Car Detailing</span>
      </Link>
      <div className="flex items-center gap-5 text-sm">
        <Link to="/" className={a('/')}>Home</Link>
        <Link to="/book" className={a('/book')}>Book</Link>
        {user && <Link to="/my-bookings" className={a('/my-bookings')}>My bookings</Link>}
        {user?.role === 'admin' && <Link to="/admin" className={a('/admin')}>Admin</Link>}
        {['admin','marketing'].includes(user?.role) && <Link to="/marketing" className={a('/marketing')}>Marketing</Link>}
      </div>
      <div>
        {user ? (
          <div className="flex items-center gap-3">
            {user.picture && <img src={user.picture} className="w-7 h-7 rounded-full" alt="" onError={e=>e.target.style.display='none'}/>}
            <span className="text-sm text-white/50 hidden sm:inline">{user.name.split(' ')[0]}</span>
            <button onClick={logout} className="text-xs px-3 py-1.5 border border-white/20 rounded-lg hover:border-white/40 text-white/50 hover:text-white transition-colors">Sign out</button>
          </div>
        ) : (
          <button onClick={loginWithGoogle} className="flex items-center gap-2 text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in
          </button>
        )}
      </div>
    </nav>
  )
}
