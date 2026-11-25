export type Note = {
  id: string;
  notebookId: string;
  title: string;
  body: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotesPage = {
  notes: Note[];
  total: number;
};
