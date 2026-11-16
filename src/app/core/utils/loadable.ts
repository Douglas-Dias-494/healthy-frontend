import { Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, Observable } from 'rxjs';

/** Resultado de uma leitura: os dados (undefined enquanto carrega) e a mensagem de erro, se falhar. */
export interface Loadable<T> {
  readonly data: Signal<T | undefined>;
  readonly error: Signal<string | null>;
}

/**
 * Transforma uma leitura da API em dois signals para o template.
 * Sem isto, um erro HTTP dentro de toSignal() quebraria a tela; assim a tela pode mostrar a mensagem.
 *
 * Precisa ser chamada onde existe contexto de injeção (campo da classe ou constructor).
 */
export function loadable<T>(source: Observable<T>): Loadable<T> {
  const error = signal<string | null>(null);

  const data = toSignal(
    source.pipe(
      catchError((e: Error) => {
        error.set(e.message);
        return EMPTY; // encerra sem valor: data continua undefined e error explica o motivo
      }),
    ),
  );

  return { data, error: error.asReadonly() };
}
