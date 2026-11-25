import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { createTask } from '@/services';

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { noteId: string; title: string }) => createTask(input),
    onSuccess: (_task, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byNote(input.noteId) });
    },
  });
}
