import { useQuery } from '@tanstack/react-query'
import { fetchOrders } from '../services/orders'

export const useOrders = (restaurantId?: string) =>
  useQuery({
    queryKey: ['orders', restaurantId ?? 'all'],
    queryFn: () => fetchOrders(restaurantId),
    refetchInterval: 1000 * 30,
  })
