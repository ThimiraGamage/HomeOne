import { House } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { navigationGroups } from '../../data/navigation'
import { useHome } from '../../services/useHome'

type SidebarProps = {
  isOpen: boolean
  onNavigate: () => void
}

export function Sidebar({ isOpen, onNavigate }: SidebarProps) {
  const { data } = useHome()
  return (
    <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
      <NavLink className="brand" to="/dashboard" onClick={onNavigate}>
        <span className="brand-mark" aria-hidden="true">
          <House size={20} strokeWidth={2.3} />
        </span>
        <span className="brand-name">Home<span>One</span></span>
      </NavLink>

      <div className="sidebar-home">
        <span className="sidebar-home-icon"><House size={16} /></span>
        <span className="sidebar-home-name">{data?.settings.homeName ?? 'My home'}</span>
        <span className="home-indicator" aria-label="Selected home" />
      </div>

      <nav className="primary-navigation" aria-label="Main navigation">
        {navigationGroups.map((group) => (
          <section className="navigation-group" key={group.label}>
            <h2 className="navigation-label">{group.label}</h2>
            {group.items.map(({ title, path, icon: Icon }) => (
              <NavLink
                className={({ isActive }) =>
                  `navigation-link${isActive ? ' navigation-link--active' : ''}`
                }
                key={path}
                to={path}
                onClick={onNavigate}
              >
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>{title}</span>
              </NavLink>
            ))}
          </section>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="footer-status-dot" />
        <span>HomeOne</span>
        <span className="footer-version">Smart living</span>
      </div>
    </aside>
  )
}
