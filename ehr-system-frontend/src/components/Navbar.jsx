import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/images/logo.webp'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const closeMenu = () => setOpen(false)

  const handleHomeClick = (e) => {
    // If already on homepage, smooth scroll to top
    if (location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setOpen(false)
    }
  }

  return (
    <header className="relative top-0 z-50 bg-slate-950 text-white shadow-lg md:sticky">
      <div className="max-w-312 mx-auto flex items-center justify-between gap-3 px-3 md:px-4 py-3">
        <div className="flex items-center">
          <Link to="/" aria-label="Homepage" className="inline-flex items-center hover:opacity-90 no-underline" onClick={handleHomeClick}>
            <span className="text-2xl font-extrabold text-white tracking-tighter">EHR<span className="text-emerald-400">Chain</span></span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Primary">
          <ul className="flex items-center gap-5 m-0 p-0 list-none" onClick={closeMenu}>
            <li>
              <Link to="/" className="font-medium text-white no-underline hover:underline" onClick={handleHomeClick}>HOME</Link>
            </li>
            <li>
              <Link to="/#about" className="font-medium text-white no-underline hover:underline">ABOUT</Link>
            </li>
            <li>
              <Link to="/login" className="font-medium text-white no-underline hover:underline">LOGIN</Link>
            </li>
            <li>
              <Link to="/signup" className="font-medium text-white no-underline hover:underline">SIGNUP</Link>
            </li>
            <li>
              <Link to="/contact" className="font-medium text-white no-underline hover:underline">CONTACT</Link>
            </li>
          </ul>
        </nav>

        {/* Desktop Verify */}
        <div className="hidden md:block">
          <Link to="/verify" className="inline-block rounded-lg border-2 border-emerald-300 bg-emerald-300 px-4 py-2 font-semibold text-slate-950 no-underline transition-colors hover:bg-transparent hover:text-emerald-300" onClick={closeMenu}>VERIFY</Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden bg-transparent border-none cursor-pointer p-1"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block w-6 h-0.5 bg-white my-1" />
          <span className="block w-6 h-0.5 bg-white my-1" />
          <span className="block w-6 h-0.5 bg-white my-1" />
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="absolute inset-x-0 top-full bg-slate-950 px-4 pb-4 shadow-lg md:hidden">
          <nav aria-label="Primary" onClick={closeMenu}>
            <ul className="flex flex-col gap-3 m-0 p-0 list-none">
              <li>
                <Link to="/" className="font-medium text-white no-underline hover:underline" onClick={handleHomeClick}>Home</Link>
              </li>
              <li>
                <Link to="/#about" className="font-medium text-white no-underline hover:underline">About</Link>
              </li>
              <li>
                <Link to="/login" className="font-medium text-white no-underline hover:underline">Login</Link>
              </li>
              <li>
                <Link to="/signup" className="font-medium text-white no-underline hover:underline">Signup</Link>
              </li>
              <li>
                <Link to="/contact" className="font-medium text-white no-underline hover:underline">Contact</Link>
              </li>
            </ul>
          </nav>
          <div className="mt-3">
            <Link to="/verify" className="inline-block rounded-lg border-2 border-emerald-300 bg-emerald-300 px-4 py-2 font-semibold text-slate-950 no-underline transition-colors hover:bg-transparent hover:text-emerald-300" onClick={closeMenu}>Verify</Link>
          </div>
        </div>
      )}
    </header>
  )
}
