import { Routes } from '@angular/router';
import { profileGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // ---- Telas públicas ----
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

  // ---- Áreas logadas ----
  // A rota pai desenha o Shell (menu) e aplica o guard; as filhas aparecem dentro do <router-outlet> dele.
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

  // Qualquer endereço desconhecido volta para o login
  { path: '**', redirectTo: 'login' },
];
