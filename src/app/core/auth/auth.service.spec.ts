import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../api.config';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'login', children: [] }]),
        provideHttpClient(),
        provideHttpClientTesting(), // troca o HTTP real por um "falso" controlado pelo teste
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify()); // falha se sobrou alguma requisição sem resposta

  const credenciais = {
    perfil: 'PACIENTE',
    email: 'paciente@healthy.com',
    senha: '123456',
  } as const;

  it('should POST the credentials to /auth/login and return the response', async () => {
    const resultado = firstValueFrom(service.login(credenciais));

    const requisicao = http.expectOne(`${API_URL}/auth/login`);
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual(credenciais);
    requisicao.flush({ token: 't', id: 1, nome: 'Maria', perfil: 'PACIENTE' });

    expect((await resultado).id).toBe(1);
  });

  it('should show the backend message when the login is refused (401)', async () => {
    const resultado = firstValueFrom(service.login(credenciais));

    http
      .expectOne(`${API_URL}/auth/login`)
      .flush(
        { status: 401, detail: 'E-mail ou senha incorretos.' },
        { status: 401, statusText: 'Unauthorized' },
      );

    await expect(resultado).rejects.toThrow('E-mail ou senha incorretos.');
  });

  it('should tell the user when the server is unreachable', async () => {
    const resultado = firstValueFrom(service.login(credenciais));

    http.expectOne(`${API_URL}/auth/login`).error(new ProgressEvent('error'));

    await expect(resultado).rejects.toThrow('Não foi possível conectar ao servidor');
  });

  it('should POST the sign-up data to /auth/cadastro', async () => {
    const dados = {
      perfil: 'PACIENTE',
      nome: 'Ana',
      email: 'ana@teste.com',
      senha: 'abc123',
    } as const;
    const resultado = firstValueFrom(service.signUp(dados), { defaultValue: undefined });

    const requisicao = http.expectOne(`${API_URL}/auth/cadastro`);
    expect(requisicao.request.body).toEqual(dados);
    requisicao.flush(null, { status: 201, statusText: 'Created' });

    await expect(resultado).resolves.toBeNull();
  });

  it('should show the backend message when the e-mail already exists (409)', async () => {
    const resultado = firstValueFrom(
      service.signUp({
        perfil: 'PACIENTE',
        nome: 'Ana',
        email: 'ana@teste.com',
        senha: 'abc123',
      }),
    );

    http
      .expectOne(`${API_URL}/auth/cadastro`)
      .flush(
        { status: 409, detail: 'Já existe uma conta com este e-mail.' },
        { status: 409, statusText: 'Conflict' },
      );

    await expect(resultado).rejects.toThrow('Já existe uma conta com este e-mail.');
  });

  it('should keep the session until logout', () => {
    service.startSession({ token: 't', id: 1, nome: 'Maria', perfil: 'PACIENTE' }, false);
    expect(service.estaLogado()).toBe(true);
    expect(sessionStorage.getItem('healthy.sessao')).not.toBeNull();

    service.endSession();
    expect(service.estaLogado()).toBe(false);
    expect(sessionStorage.getItem('healthy.sessao')).toBeNull();
  });

  it('should store the session in localStorage when "remember me" is on', () => {
    service.startSession({ token: 't', id: 1, nome: 'Maria', perfil: 'PACIENTE' }, true);
    expect(localStorage.getItem('healthy.sessao')).not.toBeNull();
    expect(sessionStorage.getItem('healthy.sessao')).toBeNull();
  });
});
