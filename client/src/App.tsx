import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Projects from './pages/Projects'
import Tasks from './pages/Tasks'
import Shipments from './pages/Shipments'
import Inbox from './pages/Inbox'
import Settings from './pages/Settings'
import Setup from './pages/Setup'
import SetupFacebook from './pages/SetupFacebook'
import Calculators from './pages/Calculators'

function SetupGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  useEffect(() => {
    fetch('/api/gmail/status')
      .then((r) => r.json())
      .then((s) => {
        if (!s.connected && !s.setupSkipped) {
          navigate('/setup', { replace: true })
        }
      })
      .catch(() => {})
  }, [])
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/setup" element={<Setup />} />
      <Route path="/setup-facebook" element={<SetupFacebook />} />
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<SetupGuard><Dashboard /></SetupGuard>} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/shipping" element={<Shipments />} />
        <Route path="/calculators" element={<Calculators />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
