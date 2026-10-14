import {
  Activity,
  Bell,
  Bot,
  DoorOpen,
  Droplets,
  Flower2,
  Gauge,
  PawPrint,
  Settings,
  Shield,
  Smartphone,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export type HomePage = {
  title: string
  path: string
  description: string
  icon: LucideIcon
}

export type NavigationGroup = {
  label: string
  items: HomePage[]
}

export const navigationGroups: NavigationGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        path: '/dashboard',
        description: 'A clear view of the systems and spaces that make up your home.',
        icon: Gauge,
      },
    ],
  },
  {
    label: 'Home',
    items: [
      {
        title: 'Energy',
        path: '/energy',
        description: 'Monitor energy use and manage the way your home consumes power.',
        icon: Activity,
      },
      {
        title: 'Water',
        path: '/water',
        description: 'Keep an eye on water use throughout your home.',
        icon: Droplets,
      },
      {
        title: 'Rooms',
        path: '/rooms',
        description: 'Browse the spaces in your home and the systems within them.',
        icon: DoorOpen,
      },
      {
        title: 'Devices',
        path: '/devices',
        description: 'View the devices associated with your home.',
        icon: Smartphone,
      },
      {
        title: 'Security',
        path: '/security',
        description: 'A dedicated place for your home security systems.',
        icon: Shield,
      },
      {
        title: 'Garden',
        path: '/garden',
        description: 'Manage the connected systems that care for your garden.',
        icon: Flower2,
      },
      {
        title: 'Pets',
        path: '/pets',
        description: 'Keep pet-related devices and routines in one place.',
        icon: PawPrint,
      },
    ],
  },
  {
    label: 'Management',
    items: [
      {
        title: 'Automations',
        path: '/automations',
        description: 'Organize the routines that help your home run smoothly.',
        icon: Bot,
      },
      {
        title: 'Alerts',
        path: '/alerts',
        description: 'Review important updates from across your home.',
        icon: Bell,
      },
      {
        title: 'Maintenance',
        path: '/maintenance',
        description: 'Keep track of the care and upkeep your home needs.',
        icon: Wrench,
      },
      {
        title: 'Settings',
        path: '/settings',
        description: 'Set up your HomeOne experience and preferences.',
        icon: Settings,
      },
    ],
  },
]

export const mobileNavigation = [
  '/dashboard',
  '/energy',
  '/rooms',
  '/devices',
] as const