import { createFileRoute } from '@tanstack/react-router'
import { QueryProvider } from '@/lib/query-provider'
import { Layout } from '@/components/layout'

export const Route = createFileRoute('/')({
  component: RootLayout,
}) as any

export function RootLayout() {
  return (
    <QueryProvider>
      <Layout />
    </QueryProvider>
  )
}
