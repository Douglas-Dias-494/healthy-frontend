import { Routes } from '@angular/router';

/** Rotas filhas de /medico (o Shell e o perfilGuard ficam na rota pai, em app.routes.ts). */
export const MEDICO_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pacientes' },
  {
    path: 'pacientes',
    title: 'Meus pacientes · Healthy',
    loadComponent: () =>
      import('./pages/meus-pacientes/meus-pacientes').then((m) => m.MeusPacientes),
  },
  {
    path: 'nova-receita',
    title: 'Nova receita · Healthy',
    loadComponent: () => import('./pages/nova-receita/nova-receita').then((m) => m.NovaReceita),
  },
];
