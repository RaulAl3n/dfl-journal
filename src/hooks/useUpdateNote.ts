import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { updateNote } from '@/services';

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; notebookId: string; title: string; body: string }) =>
      updateNote({ id: input.id, title: input.title, body: input.body }),
    onSuccess: (_note, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.inNotebook(input.notebookId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.byId(input.id) });
    },
  });
}
