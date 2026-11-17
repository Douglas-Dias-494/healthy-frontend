import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'iniciais' })
export class IniciaisPipe implements PipeTransform {
  transform(nome: string | null | undefined): string {
    const palavras = (nome ?? '')
      .split(/\s+/)
      .filter((palavra) => palavra && !palavra.endsWith('.'));

    if (palavras.length === 0) {
      return '?';
    }

    const primeira = palavras[0][0];
    const ultima = palavras.length > 1 ? palavras[palavras.length - 1][0] : '';
    return (primeira + ultima).toUpperCase();
  }
}
