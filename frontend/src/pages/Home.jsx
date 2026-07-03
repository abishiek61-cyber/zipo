import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const BADGE = { Exterior:'bg-blue-900/40 text-blue-300', Signature:'bg-purple-900/40 text-purple-300', Eco:'bg-emerald-900/40 text-emerald-300', Premium:'bg-amber-900/40 text-amber-300' }
const PKG_ICONS = { Exterior:'💧', Signature:'✨', Eco:'🌿', Premium:'⭐' }
const DURATIONS = { Exterior:'~45 min', Signature:'~90 min', Eco:'~60 min', Premium:'~2.5 hrs' }

export default function Home() {
  const [slogans, setSlogans] = useState(['Zero wash, zero mess','Scratch-free gloss tech','Signature eco shine'])
  const [packages, setPackages] = useState([])
  const [reviews, setReviews] = useState([])
  const [gallery, setGallery] = useState([])
  const [blog, setBlog] = useState([])
  const [areas, setAreas] = useState([])
  const { user, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/api/slogans').then(r => { if (r.data.length) setSlogans(r.data.map(s => s.text)) })
    axios.get('/api/packages').then(r => setPackages(r.data))
    axios.get('/api/features/reviews').then(r => setReviews(r.data)).catch(()=>{})
    axios.get('/api/features/gallery').then(r => setGallery(r.data)).catch(()=>{})
    axios.get('/api/features/blog').then(r => setBlog(r.data)).catch(()=>{})
    axios.get('/api/features/service-areas').then(r => setAreas(r.data)).catch(()=>{})
  }, [])

  const handleBook = () => user ? navigate('/book') : loginWithGoogle()
  const avgRating = reviews.length ? (reviews.reduce((a,r) => a + r.rating, 0) / reviews.length).toFixed(1) : null

  return (
    <div>
      <section className="px-6 py-20 text-center max-w-3xl mx-auto">
        <div className="slogan-container mb-4">
          <div className="slogan-track">
            {[...slogans, slogans[0]].map((s,i) => (
              <div key={i} className="h-[52px] flex items-center justify-center text-4xl font-semibold tracking-tight">{s}</div>
            ))}
          </div>
        </div>
        {avgRating && (
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <span className="text-amber-400 text-sm">{'★'.repeat(Math.round(avgRating))}</span>
            <span className="text-white/60 text-sm">{avgRating} from {reviews.length} customers</span>
          </div>
        )}
        <p className="text-white/40 mb-8">Premium car detailing — book in 60 seconds, we come to you</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={handleBook} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors">Book a service</button>
          <a href="#packages" className="px-6 py-3 border border-white/15 hover:border-white/30 rounded-xl transition-colors text-white/60 hover:text-white">See packages</a>
        </div>
      </section>

      <section id="packages" className="px-6 pb-16 max-w-5xl mx-auto">
        <p className="text-xs font-medium tracking-widest text-blue-400 uppercase mb-2">Our packages</p>
        <h2 className="text-2xl font-semibold mb-8">Choose your shine level</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((pkg, idx) => (
            <div key={pkg.id} onClick={handleBook}
              className={`relative bg-white/[0.03] border rounded-2xl p-5 hover:border-blue-500/70 transition-all cursor-pointer group hover:-translate-y-0.5 ${idx===1 ? 'border-blue-500/50' : 'border-white/10'}`}>
              {idx===1 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">Most popular</div>}
              <div className="text-2xl mb-3">{PKG_ICONS[pkg.badge] || '🚗'}</div>
              <span className={`text-xs font-medium px-2 py-1 rounded-md inline-block mb-3 ${BADGE[pkg.badge]||'bg-white/10 text-white/60'}`}>{pkg.badge}</span>
              <h3 className="font-medium mb-2">{pkg.name}</h3>
              <p className="text-sm text-white/40 leading-relaxed mb-4">{pkg.description}</p>
              <div className="text-xl font-semibold text-blue-400">₹{Number(pkg.price).toLocaleString('en-IN')}<span className="text-sm text-white/30 font-normal"> / visit</span></div>
              {pkg.interior_addon > 0 && <div className="text-xs text-emerald-400 mt-1">+ ₹{Number(pkg.interior_addon).toLocaleString('en-IN')} interior</div>}
              <div className="text-xs text-white/20 mt-1">{DURATIONS[pkg.badge] || ''}</div>
              <div className="mt-3 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">Book now →</div>
            </div>
          ))}
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="px-6 pb-16 max-w-5xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-blue-400 uppercase mb-2">Our work</p>
          <h2 className="text-2xl font-semibold mb-8">Before and after</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gallery.map(g => (
              <div key={g.id} className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="relative">
                    <img src={g.before_url} alt="Before" className="w-full h-32 object-cover"/>
                    <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white/70 px-1.5 py-0.5 rounded">Before</span>
                  </div>
                  <div className="relative">
                    <img src={g.after_url} alt="After" className="w-full h-32 object-cover"/>
                    <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white/70 px-1.5 py-0.5 rounded">After</span>
                  </div>
                </div>
                {g.caption && <p className="text-xs text-white/40 px-3 py-2">{g.caption}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="px-6 pb-16 max-w-5xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-blue-400 uppercase mb-2">What customers say</p>
          <h2 className="text-2xl font-semibold mb-8">Customer reviews</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.slice(0,6).map(r => (
              <div key={r.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={s <= r.rating ? 'text-amber-400' : 'text-white/20'}>★</span>
                  ))}
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-3">"{r.comment || 'Great service!'}"</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/30">{r.customer_name}</span>
                  <span className="text-xs text-white/20">{r.package_name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {areas.length > 0 && (
        <section className="px-6 pb-16 max-w-5xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-blue-400 uppercase mb-2">Where we serve</p>
          <h2 className="text-2xl font-semibold mb-6">Service areas in Bengaluru</h2>
          <div className="flex flex-wrap gap-2">
            {areas.map(a => (
              <span key={a.id} className="bg-white/[0.04] border border-white/10 rounded-full px-4 py-1.5 text-sm text-white/60">
                {a.area_name} <span className="text-white/30 text-xs ml-1">{a.pincode}</span>
              </span>
            ))}
            <span className="bg-blue-900/20 border border-blue-800/30 rounded-full px-4 py-1.5 text-sm text-blue-400 cursor-pointer hover:bg-blue-900/30">+ More coming soon</span>
          </div>
        </section>
      )}

      {blog.length > 0 && (
        <section className="px-6 pb-20 max-w-5xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-blue-400 uppercase mb-2">Car care tips</p>
          <h2 className="text-2xl font-semibold mb-8">From the Zipo team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {blog.map(post => (
              <div key={post.id} className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors">
                {post.image_url && <img src={post.image_url} alt={post.title} className="w-full h-36 object-cover"/>}
                <div className="p-4">
                  <h3 className="font-medium mb-2 text-sm">{post.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{post.content}</p>
                  <p className="text-xs text-white/20 mt-2">{new Date(post.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
