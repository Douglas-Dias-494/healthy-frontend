import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { Perfil } from '../../../../core/models/auth.model';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group({
    perfil: ['PACIENTE' as Perfil, Validators.required],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    senha: ['', [Validators.required]],
    lembrar: false,
  });

  protected readonly mostrarSenha = signal(false);
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected togglePassword(): void {
    this.mostrarSenha.update((valorAtual) => !valorAtual);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);

    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (resposta) => {
          this.auth.startSession(resposta, this.form.controls.lembrar.value);

          const destino = resposta.perfil === 'MEDICO' ? '/medico' : '/paciente';
          this.router.navigate([destino]);
        },
        error: (e: Error) => this.erro.set(e.message),
      });
  }
}
