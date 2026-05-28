import { Routes } from '@angular/router';

export const documentRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-document/list-document.component').then((m) => m.ListDocumentComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-document/create-document.component').then((m) => m.CreateDocumentComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-document/view-document.component').then((m) => m.ViewDocumentComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-document/create-document.component').then((m) => m.CreateDocumentComponent),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-document/delete-document.component').then((m) => m.DeleteDocumentComponent),
  },
];
