import { pageSize } from '@/consts/pagination';
import { getSupabase } from '@/lib/supabase';
import type { Note, NotesPage } from '@/types';
import { currentUserId } from './current-user';

type NoteRow = {
  id: string;
  notebook_id: string;
  title: string;
  body: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

const noteColumns = 'id, notebook_id, title, body, is_favorite, created_at, updated_at';

// PostgREST devolve este código quando o range pedido passa do total de linhas.
const rangeNotSatisfiable = 'PGRST103';

export function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    notebookId: row.notebook_id,
    title: row.title,
    body: row.body,
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function requireTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error('Informe o título da nota.');
  }
  return trimmed;
}

export async function getNotes(input: {
  notebookId: string;
  page: number;
  query: string;
}): Promise<NotesPage> {
  const search = input.query.trim();
  const from = (input.page - 1) * pageSize;
  const to = from + pageSize - 1;

  let request = getSupabase()
    .from('notes')
    .select(noteColumns, { count: 'exact' })
    .eq('notebook_id', input.notebookId);
  if (search) {
    request = request.ilike('title', `%${escapeLike(search)}%`);
  }

  const { data, error, count } = await request
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (error?.code === rangeNotSatisfiable) {
    // Página além do fim: devolve só o total para a tela ir à última página.
    let countRequest = getSupabase()
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('notebook_id', input.notebookId);
    if (search) {
      countRequest = countRequest.ilike('title', `%${escapeLike(search)}%`);
    }
    const counted = await countRequest;
    if (counted.error) {
      throw new Error(counted.error.message);
    }
    return { notes: [], total: counted.count ?? 0 };
  }
  if (error) {
    throw new Error(error.message);
  }
  return { notes: data.map(toNote), total: count ?? 0 };
}

export async function createNote(input: { notebookId: string; title: string }): Promise<Note> {
  const title = requireTitle(input.title);
  const userId = await currentUserId();
  const { data, error } = await getSupabase()
    .from('notes')
    .insert({ title, notebook_id: input.notebookId, user_id: userId })
    .select(noteColumns)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return toNote(data);
}

export async function updateNote(input: { id: string; title: string; body: string }): Promise<Note> {
  const title = requireTitle(input.title);
  const { data, error } = await getSupabase()
    .from('notes')
    .update({ title, body: input.body })
    .eq('id', input.id)
    .select(noteColumns)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return toNote(data);
}

export async function deleteNote(input: { id: string }): Promise<void> {
  const { error } = await getSupabase().from('notes').delete().eq('id', input.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function setNoteFavorite(input: { id: string; isFavorite: boolean }): Promise<Note> {
  const { data, error } = await getSupabase()
    .from('notes')
    .update({ is_favorite: input.isFavorite })
    .eq('id', input.id)
    .select(noteColumns)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return toNote(data);
}
