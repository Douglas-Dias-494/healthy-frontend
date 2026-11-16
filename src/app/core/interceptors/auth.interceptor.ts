import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_URL } from '../api.config';
import { AuthService } from '../auth/auth.service';

/**
 * Interceptor: passa por TODA requisição do HttpClient antes de ela sair.
 * Aqui anexa o token JWT no cabeçalho "Authorization".
 *
 * Só anexa para a nossa API: nunca envie o token para sites de terceiros.
 *
 * (Ainda não é usado de fato: os serviços estão com dados de mentira.
 *  Passa a valer quando eles trocarem of(...) por http.get/post(...).)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).usuario()?.token;

  if (!token || !req.url.startsWith(API_URL)) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
