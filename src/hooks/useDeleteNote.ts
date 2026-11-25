import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { deleteNote } from '@/services';

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; notebookId: string }) => deleteNote({ id: input.id }),
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.inNotebook(input.notebookId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.byId(input.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notebooks.all });
    },
  });
}
