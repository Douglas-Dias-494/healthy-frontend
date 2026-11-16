import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'login', children: [] }])],
    });
    service = TestBed.inject(AuthService);
  });

  it('should log in with valid credentials', async () => {
    const resposta = await firstValueFrom(
      service.login({ perfil: 'PACIENTE', email: 'Paciente@Healthy.com ', senha: '123456' }),
    );
    expect(resposta.id).toBe(1);
    expect(resposta.perfil).toBe('PACIENTE');
  });

  it('should reject a wrong password', async () => {
    await expect(
      firstValueFrom(
        service.login({ perfil: 'PACIENTE', email: 'paciente@healthy.com', senha: 'x' }),
      ),
    ).rejects.toThrow('Credenciais inválidas');
  });

  it('should not log a doctor in as a patient', async () => {
    await expect(
      firstValueFrom(
        service.login({ perfil: 'PACIENTE', email: 'medico@healthy.com', senha: '123456' }),
      ),
    ).rejects.toThrow();
  });

  it('should refuse to register an e-mail that already exists', async () => {
    await expect(
      firstValueFrom(
        service.cadastrar({
          perfil: 'PACIENTE',
          nome: 'Outra Maria',
          email: 'paciente@healthy.com',
          senha: '123456',
        }),
      ),
    ).rejects.toThrow('Já existe uma conta com este e-mail.');
  });

  it('should keep the session until logout', () => {
    service.iniciarSessao({ token: 't', id: 1, nome: 'Maria', perfil: 'PACIENTE' }, false);
    expect(service.estaLogado()).toBe(true);
    expect(sessionStorage.getItem('healthy.sessao')).not.toBeNull();

    service.encerrarSessao();
    expect(service.estaLogado()).toBe(false);
    expect(sessionStorage.getItem('healthy.sessao')).toBeNull();
  });

  it('should store the session in localStorage when "remember me" is on', () => {
    service.iniciarSessao({ token: 't', id: 1, nome: 'Maria', perfil: 'PACIENTE' }, true);
    expect(localStorage.getItem('healthy.sessao')).not.toBeNull();
    expect(sessionStorage.getItem('healthy.sessao')).toBeNull();
  });
});
