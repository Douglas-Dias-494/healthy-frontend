import { Routes } from '@angular/router';

/**
 * Rotas filhas de /paciente. O Shell (menu) e o profileGuard ficam na rota pai, em app.routes.ts.
 * As páginas são carregadas sob demanda (lazy loading).
 */
export const PACIENTE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'medicos' },
  {
    path: 'medicos',
    title: 'Meus médicos · Healthy',
    loadComponent: () => import('./pages/meus-medicos/meus-medicos').then((m) => m.MeusMedicos),
  },
  {
    path: 'receitas',
    title: 'Receitas · Healthy',
    loadComponent: () =>
      import('./pages/minhas-receitas/minhas-receitas').then((m) => m.MinhasReceitas),
  },
  {
    path: 'remedios',
    title: 'Meus remédios · Healthy',
    loadComponent: () => import('./pages/meus-remedios/meus-remedios').then((m) => m.MeusRemedios),
  },
  {
    path: 'perfil',
    title: 'Meu perfil · Healthy',
    loadComponent: () => import('./pages/meu-perfil/meu-perfil').then((m) => m.MeuPerfil),
  },
];
