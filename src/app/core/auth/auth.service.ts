import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { defer, delay, Observable, of, throwError } from 'rxjs';
import { CadastroRequest, LoginRequest, LoginResponse } from '../models/auth.model';

type UsuarioTeste = LoginRequest & { id: number; nome: string };

/** Nome sob o qual a sessão fica guardada no navegador. */
const CHAVE_SESSAO = 'healthy.sessao';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly router = inject(Router);

  // "Tabela de usuários" de mentira. Será substituída pelo backend.
  private readonly usuariosTeste: UsuarioTeste[] = [
    { id: 1, perfil: 'PACIENTE', email: 'paciente@healthy.com', senha: '123456', nome: 'Maria' },
    { id: 2, perfil: 'MEDICO', email: 'medico@healthy.com', senha: '123456', nome: 'Dr. João' },
  ];
  private proximoIdUsuario = 100;

  // ---------- Estado da sessão ----------
  // Privado e gravável aqui dentro; o resto do app só recebe a versão somente-leitura.
  private readonly sessao = signal<LoginResponse | null>(this.lerSessaoSalva());

  /** Usuário logado (ou null). Leia com usuario(). */
  readonly usuario = this.sessao.asReadonly();
  readonly estaLogado = computed(() => this.sessao() !== null);

  // ---------- Chamadas que dependem do backend ----------

  // API: POST /api/auth/login   body: LoginRequest   -> 200 LoginResponse | 401
  login(dados: LoginRequest): Observable<LoginResponse> {
    const email = dados.email.trim().toLowerCase();
    const usuario = this.usuariosTeste.find(
      (u) =>
        u.perfil === dados.perfil && u.email.toLowerCase() === email && u.senha === dados.senha,
    );

    if (!usuario) {
      return throwError(() => new Error('Credenciais inválidas'));
    }

    return of({
      token: 'token-falso',
      id: usuario.id,
      nome: usuario.nome,
      perfil: usuario.perfil,
    }).pipe(delay(800));
  }

  // API: POST /api/auth/cadastro   body: CadastroRequest   -> 201 | 409 (e-mail já existe)
  cadastrar(dados: CadastroRequest): Observable<void> {
    // defer: o código só roda quando alguém faz subscribe, igual a uma chamada HTTP de verdade.
    return defer(() => {
      const email = dados.email.trim().toLowerCase();
      if (this.usuariosTeste.some((u) => u.email.toLowerCase() === email)) {
        return throwError(() => new Error('Já existe uma conta com este e-mail.'));
      }

      this.usuariosTeste.push({
        id: this.proximoIdUsuario++,
        perfil: dados.perfil,
        email,
        senha: dados.senha,
        nome: dados.nome.trim(),
      });
      return of(undefined).pipe(delay(800));
    });
  }

  // ---------- Sessão no navegador ----------

  /** Guarda a sessão. "Lembrar de mim" = localStorage (sobrevive ao fechar o navegador). */
  iniciarSessao(resposta: LoginResponse, lembrar: boolean): void {
    this.limparArmazenamento();
    try {
      const storage = lembrar ? localStorage : sessionStorage;
      storage.setItem(CHAVE_SESSAO, JSON.stringify(resposta));
    } catch {
      // Armazenamento bloqueado (modo privado, por exemplo): a sessão vale só até recarregar.
    }
    this.sessao.set(resposta);
  }

  encerrarSessao(): void {
    this.limparArmazenamento();
    this.sessao.set(null);
    void this.router.navigate(['/login']);
  }

  private lerSessaoSalva(): LoginResponse | null {
    try {
      const texto = localStorage.getItem(CHAVE_SESSAO) ?? sessionStorage.getItem(CHAVE_SESSAO);
      return texto ? (JSON.parse(texto) as LoginResponse) : null;
    } catch {
      return null;
    }
  }

  private limparArmazenamento(): void {
    try {
      localStorage.removeItem(CHAVE_SESSAO);
      sessionStorage.removeItem(CHAVE_SESSAO);
    } catch {
      // ignora
    }
  }
}
