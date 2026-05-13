import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { Automation } from './pages/Automation'
import { CommandCenter } from './pages/CommandCenter'
import { IncidentDetail } from './pages/IncidentDetail'
import { IncidentsList } from './pages/IncidentsList'
import { ServicesTopology } from './pages/ServicesTopology'
import { Settings } from './pages/Settings'
import { TrendsReliability } from './pages/TrendsReliability'
import { ServiceHealthDetail } from './pages/ServiceHealthDetail'
import { Traces } from './pages/Traces'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<CommandCenter />} />
          <Route path="health/:serviceId" element={<ServiceHealthDetail />} />
          <Route path="traces" element={<Traces />} />
          <Route path="traces/:serviceId" element={<Traces />} />
          <Route path="incidents" element={<IncidentsList />} />
          <Route path="incidents/:id" element={<IncidentDetail />} />
          <Route path="services" element={<ServicesTopology />} />
          <Route path="trends" element={<TrendsReliability />} />
          <Route path="automation" element={<Automation />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
