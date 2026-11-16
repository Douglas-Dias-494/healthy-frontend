import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '../api.config';
import { AuthService } from '../auth/auth.service';

/** Rotas públicas: nunca levam token (o login é justamente como se obtém um). */
const PUBLIC_ROUTES = [`${API_URL}/auth/login`, `${API_URL}/auth/cadastro`];

/**
 * Interceptor: passa por TODA requisição do HttpClient antes de ela sair (e por toda resposta).
 *
 * - Anexa o token JWT no cabeçalho "Authorization".
 * - Só anexa para a nossa API: nunca envie o token para sites de terceiros.
 * - Não anexa em login/cadastro: se o token guardado já venceu, enviá-lo faria o servidor recusar
 *   até o pedido de um novo login.
 * - Se o servidor responder 401 a uma chamada que levava token, a sessão venceu: encerra e volta ao login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.usuario()?.token;

  if (!token || !req.url.startsWith(API_URL) || PUBLIC_ROUTES.includes(req.url)) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.endSession();
      }
      return throwError(() => error);
    }),
  );
};
