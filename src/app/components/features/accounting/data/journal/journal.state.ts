import type { Journal } from './journal.model';

export type JournalState = Readonly<{
  journal: Readonly<{
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly Journal[];
    selectedItem: Journal | null;
  }>;
}>;

export const initialJournalState: JournalState = {
  journal: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
