import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Perfil } from '../models/auth.model';
import { AuthService } from './auth.service';

/**
 * Protege uma área do app para um perfil específico.
 * - Sem login: manda para /login.
 * - Perfil errado (médico tentando abrir /paciente): manda para a área dele.
 *
 * Uso na rota: canActivate: [perfilGuard('PACIENTE')]
 *
 * IMPORTANTE: isto é só conforto de navegação. Quem protege os dados de verdade
 * é o backend, que precisa validar o token e o perfil em CADA endpoint.
 */
export const perfilGuard =
  (perfilPermitido: Perfil): CanActivateFn =>
  () => {
    const usuario = inject(AuthService).usuario();
    const router = inject(Router);

    if (!usuario) {
      return router.createUrlTree(['/login']);
    }

    if (usuario.perfil === perfilPermitido) {
      return true;
    }

    return router.createUrlTree([usuario.perfil === 'MEDICO' ? '/medico' : '/paciente']);
  };
