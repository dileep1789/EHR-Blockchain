import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/images/logo.webp'

const items = [
  { path: '/admin/dashboard', label: 'Dashboard', color: 'text-sky-200', icon: DashboardIcon },
  { path: '/admin/approvals', label: 'Pending', color: 'text-amber-200', icon: HourglassIcon },
  { path: '/admin/hospitals', label: 'Hospitals', color: 'text-violet-200', icon: HospitalIcon },
]

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8l4 4-4 4" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </svg>
  )
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="5" rx="1" />
      <rect x="13" y="10" width="8" height="11" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
    </svg>
  )
}

function HourglassIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12" />
      <path d="M6 21h12" />
      <path d="M8 5c0 4 8 4 8 8s-8 4-8 8" />
      <path d="M16 5c0 4-8 4-8 8s8 4 8 8" />
    </svg>
  )
}

function HospitalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 22V8a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
      <path d="M2 22h20" />
      <path d="M10 14h4" />
      <path d="M12 12v4" />
    </svg>
  )
}

export default function AdminSidebar({ open, onToggle, onNavigate }) {
  const location = useLocation()
  const navigateHook = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigateHook('/admin/login')
  }

  return (
    <>
      <aside className={`fixed left-0 top-0 bottom-0 bg-[#6d34d6] text-white hidden sm:flex flex-col py-6 shadow-[4px_0_12px_rgba(0,0,0,0.15)] transition-[width] duration-300 z-30 ${open ? 'w-64 px-6' : 'w-20 items-center px-0'}`}>
        <button
          onClick={onToggle}
          aria-label="Expand sidebar"
          className={`w-10 h-10 rounded-full border-2 border-white/70 flex items-center justify-center ${open ? 'hidden' : 'self-center'}`}
        >
          <ArrowIcon />
        </button>

        <div className={`mt-6 flex items-center gap-3 ${open ? '' : 'justify-center'}`}>
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-amber-300">
            <LockIcon />
          </div>
          <div className={`${open ? 'block' : 'hidden'} text-xl font-semibold`}>Admin</div>
        </div>

      <nav className={`mt-10 flex flex-col gap-4 ${open ? '' : 'items-center'}`}>
        {items.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`flex items-center gap-3 rounded-xl transition-colors ${open ? 'px-4 py-3 w-full' : 'w-12 h-12 justify-center'} ${active ? 'bg-white/25' : 'bg-white/10'}`}
                aria-label={item.label}
              >
                <span className={item.color}>
                  <Icon />
                </span>
                <span className={`${open ? 'block' : 'hidden'} text-base font-medium`}>{item.label}</span>
              </button>
            )
        })}
      </nav>

      <div className={`${open ? 'block' : 'hidden'} mt-auto pb-2`}>
        <button onClick={handleLogout} className="w-full bg-white/20 hover:bg-white/25 transition-colors px-4 py-3 rounded-xl font-semibold">
          Log Out
        </button>
      </div>
    </aside>

      <div className="sm:hidden fixed left-0 right-0 top-0 z-30">
        <div className="bg-linear-to-r from-[#6d34d6] to-[#7a46e6] text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold tracking-wide">
            <img src={logo} alt="ChainMed logo" className="w-40 h-8 object-cover" />
            <span className="sr-only">ChainMed EHR</span>
          </div>
          <button onClick={onToggle} aria-label="Toggle mobile menu" className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
            {open ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </svg>
            )}
          </button>
        </div>
        {open && (
          <div className="bg-[#b9a6e6] text-center py-4 space-y-3 text-sm">
            {items.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path)
                  onToggle()
                }}
                className="block w-full font-semibold text-gray-900"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
