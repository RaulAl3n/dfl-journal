import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { setTaskDone } from '@/services';

export function useToggleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; noteId: string; isDone: boolean }) =>
      setTaskDone({ id: input.id, isDone: input.isDone }),
    onSuccess: (_task, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byNote(input.noteId) });
    },
  });
}
