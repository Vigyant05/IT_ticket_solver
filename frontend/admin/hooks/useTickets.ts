import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '@admin/lib/api';

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
