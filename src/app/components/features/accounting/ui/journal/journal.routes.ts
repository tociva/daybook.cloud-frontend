import { Routes } from '@angular/router';

export const journalRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-journal/list-journal.component').then((m) => m.ListJournalComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-journal/create-journal.component').then((m) => m.CreateJournalComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-journal/view-journal.component').then((m) => m.ViewJournalComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-journal/create-journal.component').then((m) => m.CreateJournalComponent),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-journal/delete-journal.component').then((m) => m.DeleteJournalComponent),
  },
];
