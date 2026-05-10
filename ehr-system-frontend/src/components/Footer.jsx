import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer id="contact" className="bg-slate-950 px-4 py-6 text-center text-white">
      <div className="space-y-2">
        <h3 className="text-base font-semibold">CHAINMED EHR</h3>
        <p className="text-sm font-semibold">Blockchain-backed electronic health record management</p>

        <div className="flex flex-col items-center justify-center gap-4 text-xs sm:flex-row sm:gap-10 md:text-sm">
          <a href="/verify" className="hover:underline">Verify Record</a>
          <a href="/login?role=hospital" className="hover:underline">Provider Login</a>
          <a href="/login" className="hover:underline">Patient Login</a>
        </div>

        <p className="text-xs md:text-sm">© 2026 ChainMed. All rights reserved.</p>

        <div className="flex items-center justify-center gap-3 sm:gap-6 text-xs md:text-sm">
          <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
          <span>|</span>
          <Link to="/contact" className="hover:underline">Contact Us</Link>
          <span>|</span>
          <a href="#" className="hover:underline">Terms of Service</a>
        </div>
      </div>
    </footer>
  )
}
