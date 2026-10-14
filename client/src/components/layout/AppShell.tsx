import { useState, type ReactNode } from 'react'
import { MobileNavigation } from './MobileNavigation'
import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'
import { useHome } from '../../services/useHome'
import { Link } from 'react-router-dom'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data, notice, service } = useHome()
  const openAlerts = data?.alerts.filter(alert => alert.status === 'OPEN').length ?? 0
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <div className="app-shell">
      {isMenuOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMenu}
        />
      )}
      <Sidebar isOpen={isMenuOpen} onNavigate={closeMenu} />
      <div className="app-main">
        <TopHeader
          isMenuOpen={isMenuOpen}
          onMenuToggle={() => setIsMenuOpen((open) => !open)}
        />
        <a href="#main-content" className="skip-link">Skip to content</a>
        <main className="page-content" id="main-content" tabIndex={-1}>
          <div className="demo-banner"><span><strong>Simulation mode</strong> · Sample data only. No physical devices connected.</span><span>Asia/Colombo</span></div>
          {data?.settings.notifications && openAlerts > 0 && <div className="notification-strip"><Link to="/alerts">{openAlerts} open demo alerts · Review alerts →</Link></div>}
          {notice && <div className="notice-banner" role="status"><span>{notice}</span><button type="button" aria-label="Dismiss notification" onClick={service.clearNotice}>×</button></div>}
          {children}
        </main>
      </div>
      <MobileNavigation onMore={() => setIsMenuOpen(true)} />
    </div>
  )
}
