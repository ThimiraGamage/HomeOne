import { PageHeader } from '../components/ui/PageHeader'
import { type HomePage } from '../data/navigation'
import { useHome } from '../services/useHome'
import { Dashboard, Energy, Water } from './OverviewPages'
import { Devices, Garden, Pets, Rooms, Security } from './HomePages'
import { Alerts, Automations, Maintenance, Settings } from './ManagementPages'

type SectionPageProps = {
  page: HomePage
}

export function SectionPage({ page }: SectionPageProps) {
  const { data, loading, error, service } = useHome()

  if (loading) return <><PageHeader title={page.title} description={page.description} /><div className="empty-state" role="status">Loading your simulated home…</div></>
  if (error || !data) return <><PageHeader title={page.title} description={page.description} /><div className="inline-error" role="alert">{error ?? 'Home data is unavailable.'}</div><button className="button" onClick={() => void service.load()}>Retry loading</button></>
  const pages = {
    '/dashboard': <Dashboard data={data} />,
    '/energy': <Energy data={data} />,
    '/water': <Water data={data} />,
    '/rooms': <Rooms data={data} />,
    '/devices': <Devices data={data} service={service} />,
    '/security': <Security data={data} />,
    '/garden': <Garden data={data} />,
    '/pets': <Pets data={data} />,
    '/automations': <Automations data={data} service={service} />,
    '/alerts': <Alerts data={data} service={service} />,
    '/maintenance': <Maintenance data={data} />,
    '/settings': <Settings data={data} service={service} />,
  }

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      {pages[page.path as keyof typeof pages]}
    </>
  )
}
