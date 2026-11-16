import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../api.config';
import { AuthService } from './auth.service';

describe('AuthService (password flows)', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const session = { token: 'token-antigo', id: 1, nome: 'Maria', perfil: 'PACIENTE' } as const;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'login', children: [] }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should POST only the e-mail to request a reset link', () => {
    service.forgotPassword('maria@exemplo.com').subscribe();

    const request = http.expectOne(`${API_URL}/auth/esqueci-senha`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'maria@exemplo.com' });
    request.flush(null, { status: 202, statusText: 'Accepted' });
  });

  it('should POST the token and the new password to reset it', () => {
    service.resetPassword('abc123', 'NovaSenha2026').subscribe();

    const request = http.expectOne(`${API_URL}/auth/redefinir-senha`);
    expect(request.request.body).toEqual({ token: 'abc123', novaSenha: 'NovaSenha2026' });
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should show the backend message for an invalid or expired link', async () => {
    const result = firstValueFrom(service.resetPassword('velho', 'NovaSenha2026'));

    http
      .expectOne(`${API_URL}/auth/redefinir-senha`)
      .flush(
        { status: 400, detail: 'Link inválido ou expirado. Solicite um novo.' },
        { status: 400, statusText: 'Bad Request' },
      );

    await expect(result).rejects.toThrow('Link inválido ou expirado. Solicite um novo.');
  });

  it('should show the rate limit message (429)', async () => {
    const result = firstValueFrom(service.forgotPassword('maria@exemplo.com'));

    http
      .expectOne(`${API_URL}/auth/esqueci-senha`)
      .flush(
        { status: 429, detail: 'Muitas tentativas. Tente novamente em 15 minutos.' },
        { status: 429, statusText: 'Too Many Requests' },
      );

    await expect(result).rejects.toThrow('Muitas tentativas');
  });

  it('should send current and new password and swap the session token', async () => {
    service.startSession(session, false);
    const result = firstValueFrom(service.changePassword('SenhaAtual1', 'NovaSenha2026'), {
      defaultValue: undefined,
    });

    const request = http.expectOne(`${API_URL}/auth/alterar-senha`);
    expect(request.request.body).toEqual({ senhaAtual: 'SenhaAtual1', novaSenha: 'NovaSenha2026' });
    request.flush({ ...session, token: 'token-novo' });
    await result;

    expect(service.usuario()?.token).toBe('token-novo');
    // continua no mesmo lugar em que estava (sessionStorage, pois "lembrar" estava desligado)
    expect(sessionStorage.getItem('healthy.sessao')).toContain('token-novo');
    expect(localStorage.getItem('healthy.sessao')).toBeNull();
  });

  it('should keep a "remembered" session in localStorage after changing the password', async () => {
    service.startSession(session, true);
    const result = firstValueFrom(service.changePassword('SenhaAtual1', 'NovaSenha2026'), {
      defaultValue: undefined,
    });

    http.expectOne(`${API_URL}/auth/alterar-senha`).flush({ ...session, token: 'token-novo' });
    await result;

    expect(localStorage.getItem('healthy.sessao')).toContain('token-novo');
    expect(sessionStorage.getItem('healthy.sessao')).toBeNull();
  });

  it('should keep the old token when the change is refused', async () => {
    service.startSession(session, false);
    const result = firstValueFrom(service.changePassword('errada', 'NovaSenha2026'));

    http
      .expectOne(`${API_URL}/auth/alterar-senha`)
      .flush(
        { status: 400, detail: 'A senha atual está incorreta.' },
        { status: 400, statusText: 'Bad Request' },
      );

    await expect(result).rejects.toThrow('A senha atual está incorreta.');
    expect(service.usuario()?.token).toBe('token-antigo');
  });
});
