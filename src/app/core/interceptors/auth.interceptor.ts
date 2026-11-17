import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '../api.config';
import { AuthService } from '../auth/auth.service';

const PUBLIC_ROUTES = [`${API_URL}/auth/login`, `${API_URL}/auth/cadastro`];

/**
 * Attaches the JWT to calls to our API only: never to other hosts, and never to login/sign-up (a stale
 * token there would make the server reject the request). Ends the session if the API answers 401.
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
