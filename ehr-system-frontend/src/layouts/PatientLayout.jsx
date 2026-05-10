import { Outlet } from 'react-router-dom'
import PatientHeader from '../components/PatientHeader'

export default function StudentLayout() {
 return (
 <div className="">
 <PatientHeader />
 <main className="">
 {/* Header */}
 <Outlet />
 </main>
 </div>
 )
}
