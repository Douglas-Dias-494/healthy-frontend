import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Perfil } from '../models/auth.model';
import { AuthService } from './auth.service';

/** UI convenience only: the backend enforces permissions on every endpoint. */
export const profileGuard =
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
