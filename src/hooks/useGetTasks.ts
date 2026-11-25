import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getTasks } from '@/services';

export function useGetTasks(noteId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tasks.byNote(noteId ?? ''),
    queryFn: () => getTasks({ noteId: noteId ?? '' }),
    enabled: Boolean(noteId),
  });
}
