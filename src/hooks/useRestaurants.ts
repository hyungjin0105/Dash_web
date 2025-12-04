import { useQuery } from '@tanstack/react-query'
import { fetchRestaurants } from '../services/restaurants'

const keyFromIds = (allowedIds?: string[] | null) => {
  if (allowedIds === undefined) return 'all'
  if (!allowedIds || allowedIds.length === 0) return 'none'
  return allowedIds.slice().sort().join(',')
}

export const useRestaurants = (allowedIds?: string[] | null) =>
  useQuery({
    queryKey: ['restaurants', keyFromIds(allowedIds)],
    queryFn: async () => {
      const data = await fetchRestaurants()
      if (allowedIds === undefined) return data
      if (!allowedIds || allowedIds.length === 0) return []
      return data.filter((restaurant) => allowedIds.includes(restaurant.id))
    },
    staleTime: 1000 * 60,
  })
