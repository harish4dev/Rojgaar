import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Landing from '@/pages/Landing'
import PortalGateway from '@/pages/PortalGateway'
import BusinessAuth from '@/pages/business/Auth'
import BusinessDashboard from '@/pages/business/Dashboard'
import PartnerAuth from '@/pages/partner/Auth'
import PartnerDashboard from '@/pages/partner/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/portal" element={<PortalGateway />} />
        <Route path="/business/login" element={<BusinessAuth />} />
        <Route path="/business/dashboard" element={<BusinessDashboard />} />
        <Route path="/partner/login" element={<PartnerAuth />} />
        <Route path="/partner/dashboard" element={<PartnerDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
