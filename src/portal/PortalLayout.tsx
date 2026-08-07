import { Outlet } from 'react-router-dom'

export function PortalLayout() {
  return (
    <div className="flex min-h-screen bg-background text-ink-900" style={{ fontSize: 14 }}>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
