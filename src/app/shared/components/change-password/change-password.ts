import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { fieldsMatch, strongPassword } from '../../../core/validators/validators';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule],
  templateUrl: './change-password.html',
  styles: `
    .troca {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
      margin-top: 1.1rem;
    }
  `,
})
export class ChangePassword {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly form = this.fb.nonNullable.group(
    {
      senhaAtual: ['', Validators.required],
      novaSenha: ['', [Validators.required, strongPassword()]],
      confirmarSenha: ['', Validators.required],
    },
    { validators: fieldsMatch('novaSenha', 'confirmarSenha') },
  );

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal(false);

  protected submit(): void {
    this.success.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const { senhaAtual, novaSenha } = this.form.getRawValue();
    this.auth
      .changePassword(senhaAtual, novaSenha)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.success.set(true);
          this.form.reset();
        },
        error: (e: Error) => this.error.set(e.message),
      });
  }
}
