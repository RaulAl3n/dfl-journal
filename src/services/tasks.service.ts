import { getSupabase } from '@/lib/supabase';
import type { Task } from '@/types';
import { currentUserId } from './current-user';

type TaskRow = {
  id: string;
  note_id: string;
  title: string;
  is_done: boolean;
  created_at: string;
};

const taskColumns = 'id, note_id, title, is_done, created_at';

export function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    noteId: row.note_id,
    title: row.title,
    isDone: row.is_done,
    createdAt: row.created_at,
  };
}

export async function getTasks(input: { noteId: string }): Promise<Task[]> {
  const { data, error } = await getSupabase()
    .from('tasks')
    .select(taskColumns)
    .eq('note_id', input.noteId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data.map(toTask);
}

export async function createTask(input: { noteId: string; title: string }): Promise<Task> {
  const title = input.title.trim();
  if (!title) {
    throw new Error('Informe o título da tarefa.');
  }
  const userId = await currentUserId();
  const { data, error } = await getSupabase()
    .from('tasks')
    .insert({ title, note_id: input.noteId, user_id: userId })
    .select(taskColumns)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return toTask(data);
}

export async function setTaskDone(input: { id: string; isDone: boolean }): Promise<Task> {
  const { data, error } = await getSupabase()
    .from('tasks')
    .update({ is_done: input.isDone })
    .eq('id', input.id)
    .select(taskColumns)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return toTask(data);
}
