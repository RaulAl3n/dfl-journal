import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { createNote } from '@/services';

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { notebookId: string; title: string }) => createNote(input),
    onSuccess: (_note, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.inNotebook(input.notebookId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notebooks.all });
    },
  });
}
