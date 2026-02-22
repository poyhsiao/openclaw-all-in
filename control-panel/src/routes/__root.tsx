import { createFileRoute } from '@tanstack/react-router'
import { QueryProvider } from '@/lib/query-provider'
import { Layout } from '@/components/layout'
import { Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: RootLayout,
})

export function RootLayout() {
  return (
    <QueryProvider>
      <Layout>
        <Outlet />
      </Layout>
    </QueryProvider>
  )
}
