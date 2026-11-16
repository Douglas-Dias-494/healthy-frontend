import { Pipe, PipeTransform } from '@angular/core';

/**
 * Transforma um nome em iniciais para o avatar.
 * "Dra. Ana Souza" -> "AS" | "Dr. João" -> "J" (ignora títulos que terminam com ponto).
 *
 * Pipes são "puros": o Angular só recalcula quando o valor de entrada muda.
 * Uso: {{ nome | iniciais }}
 */
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
