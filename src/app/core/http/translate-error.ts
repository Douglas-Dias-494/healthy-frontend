import { HttpErrorResponse } from '@angular/common/http';
import { catchError, OperatorFunction, throwError } from 'rxjs';

/**
 * Converte o erro técnico do HttpClient numa mensagem para o usuário.
 * O backend responde erros no formato ProblemDetail: { status, detail, ... }.
 * O texto pronto vem em "detail" (ex.: "Já existe uma conta com este e-mail.").
 */
export function translateError(error: HttpErrorResponse): Error {
  // status 0 = a requisição nem chegou ao servidor (API desligada, sem internet, CORS bloqueado)
  if (error.status === 0) {
    return new Error('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
  }

  // 400 de validação: o servidor manda "erros" com a mensagem de cada campo. A primeira é a mais útil
  // ("A senha deve ter de 8 a 72 caracteres...") e é melhor que o genérico "Dados inválidos."
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

/**
 * Operador RxJS: troca o HttpErrorResponse por um Error com mensagem amigável.
 * Uso: this.http.get(...).pipe(mapApiError())
 */
export function mapApiError<T>(): OperatorFunction<T, T> {
  return catchError((error: HttpErrorResponse) => throwError(() => translateError(error)));
}
