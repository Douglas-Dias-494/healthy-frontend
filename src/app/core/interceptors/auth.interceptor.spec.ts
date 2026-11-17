import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../api.config';
import { AuthService } from '../auth/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'login', children: [] }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthService).startSession(
      { token: 'abc123', id: 1, nome: 'Maria', perfil: 'PACIENTE' },
      false,
    );
  });

  afterEach(() => controller.verify());

  it('should send the token to protected API routes', () => {
    http.get(`${API_URL}/auth/me`).subscribe();
    const requisicao = controller.expectOne(`${API_URL}/auth/me`);
    expect(requisicao.request.headers.get('Authorization')).toBe('Bearer abc123');
    requisicao.flush({});
  });

  it('should NOT send the token to login (an expired token would block signing in again)', () => {
    http.post(`${API_URL}/auth/login`, {}).subscribe();
    const requisicao = controller.expectOne(`${API_URL}/auth/login`);
    expect(requisicao.request.headers.has('Authorization')).toBe(false);
    requisicao.flush({});
  });

  it('should NOT send the token to sign-up', () => {
    http.post(`${API_URL}/auth/cadastro`, {}).subscribe();
    const requisicao = controller.expectOne(`${API_URL}/auth/cadastro`);
    expect(requisicao.request.headers.has('Authorization')).toBe(false);
    requisicao.flush({});
  });

  it('should end the session when a protected call answers 401 (expired token)', () => {
    const auth = TestBed.inject(AuthService);
    expect(auth.estaLogado()).toBe(true);

    http.get(`${API_URL}/pacientes/me/receitas`).subscribe({ error: () => undefined });
    controller
      .expectOne(`${API_URL}/pacientes/me/receitas`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.estaLogado()).toBe(false);
  });

  it('should keep the session on other errors (e.g. 404)', () => {
    const auth = TestBed.inject(AuthService);

    http.get(`${API_URL}/pacientes/me/receitas`).subscribe({ error: () => undefined });
    controller
      .expectOne(`${API_URL}/pacientes/me/receitas`)
      .flush(null, { status: 404, statusText: 'Not Found' });

    expect(auth.estaLogado()).toBe(true);
  });

  it('should NOT leak the token to other sites', () => {
    http.get('https://outro-site.com/dados').subscribe();
    const requisicao = controller.expectOne('https://outro-site.com/dados');
    expect(requisicao.request.headers.has('Authorization')).toBe(false);
    requisicao.flush({});
  });
});
