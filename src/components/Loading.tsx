interface LoadingProps {
  message?: string
}

export default function Loading({ message = 'Loading...' }: LoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-deep">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="font-display text-sm text-accent3 tracking-wider">
          {message}
        </p>
      </div>
    </div>
  )
}