import { useQuery } from '@tanstack/react-query';
import { customerService } from '../services/customer.service';
import type { SearchParams } from '../types';

export function useSearchParking(params: SearchParams, enabled = true) {
    return useQuery({
        queryKey: ['parking-search', params],
        queryFn: () => customerService.searchParking(params),
        enabled: enabled && !!params.latitude && !!params.longitude,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 30 * 1000, // Refetch every 30s for real-time updates
    });
}
