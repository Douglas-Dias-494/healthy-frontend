import { HttpErrorResponse } from '@angular/common/http';
import { translateError } from './translate-error';

describe('translateError', () => {
  const http = (status: number, body: unknown) => new HttpErrorResponse({ status, error: body });

  it('should explain that the server is unreachable (status 0)', () => {
    expect(translateError(http(0, null)).message).toContain('conectar ao servidor');
  });

  it('should use the backend "detail"', () => {
    expect(
      translateError(http(409, { detail: 'Já existe uma conta com este e-mail.' })).message,
    ).toBe('Já existe uma conta com este e-mail.');
  });

  it('should prefer the first field message over the generic "Dados inválidos."', () => {
    const error = http(400, {
      detail: 'Dados inválidos.',
      erros: { senha: 'A senha deve ter de 8 a 72 caracteres.', nome: 'Obrigatório' },
    });
    expect(translateError(error).message).toBe('A senha deve ter de 8 a 72 caracteres.');
  });

  it('should fall back to the detail when "erros" is empty', () => {
    expect(translateError(http(400, { detail: 'Dados inválidos.', erros: {} })).message).toBe(
      'Dados inválidos.',
    );
  });

  it('should fall back to a generic message when the body has nothing useful', () => {
    expect(translateError(http(500, null)).message).toContain('erro inesperado');
    expect(translateError(http(500, '<html>erro</html>')).message).toContain('erro inesperado');
  });
});
