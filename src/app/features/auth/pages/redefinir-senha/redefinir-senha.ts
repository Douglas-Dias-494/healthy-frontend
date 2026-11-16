import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { fieldsMatch, strongPassword } from '../../../../core/validators/validators';

@Component({
  selector: 'app-redefinir-senha',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './redefinir-senha.html',
})
export class RedefinirSenha {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Chega pela URL do e-mail: /redefinir-senha?token=... (withComponentInputBinding liga o parâmetro). */
  readonly token = input<string>();

  // O token é copiado para cá e removido da barra de endereço (ver o effect): assim ele não fica no
  // histórico do navegador nem aparece numa captura de tela.
  private readonly storedToken = signal<string | null>(null);

  /** Só mostra "link inválido" quando não há token nem na URL nem guardado. */
  protected readonly invalidLink = computed(() => !this.storedToken() && !this.token());

  protected readonly form = this.fb.nonNullable.group(
    {
      novaSenha: ['', [Validators.required, strongPassword()]],
      confirmarSenha: ['', Validators.required],
    },
    { validators: fieldsMatch('novaSenha', 'confirmarSenha') },
  );

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly done = signal(false);

  constructor() {
    effect(() => {
      const fromUrl = this.token();
      if (fromUrl && this.storedToken() === null) {
        this.storedToken.set(fromUrl);
        void this.router.navigate(['/redefinir-senha'], { replaceUrl: true }); // tira o token da URL
      }
    });
  }

  protected submit(): void {
    const token = this.storedToken();
    if (!token) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.auth
      .resetPassword(token, this.form.controls.novaSenha.value)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.done.set(true),
        error: (e: Error) => this.error.set(e.message),
      });
  }
}
