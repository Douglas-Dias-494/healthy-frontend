import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-esqueci-senha',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './esqueci-senha.html',
})
export class EsqueciSenha {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
  });

  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sent = signal(false);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending.set(true);
    this.error.set(null);

    this.auth
      .forgotPassword(this.form.controls.email.value)
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        // A API responde igual exista a conta ou não: a tela também não diz se o e-mail tem cadastro.
        next: () => this.sent.set(true),
        error: (e: Error) => this.error.set(e.message),
      });
  }
}
