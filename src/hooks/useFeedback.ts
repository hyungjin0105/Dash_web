import { useQuery } from '@tanstack/react-query'
import { fetchFeedback } from '../services/feedback'

export const useFeedback = () =>
  useQuery({
    queryKey: ['customerFeedback'],
    queryFn: fetchFeedback,
    staleTime: 1000 * 30,
  })
