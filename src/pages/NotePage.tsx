import { FormEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { routes } from '@/consts/routes';
import {
  useCreateTask,
  useDeleteNote,
  useGetNote,
  useGetTasks,
  useToggleNoteFavorite,
  useToggleTask,
  useUpdateNote,
} from '@/hooks';
import type { Note, Task } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Spinner } from '@/components/ui/Spinner';

const inputClass =
  'w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900';
const primaryButtonClass =
  'shrink-0 rounded-md bg-stone-900 px-3 py-2 text-sm text-white disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900';
const secondaryButtonClass =
  'shrink-0 rounded-md border border-stone-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-stone-700';

function NoteEditor({ note }: { note: Note }) {
  const navigate = useNavigate();
  const update = useUpdateNote();
  const remove = useDeleteNote();
  const toggleFavorite = useToggleNoteFavorite();
  const [title, setTitle] = useState<string | null>(null);
  const [body, setBody] = useState<string | null>(null);
  const shownTitle = title ?? note.title;
  const shownBody = body ?? note.body;
  const trimmedTitle = shownTitle.trim();

  function onSave(event: FormEvent) {
    event.preventDefault();
    if (!trimmedTitle) return;
    setTitle(trimmedTitle);
    update.reset();
    update.mutate({ id: note.id, notebookId: note.notebookId, title: trimmedTitle, body: shownBody });
  }

  function onToggleFavorite() {
    toggleFavorite.reset();
    toggleFavorite.mutate({ id: note.id, notebookId: note.notebookId, isFavorite: !note.isFavorite });
  }

  function onDelete() {
    const confirmed = window.confirm(
      `Apagar a nota "${note.title}"? As tarefas dela também serão apagadas.`,
    );
    if (!confirmed) return;
    remove.reset();
    remove.mutate(
      { id: note.id, notebookId: note.notebookId },
      { onSuccess: () => navigate(routes.notebook(note.notebookId), { replace: true }) },
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleFavorite}
          disabled={toggleFavorite.isPending}
          aria-pressed={note.isFavorite}
          className="rounded-md border border-stone-300 px-2 py-1 text-sm disabled:opacity-60 dark:border-stone-700"
        >
          {toggleFavorite.isPending ? 'Salvando…' : note.isFavorite ? '★ Favorita' : '☆ Favoritar'}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={remove.isPending}
          className="text-sm text-red-700 underline disabled:opacity-60"
        >
          {remove.isPending ? 'Apagando…' : 'Apagar nota'}
        </button>
      </div>
      {toggleFavorite.isError && (
        <p className="mt-2 text-sm text-red-700">{toggleFavorite.error.message}</p>
      )}
      {remove.isError && <p className="mt-2 text-sm text-red-700">{remove.error.message}</p>}

      <form className="mt-4 space-y-3" onSubmit={onSave}>
        <label className="block text-sm">
          Título
          <input
            value={shownTitle}
            onChange={(event) => setTitle(event.target.value)}
            className={`mt-1 ${inputClass}`}
          />
          {!trimmedTitle && (
            <span className="mt-1 block text-red-700">Informe o título da nota.</span>
          )}
        </label>
        <label className="block text-sm">
          Texto
          <textarea
            value={shownBody}
            onChange={(event) => setBody(event.target.value)}
            rows={6}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        {update.isError && <p className="text-sm text-red-700">{update.error.message}</p>}
        {update.isSuccess && <p className="text-sm text-emerald-700">Salvo.</p>}
        <button
          type="submit"
          disabled={update.isPending || !trimmedTitle}
          className={primaryButtonClass}
        >
          {update.isPending ? 'Salvando…' : 'Salvar'}
        </button>
      </form>
    </div>
  );
}

function TaskList({ noteId }: { noteId: string }) {
  const tasks = useGetTasks(noteId);
  const create = useCreateTask();
  const toggle = useToggleTask();
  const [title, setTitle] = useState('');
  const trimmedTitle = title.trim();

  function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!trimmedTitle) return;
    create.reset();
    create.mutate({ noteId, title: trimmedTitle }, { onSuccess: () => setTitle('') });
  }

  function onToggle(task: Task) {
    toggle.reset();
    toggle.mutate({ id: task.id, noteId, isDone: !task.isDone });
  }

  function renderTasks() {
    if (tasks.isPending) return <Spinner label="Carregando tarefas…" />;
    if (tasks.isError) {
      return <ErrorState message={tasks.error.message} onRetry={() => tasks.refetch()} />;
    }
    if (tasks.data.length === 0) {
      return (
        <EmptyState
          title="Nenhuma tarefa ainda"
          description="Crie a primeira tarefa desta nota no campo acima."
        />
      );
    }
    return (
      <ul className="space-y-2">
        {tasks.data.map((task) => {
          const isSaving = toggle.isPending && toggle.variables?.id === task.id;
          return (
            <li key={task.id}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={task.isDone}
                  onChange={() => onToggle(task)}
                  disabled={isSaving}
                />
                <span className={task.isDone ? 'text-stone-400 line-through' : undefined}>
                  {task.title}
                </span>
                {isSaving && <span className="text-stone-400">Salvando…</span>}
              </label>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">Tarefas</h2>
      <form className="mt-3 flex gap-2" onSubmit={onCreate}>
        <label className="sr-only" htmlFor="task-title">
          Título da tarefa
        </label>
        <input
          id="task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Nova tarefa"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={create.isPending || !trimmedTitle}
          className={primaryButtonClass}
        >
          {create.isPending ? 'Salvando…' : 'Adicionar'}
        </button>
      </form>
      {create.isError && <p className="mt-2 text-sm text-red-700">{create.error.message}</p>}
      {toggle.isError && <p className="mt-2 text-sm text-red-700">{toggle.error.message}</p>}
      <div className="mt-4">{renderTasks()}</div>
    </section>
  );
}

export function NotePage() {
  const { notebookId, noteId } = useParams();
  const note = useGetNote(notebookId, noteId);
  const backTo = notebookId ? routes.notebook(notebookId) : routes.home;

  if (note.isPending) return <Spinner label="Carregando nota…" />;
  if (note.isError) {
    return <ErrorState message={note.error.message} onRetry={() => note.refetch()} />;
  }
  if (!note.data) {
    return (
      <section>
        <h1 className="text-xl font-semibold">Nota não encontrada</h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          Esta nota não existe, não pertence à sua conta ou não está neste caderno.
        </p>
        <Link to={backTo} className={`mt-4 inline-block ${secondaryButtonClass}`}>
          Voltar para o caderno
        </Link>
      </section>
    );
  }

  return (
    <section>
      <Link to={backTo} className="text-sm text-stone-500 dark:text-stone-400">
        Voltar
      </Link>
      <h1 className="mt-3 text-xl font-semibold">{note.data.title}</h1>
      <div className="mt-6">
        <NoteEditor key={note.data.id} note={note.data} />
      </div>
      <TaskList noteId={note.data.id} />
    </section>
  );
}
