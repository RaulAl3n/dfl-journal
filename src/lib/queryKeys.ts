export const queryKeys = {
  profile: {
    current: ['profile', 'current'] as const,
  },
  notebooks: {
    all: ['notebooks'] as const,
    list: (favoritesOnly: boolean) => ['notebooks', { favoritesOnly }] as const,
  },
  notes: {
    // Prefixo que cobre todas as páginas e buscas de um caderno.
    inNotebook: (notebookId: string) => ['notes', { notebookId }] as const,
    byNotebook: (notebookId: string, page: number, query: string) =>
      ['notes', { notebookId, page, query }] as const,
    byId: (id: string) => ['notes', id] as const,
  },
} as const;
