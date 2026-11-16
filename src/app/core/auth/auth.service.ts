import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { API_URL } from '../api.config';
import { mapApiError } from '../http/translate-error';
import { CadastroRequest, LoginRequest, LoginResponse } from '../models/auth.model';

/** Nome sob o qual a sessão fica guardada no navegador. */
const CHAVE_SESSAO = 'healthy.sessao';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // ---------- Estado da sessão ----------
  // Privado e gravável aqui dentro; o resto do app só recebe a versão somente-leitura.
  private readonly sessao = signal<LoginResponse | null>(this.readStoredSession());

  /** Usuário logado (ou null). Leia com usuario(). */
  readonly usuario = this.sessao.asReadonly();
  readonly estaLogado = computed(() => this.sessao() !== null);

  // ---------- Chamadas ao backend ----------

  /** POST /api/auth/login  ->  200 LoginResponse | 400 | 401 */
  login(dados: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, dados).pipe(mapApiError());
  }

  /** POST /api/auth/cadastro  ->  201 | 400 | 409 (e-mail já existe) */
  signUp(dados: CadastroRequest): Observable<void> {
    return this.http.post<void>(`${API_URL}/auth/cadastro`, dados).pipe(mapApiError());
  }

  /**
   * POST /api/auth/esqueci-senha  ->  202 SEMPRE (exista a conta ou não: a API não revela quem tem cadastro)
   *                                   | 429 tentativas demais
   */
  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/auth/esqueci-senha`, { email }).pipe(mapApiError());
  }

  /** POST /api/auth/redefinir-senha  ->  204 | 400 link inválido/expirado ou senha fraca | 429 */
  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${API_URL}/auth/redefinir-senha`, { token, novaSenha: newPassword })
      .pipe(mapApiError());
  }

  /**
   * POST /api/auth/alterar-senha (usuário logado)  ->  200 com um token NOVO | 400 | 429
   * Trocar a senha encerra as outras sessões, então o token antigo deixa de valer: guardamos o novo
   * (no mesmo lugar do antigo) para esta sessão continuar funcionando.
   */
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http
      .post<LoginResponse>(`${API_URL}/auth/alterar-senha`, {
        senhaAtual: currentPassword,
        novaSenha: newPassword,
      })
      .pipe(
        mapApiError(),
        tap((response) => this.startSession(response, this.isRemembered())),
        map(() => undefined),
      );
  }

  // ---------- Sessão no navegador ----------

  /** A sessão atual foi guardada com "Lembrar de mim" (localStorage)? */
  private isRemembered(): boolean {
    try {
      return localStorage.getItem(CHAVE_SESSAO) !== null;
    } catch {
      return false;
    }
  }

  /** Guarda a sessão. "Lembrar de mim" = localStorage (sobrevive ao fechar o navegador). */
  startSession(resposta: LoginResponse, lembrar: boolean): void {
    this.clearStorage();
    try {
      const storage = lembrar ? localStorage : sessionStorage;
      storage.setItem(CHAVE_SESSAO, JSON.stringify(resposta));
    } catch {
      // Armazenamento bloqueado (modo privado, por exemplo): a sessão vale só até recarregar.
    }
    this.sessao.set(resposta);
  }

  endSession(): void {
    this.clearStorage();
    this.sessao.set(null);
    void this.router.navigate(['/login']);
  }

  private readStoredSession(): LoginResponse | null {
    try {
      const texto = localStorage.getItem(CHAVE_SESSAO) ?? sessionStorage.getItem(CHAVE_SESSAO);
      return texto ? (JSON.parse(texto) as LoginResponse) : null;
    } catch {
      return null;
    }
  }

  private clearStorage(): void {
    try {
      localStorage.removeItem(CHAVE_SESSAO);
      sessionStorage.removeItem(CHAVE_SESSAO);
    } catch {
      // ignora
    }
  }
}
