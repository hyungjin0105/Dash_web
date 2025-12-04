import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from './AuthProvider'
import { StoreProvider } from './StoreProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
    },
  },
})

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <StoreProvider>{children}</StoreProvider>
    </AuthProvider>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
)
