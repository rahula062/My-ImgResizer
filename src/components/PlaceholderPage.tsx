interface PlaceholderPageProps {
  title: string
  description: string
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <div className="section-header">
        <h2>{title}</h2>
        <div className="divider" />
        <p>{description}</p>
      </div>
      <div className="card">
        <div className="empty-state">This tool is coming soon in the React version with enhanced features!</div>
      </div>
    </div>
  )
}