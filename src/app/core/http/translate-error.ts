import { HttpErrorResponse } from '@angular/common/http';
import { catchError, OperatorFunction, throwError } from 'rxjs';

export function translateError(error: HttpErrorResponse): Error {
  // status 0: the request never reached the server (API down, no network, CORS).
  if (error.status === 0) {
    return new Error('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
  }

  // Validation errors carry one message per field; the first is more useful than the generic detail.
  const fieldErrors: unknown = error.error?.erros;
  if (fieldErrors && typeof fieldErrors === 'object') {
    const first = Object.values(fieldErrors as Record<string, unknown>).find(
      (message): message is string => typeof message === 'string' && message.length > 0,
    );
    if (first) {
      return new Error(first);
    }
  }

  const detail: unknown = error.error?.detail;
  if (typeof detail === 'string' && detail.length > 0) {
    return new Error(detail);
  }

  return new Error('Ocorreu um erro inesperado. Tente novamente.');
}

export function mapApiError<T>(): OperatorFunction<T, T> {
  return catchError((error: HttpErrorResponse) => throwError(() => translateError(error)));
}
