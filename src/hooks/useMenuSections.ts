import { useQuery } from '@tanstack/react-query'
import { fetchMenuSections } from '../services/restaurants'

export const useMenuSections = (restaurantId: string) =>
  useQuery({
    queryKey: ['menu-sections', restaurantId],
    queryFn: () => fetchMenuSections(restaurantId),
    enabled: Boolean(restaurantId),
  })
