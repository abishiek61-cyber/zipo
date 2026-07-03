import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const SLOTS_DEFAULT = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00']
const today = () => new Date().toISOString().split('T')[0]

export default function Book() {
  const { user, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [packages, setPackages] = useState([])
  const [takenSlots, setTakenSlots] = useState([])
  const [availableSlots, setAvailableSlots] = useState(SLOTS_DEFAULT)
  const [settings, setSettings] = useState({})
  const [loyalty, setLoyalty] = useState({ points: 0 })
  const [form, setForm] = useState({ package_id:'', include_interior:false, slot:'', date:today(), phone:'', car_registration:'', address:'', pincode:'', frequency:'once', promo_code:'' })
  const [selectedPkg, setSelectedPkg] = useState(null)
  const [promo, setPromo] = useState(null)
  const [promoError, setPromoError] = useState('')
  const [step, setStep] = useState('form')
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get('/api/features/slots-config').then(r => setAvailableSlots(r.data.slots)).catch(()=>{})
    axios.get('/api/packages').then(r => {
      setPackages(r.data)
      if (r.data[0]) { setForm(f => ({...f, package_id: r.data[0].id})); setSelectedPkg(r.data[0]) }
    })
    axios.get('/api/features/settings').then(r => setSettings(r.data))
    if (user) axios.get('/api/features/loyalty', { withCredentials: true }).then(r => setLoyalty(r.data))
  }, [user])

  useEffect(() => {
    if (form.date) axios.get(`/api/bookings/slots?date=${form.date}`).then(r => setTakenSlots(r.data))
  }, [form.date])

  const baseTotal = selectedPkg ? Number(selectedPkg.price) + (form.include_interior ? Number(selectedPkg.interior_addon) : 0) : 0
  const discount = promo ? (promo.discount_type === 'percent' ? Math.round(baseTotal * promo.discount_value / 100) : Number(promo.discount_value)) : 0
  const total = Math.max(0, baseTotal - discount)
  const freqDiscount = form.frequency === 'monthly' ? 20 : form.frequency === 'weekly' ? 10 : 0

  const checkPromo = async () => {
    if (!form.promo_code) return
    try {
      const r = await axios.get(`/api/features/promo/${form.promo_code}`)
      setPromo(r.data); setPromoError('')
    } catch { setPromo(null); setPromoError('Invalid or expired code') }
  }

  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  const submit = async () => {
    if (!user) { loginWithGoogle(); return }
    if (!form.slot || !form.package_id || !form.phone || !form.car_registration || !form.address || !form.pincode) {
      setError('Please fill in all fields and pick a slot'); return
    }
    if (!/^[6-9]\d{9}$/.test(form.phone)) { setError('Enter a valid 10-digit mobile number'); return }
    if (!/^\d{6}$/.test(form.pincode)) { setError('Enter a valid 6-digit pincode'); return }
    setError('')
    try {
      const r = await axios.post('/api/bookings', {
        ...form,
        slot_datetime: `${form.date} ${form.slot}:00`,
        promo_code: promo ? form.promo_code : null,
        discount_amount: discount
      }, { withCredentials: true })
      setBooking(r.data)
      setStep('confirm')
    } catch(e) { setError(e.response?.data?.error || 'Booking failed') }
  }

  if (!user) return (
    <div className="max-w-md mx-auto text-center py-20 px-6">
      <h2 className="text-2xl font-semibold mb-3">Sign in to book</h2>
      <p className="text-white/40 mb-6">Quick Google sign-in — no password needed</p>
      <button onClick={loginWithGoogle} className="mx-auto flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors">Sign in with Google</button>
    </div>
  )

  if (step === 'confirm') return (
    <div className="max-w-md mx-auto py-12 px-6">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">✓</div>
        <h2 className="text-2xl font-semibold mb-1">Booking confirmed!</h2>
        <p className="text-white/40 text-sm">See you on {form.date} at {form.slot}. We'll contact you on +91 {form.phone}.</p>
      </div>
      {settings.upi_enabled === 'true' && settings.upi_id && (
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 mb-4 text-center">
          <p className="text-sm text-white/50 mb-1">Pay now to confirm your slot</p>
          <p className="text-3xl font-semibold text-blue-300 mb-4">₹{total.toLocaleString('en-IN')}</p>
          {settings.upi_qr_url ? (
            <img src={settings.upi_qr_url} alt="UPI QR Code" className="w-48 h-48 mx-auto rounded-xl mb-3 bg-white p-2"/>
          ) : (
            <div className="w-48 h-48 mx-auto bg-white/10 rounded-xl flex items-center justify-center mb-3">
              <span className="text-white/30 text-sm">QR not set</span>
            </div>
          )}
          <p className="text-sm text-white/60 mb-1">UPI ID: <span className="text-white font-medium">{settings.upi_id}</span></p>
          <p className="text-xs text-white/30">Scan with Google Pay, PhonePe, Paytm or any UPI app</p>
          <div className="mt-4 bg-emerald-900/20 border border-emerald-800/30 rounded-lg px-4 py-2 text-xs text-emerald-400">
            After payment, show the screenshot to our team on arrival
          </div>
        </div>
      )}
      {settings.upi_enabled !== 'true' && (
        <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 mb-4 text-center">
          <p className="text-white/50 text-sm mb-1">Total amount</p>
          <p className="text-2xl font-semibold text-blue-300">₹{total.toLocaleString('en-IN')}</p>
          <p className="text-xs text-white/30 mt-1">Pay on arrival — cash or UPI accepted</p>
        </div>
      )}
      <button onClick={() => navigate('/')} className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors">Back to home</button>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <p className="text-xs font-medium tracking-widest text-blue-400 uppercase mb-1">Book a service</p>
      <h1 className="text-2xl font-semibold mb-2">Pick your package and slot</h1>
      {loyalty.points > 0 && (
        <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg px-4 py-2 mb-6 flex items-center gap-2 text-sm">
          <span className="text-amber-400">★</span>
          <span className="text-amber-300">{loyalty.points} loyalty points</span>
          <span className="text-white/30">— keep booking to unlock rewards</span>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Package</label>
            <select value={form.package_id}
              onChange={e => { set('package_id', e.target.value); setSelectedPkg(packages.find(p => p.id == e.target.value)) }}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500">
              {packages.map(p => <option key={p.id} value={p.id}>₹{Number(p.price).toLocaleString('en-IN')} — {p.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.include_interior} onChange={e => set('include_interior', e.target.checked)} className="w-4 h-4 accent-blue-500"/>
            <span className="text-sm text-white/60">Add interior clean (+₹{selectedPkg ? Number(selectedPkg.interior_addon).toLocaleString('en-IN') : 300})</span>
          </label>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Booking frequency</label>
            <select value={form.frequency} onChange={e => set('frequency', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500">
              <option value="once">One time</option>
              <option value="weekly">Weekly — save 10%</option>
              <option value="monthly">Monthly — save 20%</option>
            </select>
            {freqDiscount > 0 && <p className="text-xs text-emerald-400 mt-1">You save {freqDiscount}% with this plan</p>}
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Date</label>
            <input type="date" value={form.date} min={today()} onChange={e => set('date', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"/>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-2">Available slots</label>
            <div className="grid grid-cols-4 gap-1.5">
              {availableSlots.map(s => {
                const taken = takenSlots.includes(s), picked = form.slot === s
                return <button key={s} disabled={taken} onClick={() => !taken && set('slot', s)}
                  className={`py-2 rounded-lg text-xs transition-colors ${taken ? 'text-white/20 line-through cursor-not-allowed' : picked ? 'bg-blue-600/30 border border-blue-500 text-blue-300' : 'bg-white/[0.04] border border-white/10 hover:border-white/30 text-white/60'}`}>{s}</button>
              })}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Mobile number</label>
            <div className="flex gap-2">
              <span className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/50 flex-shrink-0">+91</span>
              <input type="tel" placeholder="98765 43210" value={form.phone}
                onChange={e => set('phone', e.target.value.replace(/\D/g,'').slice(0,10))}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500"/>
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Car registration</label>
            <input type="text" placeholder="KA 01 AB 1234" value={form.car_registration}
              onChange={e => set('car_registration', e.target.value.toUpperCase())}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500"/>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Address</label>
            <textarea rows={2} placeholder="Building, street, area" value={form.address}
              onChange={e => set('address', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500 resize-none"/>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Pincode</label>
            <input type="text" placeholder="560001" value={form.pincode}
              onChange={e => set('pincode', e.target.value.replace(/\D/g,'').slice(0,6))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500"/>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Promo code (optional)</label>
            <div className="flex gap-2">
              <input type="text" placeholder="ZIPO50" value={form.promo_code}
                onChange={e => { set('promo_code', e.target.value.toUpperCase()); setPromo(null); setPromoError('') }}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500"/>
              <button onClick={checkPromo} className="px-3 py-2 border border-white/20 rounded-lg text-xs text-white/60 hover:text-white hover:border-white/40 transition-colors">Apply</button>
            </div>
            {promo && <p className="text-xs text-emerald-400 mt-1">✓ {promo.discount_type === 'percent' ? promo.discount_value + '% off' : '₹' + promo.discount_value + ' off'} applied</p>}
            {promoError && <p className="text-xs text-red-400 mt-1">{promoError}</p>}
          </div>
          {selectedPkg && (
            <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-4 space-y-1">
              <div className="flex justify-between text-sm text-white/40">
                <span>Subtotal</span><span>₹{baseTotal.toLocaleString('en-IN')}</span>
              </div>
              {discount > 0 && <div className="flex justify-between text-sm text-emerald-400"><span>Discount</span><span>−₹{discount.toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between text-xl font-semibold text-blue-300 pt-1 border-t border-white/10">
                <span>Total</span><span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={submit} className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors">Confirm booking</button>
        </div>
      </div>
    </div>
  )
}
