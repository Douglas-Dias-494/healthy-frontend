import { Routes } from '@angular/router';
import { profileGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  {
    path: 'login',
    title: 'Entrar · Healthy',
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
  },
  {
    path: 'cadastro',
    title: 'Criar conta · Healthy',
    loadComponent: () => import('./features/auth/pages/cadastro/cadastro').then((m) => m.Cadastro),
  },
  {
    path: 'esqueci-senha',
    title: 'Esqueci minha senha · Healthy',
    loadComponent: () =>
      import('./features/auth/pages/esqueci-senha/esqueci-senha').then((m) => m.EsqueciSenha),
  },
  {
    path: 'redefinir-senha',
    title: 'Redefinir senha · Healthy',
    loadComponent: () =>
      import('./features/auth/pages/redefinir-senha/redefinir-senha').then((m) => m.RedefinirSenha),
  },

  {
    path: 'paciente',
    canActivate: [profileGuard('PACIENTE')],
    loadComponent: () => import('./shared/layout/shell/shell').then((m) => m.Shell),
    loadChildren: () =>
      import('./features/paciente/paciente.routes').then((m) => m.PACIENTE_ROUTES),
  },
  {
    path: 'medico',
    canActivate: [profileGuard('MEDICO')],
    loadComponent: () => import('./shared/layout/shell/shell').then((m) => m.Shell),
    loadChildren: () => import('./features/medico/medico.routes').then((m) => m.MEDICO_ROUTES),
  },

  { path: '**', redirectTo: 'login' },
];
