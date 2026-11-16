import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { loadable } from './loadable';

describe('loadable', () => {
  const create = <T>(source: Subject<T>) =>
    runInInjectionContext(TestBed.inject(Injector), () => loadable(source));

  it('should be undefined while loading, then expose the data', () => {
    const source = new Subject<string[]>();
    const result = create(source);

    expect(result.data()).toBeUndefined();
    expect(result.error()).toBeNull();

    source.next(['a']);
    expect(result.data()).toEqual(['a']);
  });

  it('should expose the error message instead of throwing', () => {
    const source = new Subject<string[]>();
    const result = create(source);

    source.error(new Error('Servidor fora do ar'));

    expect(result.data()).toBeUndefined();
    expect(result.error()).toBe('Servidor fora do ar');
  });
});
