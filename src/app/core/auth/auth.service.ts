import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
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

  // ---------- Sessão no navegador ----------

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
