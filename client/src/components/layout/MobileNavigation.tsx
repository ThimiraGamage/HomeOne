import { MoreHorizontal } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { mobileNavigation, navigationGroups } from '../../data/navigation'

type MobileNavigationProps = {
  onMore: () => void
}

export function MobileNavigation({ onMore }: MobileNavigationProps) {
  const pages = navigationGroups.flatMap((group) => group.items)
  const primaryPages = mobileNavigation.map((path) =>
    pages.find((page) => page.path === path)!,
  )

  return (
    <nav className="mobile-navigation" aria-label="Mobile navigation">
      {primaryPages.map(({ title, path, icon: Icon }) => (
        <NavLink
          className={({ isActive }) =>
            `mobile-navigation-link${isActive ? ' mobile-navigation-link--active' : ''}`
          }
          key={path}
          to={path}
        >
          <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
          <span>{title}</span>
        </NavLink>
      ))}
      <button className="mobile-navigation-link" type="button" onClick={onMore}>
        <MoreHorizontal size={20} aria-hidden="true" />
        <span>More</span>
      </button>
    </nav>
  )
}