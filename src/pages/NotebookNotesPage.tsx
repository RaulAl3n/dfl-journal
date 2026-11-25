import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { pageSize } from '@/consts/pagination';
import { routes } from '@/consts/routes';
import {
  useCreateNote,
  useDeleteNote,
  useGetNotebooks,
  useGetNotes,
  useToggleNoteFavorite,
  useUpdateNote,
} from '@/hooks';
import type { Note } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Spinner } from '@/components/ui/Spinner';

const inputClass =
  'w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900';
const primaryButtonClass =
  'shrink-0 rounded-md bg-stone-900 px-3 py-2 text-sm text-white disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900';
const secondaryButtonClass =
  'shrink-0 rounded-md border border-stone-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-stone-700';

function parsePage(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return page >= 1 ? page : 1;
}

function SearchForm({ query, onSearch }: { query: string; onSearch: (query: string) => void }) {
  const [text, setText] = useState(query);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    onSearch(text.trim());
  }

  return (
    <form className="flex gap-2" onSubmit={onSubmit} role="search">
      <label className="sr-only" htmlFor="notes-search">
        Buscar por título
      </label>
      <input
        id="notes-search"
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Buscar por título"
        className={inputClass}
      />
      <button type="submit" className={secondaryButtonClass}>
        Buscar
      </button>
    </form>
  );
}

