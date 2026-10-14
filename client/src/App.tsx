import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { navigationGroups } from './data/navigation'
import { SectionPage } from './pages/SectionPage'
import './AppShell.css'
import './HomePages.css'
import { useEffect } from 'react'
import { useHomeService } from './services/homeStore'

function App() {
  const service = useHomeService()
  useEffect(() => {
    void service.load()
    const timer = setInterval(service.refreshTelemetry, 15_000)
    return () => clearInterval(timer)
  }, [service])
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {navigationGroups.flatMap((group) =>
          group.items.map((page) => (
            <Route
              key={page.path}
              path={page.path}
              element={<SectionPage page={page} />}
            />
          )),
        )}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App
