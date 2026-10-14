import { useHome } from '../../services/useHome'

type PageHeaderProps = {
  title: string
  description: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  const { data } = useHome()
  return (
    <div className="page-header">
      <div>
        <div className="page-breadcrumb">{data?.settings.homeName ?? 'My home'} <span>/</span> {title}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  )
}
