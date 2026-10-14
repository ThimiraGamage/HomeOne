import { Menu, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { navigationGroups } from '../../data/navigation'
import { useHome } from '../../services/useHome'

type TopHeaderProps = {
  isMenuOpen: boolean
  onMenuToggle: () => void
}

export function TopHeader({ isMenuOpen, onMenuToggle }: TopHeaderProps) {
  const { pathname } = useLocation()
  const { data } = useHome()
  const currentPage = navigationGroups
    .flatMap((group) => group.items)
    .find((page) => page.path === pathname)

  return (
    <header className="top-header">
      <div className="header-title-group">
        <button
          className="icon-button menu-toggle"
          type="button"
          onClick={onMenuToggle}
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="header-context">
          <span className="header-eyebrow">HOME MANAGEMENT</span>
          <span className="header-current-page">{currentPage?.title ?? 'HomeOne'}</span>
        </div>
      </div>
      <div className="header-home-label">
        <span className="header-home-dot" />
        <span>{data?.settings.homeName ?? 'My home'}</span>
      </div>
    </header>
  )
}
