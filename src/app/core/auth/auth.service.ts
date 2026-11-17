import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { API_URL } from '../api.config';
import { mapApiError } from '../http/translate-error';
import { CadastroRequest, LoginRequest, LoginResponse } from '../models/auth.model';

const CHAVE_SESSAO = 'healthy.sessao';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly sessao = signal<LoginResponse | null>(this.readStoredSession());

  readonly usuario = this.sessao.asReadonly();
  readonly estaLogado = computed(() => this.sessao() !== null);

  login(dados: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, dados).pipe(mapApiError());
  }

  signUp(dados: CadastroRequest): Observable<void> {
    return this.http.post<void>(`${API_URL}/auth/cadastro`, dados).pipe(mapApiError());
  }

  // The API answers 202 whether or not the account exists.
  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/auth/esqueci-senha`, { email }).pipe(mapApiError());
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${API_URL}/auth/redefinir-senha`, { token, novaSenha: newPassword })
      .pipe(mapApiError());
  }

  // The API revokes older tokens and returns a fresh one; store it where the session already lives.
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

  private isRemembered(): boolean {
    try {
      return localStorage.getItem(CHAVE_SESSAO) !== null;
    } catch {
      return false;
    }
  }

  // "Remember me" uses localStorage; otherwise sessionStorage (cleared when the tab closes).
  startSession(resposta: LoginResponse, lembrar: boolean): void {
    this.clearStorage();
    try {
      const storage = lembrar ? localStorage : sessionStorage;
      storage.setItem(CHAVE_SESSAO, JSON.stringify(resposta));
    } catch {}
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
    } catch {}
  }
}
