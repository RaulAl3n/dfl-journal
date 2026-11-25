import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getNote } from '@/services';

export function useGetNote(notebookId: string | undefined, noteId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.notes.byId(noteId ?? ''),
    queryFn: () => getNote({ notebookId: notebookId ?? '', id: noteId ?? '' }),
    enabled: Boolean(notebookId) && Boolean(noteId),
  });
}
