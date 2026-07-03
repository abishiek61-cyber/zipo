import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Book from './pages/Book'
import Admin from './pages/Admin'
import Marketing from './pages/Marketing'
import MyBookings from './pages/MyBookings'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0a0a0f]">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/book" element={<Book />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/dashboard" element={<Home />} />
            <Route path="/payment-result" element={<Home />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
