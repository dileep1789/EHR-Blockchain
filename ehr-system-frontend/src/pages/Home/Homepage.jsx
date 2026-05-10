import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import heroImage from '../../assets/images/hero-image.webp'
import howItWorksImage from '../../assets/images/how-it-works.webp'
import certificateImage from '../../assets/images/record.webp'

export default function Homepage() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const hash = location.hash?.replace('#', '')
    if (!hash) return

    const element = document.getElementById(hash)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  return (
    <div id="top" className="bg-slate-50">
      <Navbar />

      <header className="px-4 py-10 md:px-6 lg:py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row lg:items-stretch">
          <div className="flex-1 rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-8 text-white shadow-2xl shadow-emerald-950/20 md:p-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100">
              Blockchain EHR Management
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl lg:text-7xl">
              EHRChain
              <span className="block text-emerald-300">Secure health records, anchored on-chain.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
              EHRChain turns the existing portal into an electronic health record workflow where patients, providers, and administrators can manage clinical data with blockchain-backed integrity, auditability, and controlled sharing.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => navigate('/verify')}
                className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
              >
                Verify Health Record
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById('how-it-works')
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
                className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Explore Workflow
              </button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ['Patient consent', 'Controlled access for shared records'],
                ['Provider audit trail', 'Immutable record creation and updates'],
                ['Network verification', 'Hash-based integrity checks on chain']
              ].map(([title, detail]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm text-slate-300">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
            <img src={heroImage} alt="Blockchain health portal preview" className="h-full w-full object-cover" />
          </div>
        </div>
      </header>

      <section id="about" className="px-4 py-8 md:px-6 md:py-16">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-white p-6 shadow-lg md:p-10 lg:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Why blockchain for EHRs</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 md:text-5xl">One platform for records, consent, and verification.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600 md:text-lg">
              The converted experience keeps the existing secure login and blockchain flow, but repositions the product around patient charts, provider submissions, approvals, and tamper-evident health record sharing.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.75rem] bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-white">
              <h3 className="text-2xl font-bold">Core platform benefits</h3>
              <ul className="mt-6 space-y-4 text-sm leading-7 md:text-base">
                <li>Blockchain hashes preserve record integrity across every update.</li>
                <li>Role-based access separates patients, providers, and admins.</li>
                <li>Documents and attachments stay linked to each medical timeline entry.</li>
                <li>Verification is public when required, but controlled by patient consent.</li>
              </ul>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8">
              <div className="grid gap-4">
                {[
                  ['Clinical integrity', 'Every record change can be anchored to the chain for later review.'],
                  ['Faster sharing', 'Patients can share a verified snapshot with another provider.'],
                  ['Operational traceability', 'Admins can review approvals, access, and issuance history.']
                ].map(([title, description]) => (
                  <div key={title} className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="font-bold text-slate-900">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-8 md:px-6 md:py-16">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg md:p-10 lg:p-12">
          <div className="flex flex-col gap-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Workflow</p>
            <h2 className="text-3xl font-black text-slate-950 md:text-5xl">How the EHR flow works</h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['01. Register', 'Patients and providers create verified accounts with role-specific onboarding.'],
              ['02. Record', 'Clinical entries, files, and approvals are attached to a secure patient timeline.'],
              ['03. Verify', 'A hash and transaction reference prove the record has not been altered.']
            ].map(([step, detail]) => (
              <div key={step} className="rounded-[1.5rem] bg-slate-50 p-5">
                <p className="text-sm font-bold text-emerald-700">{step}</p>
                <p className="mt-3 text-base font-semibold text-slate-900">{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-slate-600 leading-8">
                Providers can add patient visits, prescriptions, lab summaries, and discharge notes from the secure portal. Patients can review their history, download a portable record packet, and confirm on-chain evidence for each entry when they need to share care across facilities.
              </p>
            </div>
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
              <img src={howItWorksImage} alt="EHR workflow illustration" className="w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section id="access" className="px-4 py-8 md:px-6 md:py-16">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl md:p-10 lg:p-12">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.5rem] bg-white/5 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">Patient portal</p>
              <h3 className="mt-3 text-2xl font-bold">Keep your medical history in one place.</h3>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-200 md:text-base">
                <li>Review visit summaries and uploaded attachments.</li>
                <li>Control whether your record snapshot is public or private.</li>
                <li>Share a verified record with a specialist or emergency provider.</li>
              </ul>
              <div className="mt-6">
                <Link to="/signup" className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 no-underline transition hover:bg-emerald-300">
                  Create Patient Account
                </Link>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-white/5 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">Provider portal</p>
              <h3 className="mt-3 text-2xl font-bold">Issue and verify care records from the blockchain ledger.</h3>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-200 md:text-base">
                <li>Register as a verified healthcare provider.</li>
                <li>Upload record batches for clinics, labs, or discharge notes.</li>
                <li>Anchor each update on chain for tamper evidence and auditability.</li>
              </ul>
              <div className="mt-6">
                <Link to="/signup?role=hospital" className="inline-flex rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white no-underline transition hover:bg-white/15">
                  Create Provider Account
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  )
}
