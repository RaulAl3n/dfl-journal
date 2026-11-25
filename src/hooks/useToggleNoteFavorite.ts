import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { setNoteFavorite } from '@/services';

export function useToggleNoteFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; notebookId: string; isFavorite: boolean }) =>
      setNoteFavorite({ id: input.id, isFavorite: input.isFavorite }),
    onSuccess: (_note, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.inNotebook(input.notebookId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.byId(input.id) });
    },
  });
}
