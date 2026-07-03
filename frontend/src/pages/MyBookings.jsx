import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function MyBookings() {
  const { user } = useAuth(); const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [reviews, setReviews] = useState({})
  const [loyalty, setLoyalty] = useState({ points: 0 })
  const [referral, setReferral] = useState(null)
  const [newReview, setNewReview] = useState({})

  useEffect(() => {
    if (!user) { navigate('/'); return }
    axios.get('/api/bookings/mine', { withCredentials: true }).then(r => setBookings(r.data))
    axios.get('/api/features/loyalty', { withCredentials: true }).then(r => setLoyalty(r.data))
    axios.get('/api/features/referral-code', { withCredentials: true }).then(r => setReferral(r.data))
  }, [user])

  const submitReview = async (booking_id) => {
    const r = newReview[booking_id]
    if (!r?.rating) return
    try {
      await axios.post('/api/features/reviews', { booking_id, rating: r.rating, comment: r.comment || '' }, { withCredentials: true })
      setReviews(rv => ({ ...rv, [booking_id]: true }))
      setNewReview(nr => ({ ...nr, [booking_id]: { ...nr[booking_id], submitted: true } }))
    } catch(e) { alert(e.response?.data?.error || 'Review failed') }
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <p className="text-xs font-medium tracking-widest text-blue-400 uppercase mb-1">Your account</p>
      <h1 className="text-2xl font-semibold mb-6">My bookings</h1>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-white/[0.04] rounded-xl p-4">
          <div className="text-xs text-white/30 mb-1">Loyalty points</div>
          <div className="text-2xl font-semibold text-amber-400">★ {loyalty.points}</div>
          <div className="text-xs text-white/30 mt-1">{loyalty.total_earned} total earned</div>
        </div>
        {referral && (
          <div className="bg-white/[0.04] rounded-xl p-4">
            <div className="text-xs text-white/30 mb-1">Your referral code</div>
            <div className="text-lg font-mono font-semibold text-blue-300">{referral.code}</div>
            <button onClick={() => navigator.clipboard.writeText(referral.link).then(() => alert('Link copied!'))}
              className="text-xs text-blue-400 mt-1 hover:text-blue-300">Copy link</button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {bookings.length === 0 && <p className="text-white/30 text-sm text-center py-8">No bookings yet</p>}
        {bookings.map(b => (
          <div key={b.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-medium">{b.package_name}</div>
                <div className="text-sm text-white/40">{new Date(b.slot_datetime).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}</div>
                <div className="text-xs text-white/30 mt-0.5">{b.car_registration}</div>
              </div>
              <div className="text-right">
                <div className="text-blue-400 font-semibold">₹{Number(b.total_amount).toLocaleString('en-IN')}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                  b.status==='confirmed' ? 'bg-green-900/30 text-green-400' :
                  b.status==='completed' ? 'bg-purple-900/30 text-purple-300' :
                  b.status==='cancelled' ? 'bg-red-900/30 text-red-400' :
                  'bg-yellow-900/30 text-yellow-300'}`}>{b.status}</span>
              </div>
            </div>
            {b.status === 'completed' && !reviews[b.id] && !newReview[b.id]?.submitted && (
              <div className="border-t border-white/10 pt-3 mt-2">
                <p className="text-xs text-white/40 mb-2">Rate this service</p>
                <div className="flex gap-1 mb-2">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setNewReview(nr => ({ ...nr, [b.id]: { ...nr[b.id], rating: s } }))}
                      className={`text-xl transition-colors ${(newReview[b.id]?.rating||0) >= s ? 'text-amber-400' : 'text-white/20 hover:text-amber-300'}`}>★</button>
                  ))}
                </div>
                <input type="text" placeholder="Leave a comment (optional)"
                  value={newReview[b.id]?.comment || ''}
                  onChange={e => setNewReview(nr => ({ ...nr, [b.id]: { ...nr[b.id], comment: e.target.value } }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500 mb-2"/>
                <button onClick={() => submitReview(b.id)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition-colors">Submit review</button>
              </div>
            )}
            {(reviews[b.id] || newReview[b.id]?.submitted) && (
              <div className="border-t border-white/10 pt-3 mt-2 text-xs text-emerald-400">✓ Review submitted — thank you!</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
