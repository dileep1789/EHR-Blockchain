import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-certi-repeat">
      <Navbar />
      <main className="px-4 py-10 md:py-14">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-6">Effective date: February 7, 2026</p>

          <section className="space-y-4 text-gray-700 text-sm md:text-base leading-relaxed">
            <p>
              ChainMed respects your privacy. This policy explains what information we collect, how we use it,
              and the choices you have when using our services.
            </p>

            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Information We Collect</h2>
              <ul className="list-disc ml-5 space-y-2">
                <li>Account details such as name, email address, and login credentials.</li>
                <li>Profile data you provide, including hospital details and uploaded verification documents.</li>
                <li>Blockchain-related data such as wallet addresses and record identifiers.</li>
                <li>Usage data like pages viewed and actions taken for service improvement.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">How We Use Information</h2>
              <ul className="list-disc ml-5 space-y-2">
                <li>To create and manage your account and verify your identity or institution.</li>
                <li>To issue, store, and verify records securely on supported blockchains.</li>
                <li>To provide customer support and communicate important updates.</li>
                <li>To improve performance, security, and user experience.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Sharing and Disclosure</h2>
              <p>
                We do not sell your personal information. We may share data only when required to provide services,
                comply with legal obligations, or protect the security of ChainMed and its users.
              </p>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Data Security</h2>
              <p>
                We implement technical and organizational safeguards to protect your information. However, no system
                is completely secure, and we cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Your Choices</h2>
              <p>
                You can update your account details, manage your records, or request account deletion through
                your dashboard or by contacting support.
              </p>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Contact Us</h2>
              <p>
                If you have questions about this policy, please reach out via the Contact section on our website.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
