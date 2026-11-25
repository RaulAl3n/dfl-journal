import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getNotes } from '@/services';

export function useGetNotes(notebookId: string | undefined, page: number, query: string) {
  return useQuery({
    queryKey: queryKeys.notes.byNotebook(notebookId ?? '', page, query),
    queryFn: () => getNotes({ notebookId: notebookId ?? '', page, query }),
    enabled: Boolean(notebookId),
  });
}
