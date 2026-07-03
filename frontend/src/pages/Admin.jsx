import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const ST = { pending:'bg-yellow-900/30 text-yellow-300', confirmed:'bg-green-900/30 text-green-300', completed:'bg-purple-900/30 text-purple-300', cancelled:'bg-red-900/30 text-red-300' }
const inp = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500"
const ALL_SLOTS = ['05:00','06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00']

const FREE_CAR_IMAGES = [
  { url:'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400', label:'Sports car' },
  { url:'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400', label:'Classic car' },
  { url:'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400', label:'Luxury car' },
  { url:'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400', label:'BMW' },
  { url:'https://images.unsplash.com/photo-1542362567-b07e54358753?w=400', label:'Red car' },
  { url:'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=400', label:'Clean car' },
]

export default function Admin() {
  const { user } = useAuth(); const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [bookings, setBookings] = useState([])
  const [packages, setPackages] = useState([])
  const [slogans, setSlogans] = useState([])
  const [staff, setStaff] = useState([])
  const [promos, setPromos] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [analyticsError, setAnalyticsError] = useState('')
  const [gallery, setGallery] = useState([])
  const [blog, setBlog] = useState([])
  const [settings, setSettings] = useState({})
  const [areas, setAreas] = useState([])
  const [activeSlots, setActiveSlots] = useState(['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'])
  const [tab, setTab] = useState('bookings')
  const [search, setSearch] = useState('')
  const [filterPin, setFilterPin] = useState('')
  const [sortBy, setSortBy] = useState('slot_datetime')
  const [sortDir, setSortDir] = useState('desc')
  const [toast, setToast] = useState({ msg:'', type:'ok' })
  const [newPkg, setNewPkg] = useState({ name:'', description:'', badge:'Exterior', price:'', interior_addon:'300' })
  const [newSlogan, setNewSlogan] = useState('')
  const [newStaff, setNewStaff] = useState({ name:'', phone:'' })
  const [newPromo, setNewPromo] = useState({ code:'', discount_type:'percent', discount_value:'', max_uses:'100', valid_until:'' })
  const [newGallery, setNewGallery] = useState({ image_url:'', caption:'', instagram_url:'' })
  const [newBlog, setNewBlog] = useState({ title:'', content:'', image_url:'' })
  const [newArea, setNewArea] = useState({ pincode:'', area_name:'' })

  useEffect(() => { if (!user) return; if (user.role!=='admin') { navigate('/'); return } load() }, [user])

  const showToast = (msg, type='ok') => { setToast({msg,type}); setTimeout(()=>setToast({msg:'',type:'ok'}), 3000) }

  const load = () => {
    axios.get('/api/admin/stats',{withCredentials:true}).then(r=>setStats(r.data)).catch(()=>{})
    axios.get('/api/bookings/all',{withCredentials:true}).then(r=>setBookings(r.data)).catch(()=>{})
    axios.get('/api/packages').then(r=>setPackages(r.data)).catch(()=>{})
    axios.get('/api/slogans').then(r=>setSlogans(r.data)).catch(()=>{})
    axios.get('/api/features/staff',{withCredentials:true}).then(r=>setStaff(r.data)).catch(()=>{})
    axios.get('/api/features/promo-admin',{withCredentials:true}).then(r=>setPromos(r.data)).catch(()=>{})
    axios.get('/api/features/analytics',{withCredentials:true}).then(r=>{ setAnalytics(r.data); setAnalyticsError('') }).catch(e=>setAnalyticsError(e.response?.data?.error||'Failed to load'))
    axios.get('/api/features/gallery').then(r=>setGallery(r.data)).catch(()=>{})
    axios.get('/api/features/blog').then(r=>setBlog(r.data)).catch(()=>{})
    axios.get('/api/features/settings').then(r=>setSettings(r.data)).catch(()=>{})
    axios.get('/api/features/service-areas').then(r=>setAreas(r.data)).catch(()=>{})
    axios.get('/api/features/slots-config').then(r=>setActiveSlots(r.data.slots)).catch(()=>{})
  }

  const saveSettings = () => axios.put('/api/features/settings',settings,{withCredentials:true}).then(()=>showToast('Settings saved')).catch(e=>showToast('Error: '+e.message,'err'))
  const saveSlots = () => axios.put('/api/features/slots-config',{slots:activeSlots},{withCredentials:true}).then(()=>showToast('Slots saved')).catch(e=>showToast('Error','err'))
  const toggleSlot = s => setActiveSlots(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s].sort())

  const waLink = b => {
    const msg = encodeURIComponent(`Hi ${b.customer_name}, your Zipo booking is confirmed!\nService: ${b.package_name}\nSlot: ${new Date(b.slot_datetime).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}\nCar: ${b.car_registration}\nAddress: ${b.address}${b.pincode?', '+b.pincode:''}\nTotal: ₹${Number(b.total_amount).toLocaleString('en-IN')}\nThank you for choosing Zipo!`)
    return `https://wa.me/91${b.phone}?text=${msg}`
  }

  const sorted = [...bookings].filter(b => {
    const ms = !search || [b.customer_name,b.phone,b.car_registration,b.pincode].some(v=>v?.toLowerCase().includes(search.toLowerCase()))
    const mp = !filterPin || b.pincode===filterPin
    return ms && mp
  }).sort((a,b) => {
    let va=a[sortBy],vb=b[sortBy]
    if(sortBy==='total_amount'){va=Number(va);vb=Number(vb)}
    return sortDir==='asc'?(va<vb?-1:va>vb?1:0):(va>vb?-1:va<vb?1:0)
  })

  const pincodes = [...new Set(bookings.map(b=>b.pincode).filter(Boolean))].sort()

  if (!user||user.role!=='admin') return <div className="text-center py-20 text-white/30">Admin access only.</div>

  const TABS = ['bookings','analytics','packages','slogans','staff','promos','gallery','blog','areas','slots','settings','upi']

  return (
    <div className="max-w-6xl mx-auto py-8 px-6">
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${toast.type==='err'?'bg-red-900 text-red-200':'bg-green-900 text-green-200'}`}>{toast.msg}</div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Admin dashboard</h1>
        <span className="text-xs text-white/30">{user.name}</span>
      </div>
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[{label:'Today',val:stats.today.count,c:'text-blue-400'},{label:'Today revenue',val:`₹${Number(stats.today.revenue).toLocaleString('en-IN')}`,c:'text-emerald-400'},{label:'Pending',val:stats.pending,c:'text-yellow-400'},{label:'Total revenue',val:`₹${Number(stats.total.revenue).toLocaleString('en-IN')}`,c:'text-purple-400'}].map(m=>(
            <div key={m.label} className="bg-white/[0.04] rounded-xl p-4">
              <div className="text-xs text-white/30 mb-1">{m.label}</div>
              <div className={`text-xl font-semibold ${m.c}`}>{m.val}</div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-1 mb-6 flex-wrap">
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${tab===t?'bg-white/10 text-white':'text-white/40 hover:text-white'}`}>{t}</button>
        ))}
      </div>

      {tab==='bookings' && (
        <div>
          <div className="flex gap-2 mb-3 flex-wrap">
            <input placeholder="Search name, phone, car, pincode..." value={search} onChange={e=>setSearch(e.target.value)} className={inp+" flex-1 min-w-[180px]"}/>
            <select value={filterPin} onChange={e=>setFilterPin(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
              <option value="">All pincodes</option>
              {pincodes.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
            <select value={`${sortBy}__${sortDir}`} onChange={e=>{const[col,dir]=e.target.value.split('__');setSortBy(col);setSortDir(dir)}} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
              <option value="slot_datetime__desc">Slot — newest</option>
              <option value="slot_datetime__asc">Slot — oldest</option>
              <option value="created_at__desc">Booked — newest</option>
              <option value="total_amount__desc">Amount — high</option>
              <option value="total_amount__asc">Amount — low</option>
            </select>
            {(search||filterPin)&&<button onClick={()=>{setSearch('');setFilterPin('')}} className="text-xs text-white/40 px-3 border border-white/10 rounded-lg hover:text-white">Clear</button>}
          </div>
          <div className="text-xs text-white/30 mb-3">{sorted.length} booking{sorted.length!==1?'s':''}</div>
          <div className="space-y-2">
            {sorted.length===0&&<p className="text-white/30 text-sm py-8 text-center">No bookings found</p>}
            {sorted.map(b=>(
              <div key={b.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <div><div className="text-xs text-white/30 mb-0.5">Customer</div><div className="text-sm font-medium">{b.customer_name}</div><div className="text-xs text-white/40">{b.email}</div></div>
                  <div><div className="text-xs text-white/30 mb-0.5">Contact</div><div className="text-sm text-emerald-400">+91 {b.phone||'—'}</div><div className="text-xs text-white/40">Pin: {b.pincode||'—'}</div></div>
                  <div><div className="text-xs text-white/30 mb-0.5">Service</div><div className="text-sm">{b.package_name}</div><div className="text-xs text-white/40">{b.car_registration}</div></div>
                  <div><div className="text-xs text-white/30 mb-0.5">Slot</div><div className="text-sm">{new Date(b.slot_datetime).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'})}</div><div className="text-blue-400 text-sm font-medium">₹{Number(b.total_amount).toLocaleString('en-IN')}</div></div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={b.status} onChange={e=>{axios.put(`/api/bookings/${b.id}/status`,{status:e.target.value},{withCredentials:true});setBookings(bk=>bk.map(x=>x.id===b.id?{...x,status:e.target.value}:x))}} className={`text-xs px-2 py-1 rounded-md border-0 outline-none cursor-pointer bg-transparent ${ST[b.status]}`}>
                    {['pending','confirmed','completed','cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  {staff.length>0&&<select value={b.staff_id||''} onChange={e=>axios.put(`/api/features/bookings/${b.id}/assign`,{staff_id:e.target.value},{withCredentials:true}).then(()=>showToast('Assigned'))} className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded-md text-white/60 outline-none">
                    <option value="">Assign staff</option>
                    {staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>}
                  {b.phone&&<a href={waLink(b)} target="_blank" rel="noreferrer" className="text-xs px-3 py-1 bg-emerald-900/30 text-emerald-400 border border-emerald-800/40 rounded-lg hover:bg-emerald-900/50">WhatsApp</a>}
                  <span className="text-xs text-white/20 ml-auto truncate max-w-[200px]">{b.address}{b.pincode?', '+b.pincode:''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='analytics' && (
        <div className="space-y-5">
          {analyticsError && <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4 text-red-400 text-sm">{analyticsError} — try signing out and back in</div>}
          {!analytics && !analyticsError && <p className="text-white/30 text-sm text-center py-8">Loading...</p>}
          {analytics && <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[{label:'Total bookings',val:analytics.totalBookings,c:'text-blue-400'},{label:'Total revenue',val:`₹${Number(analytics.revenueAll).toLocaleString('en-IN')}`,c:'text-emerald-400'},{label:'Last 7 days',val:`₹${Number(analytics.revenue7).toLocaleString('en-IN')}`,c:'text-purple-400'},{label:'Last 30 days',val:`₹${Number(analytics.revenue30).toLocaleString('en-IN')}`,c:'text-amber-400'}].map(m=>(
                <div key={m.label} className="bg-white/[0.04] rounded-xl p-4">
                  <div className="text-xs text-white/30 mb-1">{m.label}</div>
                  <div className={`text-xl font-semibold ${m.c}`}>{m.val}</div>
                </div>
              ))}
            </div>
            {analytics.byPackage?.length>0&&<div>
              <p className="text-sm font-medium mb-3 text-white/60">Revenue by package</p>
              {analytics.byPackage.map(p=>(
                <div key={p.name} className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-white/50 w-28 flex-shrink-0 truncate">{p.name}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width:analytics.byPackage[0]?.revenue>0?(p.revenue/analytics.byPackage[0].revenue*100)+'%':'0%'}}></div>
                  </div>
                  <span className="text-xs text-white/40 w-24 text-right">₹{Number(p.revenue).toLocaleString('en-IN')}</span>
                  <span className="text-xs text-white/20 w-8 text-right">{p.count}</span>
                </div>
              ))}
            </div>}
            {analytics.byPincode?.length>0&&<div>
              <p className="text-sm font-medium mb-3 text-white/60">Bookings by area</p>
              {analytics.byPincode.filter(p=>p.pincode&&p.pincode!=='Unknown').map(p=>(
                <div key={p.pincode} className="flex items-center justify-between py-2 border-b border-white/[0.06] text-xs">
                  <span className="text-white/60 font-mono">{p.pincode}</span>
                  <span className="text-white/40">{p.count} bookings</span>
                  <span className="text-emerald-400">₹{Number(p.revenue).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>}
            {analytics.byFreq?.length>0&&<div>
              <p className="text-sm font-medium mb-3 text-white/60">Frequency split</p>
              <div className="flex gap-3">
                {analytics.byFreq.map(f=>(
                  <div key={f.frequency} className="bg-white/[0.04] rounded-xl p-3 flex-1 text-center">
                    <div className="text-xl font-semibold text-blue-400">{f.count}</div>
                    <div className="text-xs text-white/30 capitalize">{f.frequency}</div>
                  </div>
                ))}
              </div>
            </div>}
          </>}
        </div>
      )}

      {tab==='packages' && (
        <div>
          <div className="space-y-2 mb-5">
            {packages.map(p=>(
              <div key={p.id} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3">
                <div><span className="font-medium">{p.name}</span><span className="text-white/30 text-sm ml-3">{p.badge}</span></div>
                <div className="flex items-center gap-4"><span className="text-blue-400 font-medium">₹{Number(p.price).toLocaleString('en-IN')}</span>
                  <button onClick={()=>axios.delete(`/api/packages/${p.id}`,{withCredentials:true}).then(()=>{showToast('Removed');load()})} className="text-xs text-red-400">Remove</button></div>
              </div>
            ))}
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
            <p className="text-sm text-white/50">Add package</p>
            <div className="grid grid-cols-2 gap-3">
              {[['Name','name','text'],['Price','price','number'],['Description','description','text']].map(([ph,k,t])=>(
                <input key={k} type={t} placeholder={ph} value={newPkg[k]} onChange={e=>setNewPkg(p=>({...p,[k]:e.target.value}))} className={inp}/>
              ))}
              <select value={newPkg.badge} onChange={e=>setNewPkg(p=>({...p,badge:e.target.value}))} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
                {['Exterior','Signature','Eco','Premium'].map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
            <button onClick={()=>{if(!newPkg.name||!newPkg.price)return;axios.post('/api/packages',newPkg,{withCredentials:true}).then(()=>{setNewPkg({name:'',description:'',badge:'Exterior',price:'',interior_addon:'300'});showToast('Added');load()}).catch(e=>showToast('Error','err'))}}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">Add package</button>
          </div>
        </div>
      )}

      {tab==='slogans' && (
        <div>
          <div className="space-y-2 mb-5">
            {slogans.map(s=>(
              <div key={s.id} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3">
                <span>{s.text}</span>
                <button onClick={()=>axios.delete(`/api/slogans/${s.id}`,{withCredentials:true}).then(()=>{showToast('Deleted');load()})} className="text-xs text-red-400">Delete</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input placeholder="New slogan" value={newSlogan} onChange={e=>setNewSlogan(e.target.value)} className={inp}/>
            <button onClick={()=>{if(!newSlogan)return;axios.post('/api/slogans',{text:newSlogan,sort_order:slogans.length+1},{withCredentials:true}).then(()=>{setNewSlogan('');showToast('Added');load()})}}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">Add</button>
          </div>
        </div>
      )}

      {tab==='staff' && (
        <div>
          <div className="space-y-2 mb-5">
            {staff.length===0&&<p className="text-white/30 text-sm py-4 text-center">No staff yet</p>}
            {staff.map(s=>(
              <div key={s.id} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3">
                <div><span className="font-medium">{s.name}</span><span className="text-white/40 text-sm ml-3">+91 {s.phone}</span></div>
                <button onClick={()=>axios.delete(`/api/features/staff/${s.id}`,{withCredentials:true}).then(()=>{showToast('Removed');load()})} className="text-xs text-red-400">Remove</button>
              </div>
            ))}
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Full name" value={newStaff.name} onChange={e=>setNewStaff(s=>({...s,name:e.target.value}))} className={inp}/>
              <input placeholder="Phone number" value={newStaff.phone} onChange={e=>setNewStaff(s=>({...s,phone:e.target.value}))} className={inp}/>
            </div>
            <button onClick={()=>{
              if(!newStaff.name){showToast('Name required','err');return}
              axios.post('/api/features/staff',newStaff,{withCredentials:true})
                .then(()=>{setNewStaff({name:'',phone:''});showToast('Staff added');load()})
                .catch(e=>showToast('Error: '+(e.response?.data?.error||e.message),'err'))
            }} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">Add staff</button>
          </div>
        </div>
      )}

      {tab==='promos' && (
        <div>
          <div className="space-y-2 mb-5">
            {promos.length===0&&<p className="text-white/30 text-sm py-4 text-center">No promo codes yet</p>}
            {promos.map(p=>(
              <div key={p.id} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3">
                <div><span className="font-mono font-medium text-blue-300">{p.code}</span><span className="text-white/40 text-sm ml-3">{p.discount_type==='percent'?p.discount_value+'%':'₹'+p.discount_value} off</span><span className="text-white/20 text-xs ml-2">{p.used_count}/{p.max_uses}</span></div>
                <div className="flex gap-3 items-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active?'bg-green-900/30 text-green-400':'bg-red-900/30 text-red-400'}`}>{p.is_active?'Active':'Off'}</span>
                  <button onClick={()=>axios.delete(`/api/features/promo/${p.id}`,{withCredentials:true}).then(()=>{showToast('Deactivated');load()})} className="text-xs text-red-400">Off</button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
            <p className="text-sm text-white/50">Create promo code</p>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Code e.g. ZIPO20" value={newPromo.code} onChange={e=>setNewPromo(p=>({...p,code:e.target.value.toUpperCase()}))} className={inp}/>
              <select value={newPromo.discount_type} onChange={e=>setNewPromo(p=>({...p,discount_type:e.target.value}))} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
                <option value="percent">Percent % off</option>
                <option value="flat">Flat ₹ off</option>
              </select>
              <input placeholder="Value e.g. 20" type="number" value={newPromo.discount_value} onChange={e=>setNewPromo(p=>({...p,discount_value:e.target.value}))} className={inp}/>
              <input placeholder="Max uses e.g. 50" type="number" value={newPromo.max_uses} onChange={e=>setNewPromo(p=>({...p,max_uses:e.target.value}))} className={inp}/>
              <input type="date" value={newPromo.valid_until} onChange={e=>setNewPromo(p=>({...p,valid_until:e.target.value}))} className={inp}/>
            </div>
            <button onClick={()=>{
              if(!newPromo.code||!newPromo.discount_value){showToast('Code and value required','err');return}
              axios.post('/api/features/promo',newPromo,{withCredentials:true})
                .then(()=>{setNewPromo({code:'',discount_type:'percent',discount_value:'',max_uses:'100',valid_until:''});showToast('Created');load()})
                .catch(e=>showToast('Error: '+(e.response?.data?.error||e.message),'err'))
            }} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">Create code</button>
          </div>
        </div>
      )}

      {tab==='gallery' && (
        <div>
          <p className="text-sm text-white/50 mb-4">Add car photos to your homepage. Paste any image URL or pick a free sample below.</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
            {FREE_CAR_IMAGES.map(img=>(
              <div key={img.url} onClick={()=>setNewGallery(g=>({...g,image_url:img.url,caption:img.label}))}
                className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${newGallery.image_url===img.url?'border-blue-500':'border-transparent hover:border-white/30'}`}>
                <img src={img.url} alt={img.label} className="w-full h-16 object-cover"/>
                <p className="text-xs text-white/40 text-center py-1">{img.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
            {gallery.length===0&&<p className="text-white/30 text-sm col-span-3 py-4 text-center">No photos yet</p>}
            {gallery.map(g=>(
              <div key={g.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                <img src={g.before_url} alt="Gallery" className="w-full h-32 object-cover" onError={e=>e.target.src='https://via.placeholder.com/300x200?text=Image'}/>
                <div className="p-2 flex justify-between items-center">
                  <span className="text-xs text-white/40 truncate">{g.caption}</span>
                  <button onClick={()=>axios.delete(`/api/features/gallery/${g.id}`,{withCredentials:true}).then(()=>{showToast('Removed');load()})} className="text-xs text-red-400 ml-2">Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
            <p className="text-sm text-white/50">Add photo</p>
            <input placeholder="Image URL — paste from Instagram, Imgur, or any direct image link" value={newGallery.image_url} onChange={e=>setNewGallery(g=>({...g,image_url:e.target.value}))} className={inp}/>
            <input placeholder="Caption e.g. Gloss Tech — Koramangala, KA 01" value={newGallery.caption} onChange={e=>setNewGallery(g=>({...g,caption:e.target.value}))} className={inp}/>
            <p className="text-xs text-white/20">Instagram tip: open a post → right click image → Copy image address → paste above</p>
            <button onClick={()=>{
              if(!newGallery.image_url){showToast('Image URL required','err');return}
              axios.post('/api/features/gallery',{image_url:newGallery.image_url,caption:newGallery.caption},{withCredentials:true})
                .then(()=>{setNewGallery({image_url:'',caption:'',instagram_url:''});showToast('Photo added');load()})
                .catch(e=>showToast('Error: '+(e.response?.data?.error||e.message),'err'))
            }} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">Add photo</button>
          </div>
        </div>
      )}

      {tab==='blog' && (
        <div>
          <div className="space-y-2 mb-5">
            {blog.length===0&&<p className="text-white/30 text-sm py-4 text-center">No posts yet — write your first car care tip below</p>}
            {blog.map(p=>(
              <div key={p.id} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3">
                <div><span className="font-medium text-sm">{p.title}</span><span className="text-white/30 text-xs ml-3">{new Date(p.created_at).toLocaleDateString('en-IN')}</span></div>
                <button onClick={()=>axios.delete(`/api/features/blog/${p.id}`,{withCredentials:true}).then(()=>{showToast('Deleted');load()})} className="text-xs text-red-400">Delete</button>
              </div>
            ))}
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
            <p className="text-sm text-white/50">Write a car care tip — shows on homepage for all visitors</p>
            <input placeholder="Title e.g. How often should you wax your car?" value={newBlog.title} onChange={e=>setNewBlog(b=>({...b,title:e.target.value}))} className={inp}/>
            <textarea rows={5} placeholder="Write your tip here. Keep it simple and helpful for car owners." value={newBlog.content} onChange={e=>setNewBlog(b=>({...b,content:e.target.value}))} className={inp+" resize-none"}/>
            <input placeholder="Cover image URL (optional — paste any image URL)" value={newBlog.image_url} onChange={e=>setNewBlog(b=>({...b,image_url:e.target.value}))} className={inp}/>
            <button onClick={()=>{
              if(!newBlog.title||!newBlog.content){showToast('Title and content required','err');return}
              axios.post('/api/features/blog',{title:newBlog.title,content:newBlog.content,image_url:newBlog.image_url||null},{withCredentials:true})
                .then(()=>{setNewBlog({title:'',content:'',image_url:''});showToast('Post published — visible on homepage');load()})
                .catch(e=>showToast('Error: '+(e.response?.data?.error||e.message),'err'))
            }} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">Publish post</button>
          </div>
        </div>
      )}

      {tab==='areas' && (
        <div>
          <div className="flex flex-wrap gap-2 mb-5">
            {areas.length===0&&<p className="text-white/30 text-sm w-full py-4 text-center">No areas yet</p>}
            {areas.map(a=>(
              <div key={a.id} className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-4 py-1.5">
                <span className="text-sm text-white/60">{a.area_name}</span>
                <span className="text-white/30 text-xs">{a.pincode}</span>
                <button onClick={()=>axios.delete(`/api/features/service-areas/${a.id}`,{withCredentials:true}).then(()=>{showToast('Removed');load()})} className="text-white/20 hover:text-red-400 text-xs ml-1">×</button>
              </div>
            ))}
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Pincode e.g. 560095" value={newArea.pincode} onChange={e=>setNewArea(a=>({...a,pincode:e.target.value.replace(/\D/g,'').slice(0,6)}))} className={inp}/>
              <input placeholder="Area name e.g. Bellandur" value={newArea.area_name} onChange={e=>setNewArea(a=>({...a,area_name:e.target.value}))} className={inp}/>
            </div>
            <button onClick={()=>{
              if(!newArea.pincode||!newArea.area_name){showToast('Both fields required','err');return}
              axios.post('/api/features/service-areas',newArea,{withCredentials:true})
                .then(()=>{setNewArea({pincode:'',area_name:''});showToast('Area added');load()})
                .catch(e=>showToast('Error: '+(e.response?.data?.error||e.message),'err'))
            }} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">Add area</button>
          </div>
        </div>
      )}

      {tab==='slots' && (
        <div>
          <p className="text-sm text-white/50 mb-4">Select available booking slots — 5 AM to 7 PM. Customers only see slots you enable.</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-5">
            {ALL_SLOTS.map(s=>(
              <button key={s} onClick={()=>toggleSlot(s)}
                className={`py-3 rounded-xl text-sm font-medium transition-colors ${activeSlots.includes(s)?'bg-blue-600 text-white':'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white'}`}>{s}</button>
            ))}
          </div>
          <div className="flex items-center gap-3 mb-5">
            <button onClick={()=>setActiveSlots(ALL_SLOTS)} className="text-xs px-3 py-1.5 border border-white/20 rounded-lg text-white/50 hover:text-white">Select all</button>
            <button onClick={()=>setActiveSlots([])} className="text-xs px-3 py-1.5 border border-white/20 rounded-lg text-white/50 hover:text-white">Clear all</button>
            <span className="text-xs text-white/30">{activeSlots.length} active</span>
          </div>
          <button onClick={saveSlots} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">Save booking slots</button>
        </div>
      )}

      {tab==='settings' && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-white/70">Business settings</p>
          {[['business_name','Business name','Zipo'],['admin_whatsapp','Admin WhatsApp number','9876543210'],['loyalty_points_per_booking','Loyalty points per booking','10'],['referral_bonus_points','Referral bonus points','50']].map(([k,label,ph])=>(
            <div key={k}>
              <label className="block text-xs text-white/40 mb-1">{label}</label>
              <input value={settings[k]||''} onChange={e=>setSettings(s=>({...s,[k]:e.target.value}))} placeholder={ph} className={inp}/>
            </div>
          ))}
          <button onClick={saveSettings} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">Save settings</button>
        </div>
      )}

      {tab==='upi' && (
        <div className="space-y-4">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-4">
            <p className="text-sm font-medium text-white/70">UPI payment — 0% fees</p>
            <p className="text-xs text-white/30">When enabled customers see your QR on the confirmation page and pay directly. Toggle off for pay-on-arrival.</p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/60">Enable UPI</span>
              <button onClick={()=>setSettings(s=>({...s,upi_enabled:s.upi_enabled==='true'?'false':'true'}))}
                className={`relative w-11 h-6 rounded-full transition-colors ${settings.upi_enabled==='true'?'bg-blue-600':'bg-white/20'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.upi_enabled==='true'?'left-6':'left-1'}`}></span>
              </button>
              <span className={`text-xs ${settings.upi_enabled==='true'?'text-emerald-400':'text-white/30'}`}>{settings.upi_enabled==='true'?'On — customers see QR':'Off — pay on arrival'}</span>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Your UPI ID</label>
              <input value={settings.upi_id||''} onChange={e=>setSettings(s=>({...s,upi_id:e.target.value}))} placeholder="zipocarwash@ybl" className={inp}/>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">QR code image URL</label>
              <input value={settings.upi_qr_url||''} onChange={e=>setSettings(s=>({...s,upi_qr_url:e.target.value}))} placeholder="https://i.imgur.com/yourqr.png" className={inp}/>
              <p className="text-xs text-white/20 mt-1">Upload QR to imgur.com → right-click → copy image address</p>
            </div>
            {settings.upi_qr_url&&<div className="bg-white p-2 rounded-xl inline-block"><img src={settings.upi_qr_url} alt="QR" className="w-32 h-32 object-contain"/></div>}
            <button onClick={saveSettings} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">Save UPI settings</button>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-xs text-white/30 leading-relaxed space-y-1">
            <p className="font-medium text-white/50 mb-2">How to get your QR URL</p>
            <p>1. Open PhonePe / Paytm / GPay business app → download merchant QR</p>
            <p>2. Go to <a href="https://imgur.com/upload" target="_blank" rel="noreferrer" className="text-blue-400">imgur.com/upload</a> → upload the QR image</p>
            <p>3. Right-click the uploaded image → Copy image address → paste above</p>
          </div>
        </div>
      )}
    </div>
  )
}