export function NotebookNotesPage() {
  const { notebookId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get('page'));
  const query = (searchParams.get('q') ?? '').trim();

  const notebooks = useGetNotebooks(false);
  const notes = useGetNotes(notebookId, page, query);
  const create = useCreateNote();
  const update = useUpdateNote();
  const remove = useDeleteNote();
  const toggleFavorite = useToggleNoteFavorite();

  const [title, setTitle] = useState('');
  const trimmedTitle = title.trim();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const trimmedEditTitle = editTitle.trim();

  const notebook = notebooks.data?.find((item) => item.id === notebookId);
  const total = notes.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function goToPage(nextPage: number, options?: { replace?: boolean }) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (nextPage <= 1) {
          next.delete('page');
        } else {
          next.set('page', String(nextPage));
        }
        return next;
      },
      { replace: options?.replace },
    );
  }

  // Página além do fim: mostra a última que ainda tem nota.
  useEffect(() => {
    if (notes.data && notes.data.notes.length === 0 && page > totalPages) {
      goToPage(totalPages, { replace: true });
    }
    // goToPage muda a cada render; o efeito depende só dos dados e da página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes.data, page, totalPages]);

  function onSearch(nextQuery: string) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('page');
      if (nextQuery) {
        next.set('q', nextQuery);
      } else {
        next.delete('q');
      }
      return next;
    });
  }

  function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!notebookId || !trimmedTitle) return;
    create.reset();
    create.mutate(
      { notebookId, title: trimmedTitle },
      {
        onSuccess: () => {
          setTitle('');
          goToPage(1);
        },
      },
    );
  }

  function onStartEdit(note: Note) {
    update.reset();
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditBody(note.body);
  }

  function onCancelEdit() {
    update.reset();
    setEditingId(null);
  }

  function onSaveEdit(event: FormEvent, note: Note) {
    event.preventDefault();
    if (!trimmedEditTitle) return;
    update.reset();
    update.mutate(
      { id: note.id, notebookId: note.notebookId, title: trimmedEditTitle, body: editBody },
      { onSuccess: () => setEditingId(null) },
    );
  }

  function onDelete(note: Note) {
    const confirmed = window.confirm(
      `Apagar a nota "${note.title}"? As tarefas dela também serão apagadas.`,
    );
    if (!confirmed) return;
    const isLastOnPage = notes.data?.notes.length === 1;
    remove.reset();
    remove.mutate(
      { id: note.id, notebookId: note.notebookId },
      {
        onSuccess: () => {
          if (isLastOnPage && page > 1) {
            goToPage(page - 1, { replace: true });
          }
        },
      },
    );
  }

  function onToggleFavorite(note: Note) {
    toggleFavorite.reset();
    toggleFavorite.mutate({
      id: note.id,
      notebookId: note.notebookId,
      isFavorite: !note.isFavorite,
    });
  }

  if (notebooks.isPending) return <Spinner label="Carregando caderno…" />;
  if (notebooks.isError) {
    return <ErrorState message={notebooks.error.message} onRetry={() => notebooks.refetch()} />;
  }
  if (!notebookId || !notebook) {
    return (
      <section>
        <h1 className="text-xl font-semibold">Caderno não encontrado</h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          Este caderno não existe ou não pertence à sua conta.
        </p>
        <Link to={routes.home} className="mt-4 inline-block text-sm underline">
          Voltar para os cadernos
        </Link>
      </section>
    );
  }

  function renderList() {
    if (notes.isPending) return <Spinner label="Carregando notas…" />;
    if (notes.isError) {
      return <ErrorState message={notes.error.message} onRetry={() => notes.refetch()} />;
    }
    if (notes.data.notes.length === 0) {
      if (page > totalPages) return <Spinner label="Carregando notas…" />;
      return query ? (
        <EmptyState
          title="Nenhuma nota encontrada"
          description={`Nenhuma nota deste caderno tem "${query}" no título.`}
        />
      ) : (
        <EmptyState
          title="Nenhuma nota neste caderno"
          description="Crie a primeira nota no campo acima."
        />
      );
    }

    return (
      <>
        <ul className="space-y-3">
          {notes.data.notes.map((note) => {
            const isSavingFavorite =
              toggleFavorite.isPending && toggleFavorite.variables?.id === note.id;
            const isDeleting = remove.isPending && remove.variables?.id === note.id;

            if (editingId === note.id) {
              return (
                <li key={note.id} className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
                  <form className="space-y-2" onSubmit={(event) => onSaveEdit(event, note)}>
                    <label className="block text-sm">
                      Título
                      <input
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        autoFocus
                        className={`mt-1 ${inputClass}`}
                      />
                    </label>
                    {!trimmedEditTitle && (
                      <p className="text-sm text-red-700">Informe o título da nota.</p>
                    )}
                    <label className="block text-sm">
                      Texto
                      <textarea
                        value={editBody}
                        onChange={(event) => setEditBody(event.target.value)}
                        rows={4}
                        className={`mt-1 ${inputClass}`}
                      />
                    </label>
                    {update.isError && <p className="text-sm text-red-700">{update.error.message}</p>}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={update.isPending || !trimmedEditTitle}
                        className={primaryButtonClass}
                      >
                        {update.isPending ? 'Salvando…' : 'Salvar'}
                      </button>
                      <button
                        type="button"
                        onClick={onCancelEdit}
                        disabled={update.isPending}
                        className={secondaryButtonClass}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </li>
              );
            }

            return (
              <li
                key={note.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-stone-200 p-4 dark:border-stone-800"
              >
                <Link to={routes.note(note.notebookId, note.id)} className="min-w-0 flex-1">
                  <h2 className="truncate font-medium">{note.title}</h2>
                  {note.body && (
                    <p className="mt-1 line-clamp-2 text-sm text-stone-500 dark:text-stone-400">
                      {note.body}
                    </p>
                  )}
                </Link>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(note)}
                    disabled={toggleFavorite.isPending}
                    aria-pressed={note.isFavorite}
                    className="rounded-md border border-stone-300 px-2 py-1 text-sm disabled:opacity-60 dark:border-stone-700"
                  >
                    {isSavingFavorite ? 'Salvando…' : note.isFavorite ? '★ Favorita' : '☆ Favoritar'}
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onStartEdit(note)}
                      disabled={isDeleting}
                      className="text-sm text-stone-600 underline disabled:opacity-60 dark:text-stone-300"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(note)}
                      disabled={remove.isPending}
                      className="text-sm text-red-700 underline disabled:opacity-60"
                    >
                      {isDeleting ? 'Apagando…' : 'Apagar'}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <nav className="mt-6 flex items-center justify-between gap-3" aria-label="Paginação">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className={secondaryButtonClass}
          >
            Anterior
          </button>
          <span className="text-sm text-stone-500 dark:text-stone-400">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className={secondaryButtonClass}
          >
            Próxima
          </button>
        </nav>
      </>
    );
  }

  return (
    <section>
      <Link to={routes.home} className="text-sm text-stone-500 dark:text-stone-400">
        Voltar
      </Link>
      <h1 className="mt-3 text-xl font-semibold">{notebook.title}</h1>

      <form className="mt-6 flex gap-2" onSubmit={onCreate}>
        <label className="sr-only" htmlFor="note-title">
          Título da nota
        </label>
        <input
          id="note-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Nova nota"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={create.isPending || !trimmedTitle}
          className={primaryButtonClass}
        >
          {create.isPending ? 'Salvando…' : 'Criar'}
        </button>
      </form>
      {create.isError && <p className="mt-2 text-sm text-red-700">{create.error.message}</p>}

      <div className="mt-4">
        <SearchForm key={query} query={query} onSearch={onSearch} />
      </div>

      {toggleFavorite.isError && (
        <p className="mt-2 text-sm text-red-700">{toggleFavorite.error.message}</p>
      )}
      {remove.isError && <p className="mt-2 text-sm text-red-700">{remove.error.message}</p>}

      <div className="mt-6">{renderList()}</div>
    </section>
  );
}
