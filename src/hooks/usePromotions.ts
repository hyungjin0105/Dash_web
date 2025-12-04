import { useQuery } from '@tanstack/react-query'
import { fetchPromotions } from '../services/promotions'

const buildKey = (storeIds?: string[]) => {
  if (!storeIds || storeIds.length === 0) return 'all'
  return storeIds.slice().sort().join(',')
}

export const usePromotions = (storeIds?: string[]) =>
  useQuery({
    queryKey: ['promotions', buildKey(storeIds)],
    queryFn: () => fetchPromotions(storeIds),
    enabled: !storeIds || storeIds.length > 0,
    staleTime: 1000 * 30,
  })
