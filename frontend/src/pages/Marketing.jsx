import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
const PLATFORMS = [
  { key:'instagram', label:'Instagram', color:'text-pink-400', bg:'bg-pink-900/20', icon:'📸' },
  { key:'facebook', label:'Facebook', color:'text-blue-400', bg:'bg-blue-900/20', icon:'👍' },
  { key:'whatsapp', label:'WhatsApp Business', color:'text-emerald-400', bg:'bg-emerald-900/20', icon:'💬' },
  { key:'twitter', label:'X / Twitter', color:'text-white', bg:'bg-white/5', icon:'𝕏' }
]
export default function Marketing() {
  const { user } = useAuth()
  const [conn, setConn] = useState({ instagram:true, facebook:true, whatsapp:false, twitter:false })
  if (!user||!['admin','marketing'].includes(user.role)) return <div className="text-center py-20 text-white/30">Marketing or admin access required.</div>
  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <p className="text-xs font-medium tracking-widest text-blue-400 uppercase mb-1">Marketing team</p>
      <h1 className="text-2xl font-semibold mb-8">Social accounts</h1>
      <div className="space-y-3">
        {PLATFORMS.map(p=>(
          <div key={p.key} className={`flex items-center gap-4 border border-white/10 rounded-2xl px-5 py-4 ${p.bg}`}>
            <div className="text-2xl w-10 text-center">{p.icon}</div>
            <div className="flex-1"><div className={`font-medium ${p.color}`}>{p.label}</div><div className="text-xs text-white/30 mt-0.5">{conn[p.key]?'Connected and active':'Not connected'}</div></div>
            <button onClick={()=>setConn(c=>({...c,[p.key]:!c[p.key]}))}
              className={`text-xs px-4 py-2 rounded-lg border transition-colors ${conn[p.key]?'border-red-500/40 text-red-400 hover:bg-red-900/20':'border-white/20 text-white/50 hover:text-white hover:border-white/40'}`}>
              {conn[p.key]?'Disconnect':'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
