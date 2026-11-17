import { Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, Observable } from 'rxjs';

export interface Loadable<T> {
  readonly data: Signal<T | undefined>;
  readonly error: Signal<string | null>;
}

/**
 * Turns an API read into data/error signals, so a failed request shows a message instead of breaking
 * the template. Must run in an injection context (class field or constructor).
 */
export function loadable<T>(source: Observable<T>): Loadable<T> {
  const error = signal<string | null>(null);

  const data = toSignal(
    source.pipe(
      catchError((e: Error) => {
        error.set(e.message);
        return EMPTY;
      }),
    ),
  );

  return { data, error: error.asReadonly() };
}
