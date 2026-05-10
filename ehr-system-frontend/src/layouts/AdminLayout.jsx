import { Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'

export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar
        open={open}
        onToggle={() => setOpen((value) => !value)}
        onNavigate={(path) => navigate(path)}
      />
      <main
        className={`transition-all duration-300 ${open ? 'sm:pl-64' : 'sm:pl-20'} ${open ? 'blur-sm' : ''} bg-[#eadbff] min-h-screen`}
      >
        <div className="px-6 pb-6 pt-20 sm:pt-6">
          <Outlet />
        </div>
      </main>
      {open && (
        <button
          aria-label="Close sidebar overlay"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-10 bg-black/10 backdrop-blur-sm"
        />
      )}
    </div>
  )
}
