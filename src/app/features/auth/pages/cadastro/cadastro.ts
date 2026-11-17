import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { CadastroRequest, Perfil } from '../../../../core/models/auth.model';
import { fieldsMatch, strongPassword } from '../../../../core/validators/validators';

@Component({
  selector: 'app-cadastro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.scss',
})
export class Cadastro {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly form = this.fb.nonNullable.group(
    {
      perfil: ['PACIENTE' as Perfil, Validators.required],
      nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      senha: ['', [Validators.required, strongPassword()]],
      confirmarSenha: ['', Validators.required],
      crm: [''],
      especialidade: [''],
    },
    { validators: fieldsMatch('senha', 'confirmarSenha') },
  );

  private readonly perfil = toSignal(this.form.controls.perfil.valueChanges, {
    initialValue: this.form.controls.perfil.value,
  });
  protected readonly ehMedico = computed(() => this.perfil() === 'MEDICO');

  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly sucesso = signal(false);

  constructor() {
    effect(() => {
      const medico = this.ehMedico();
      for (const campo of [this.form.controls.crm, this.form.controls.especialidade]) {
        if (medico) {
          campo.setValidators([Validators.required, Validators.maxLength(40)]);
        } else {
          campo.clearValidators();
        }
        campo.reset('');
      }
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);

    const { confirmarSenha: _confirmacao, crm, especialidade, ...basico } = this.form.getRawValue();
    const dados: CadastroRequest = this.ehMedico() ? { ...basico, crm, especialidade } : basico;

    this.auth
      .signUp(dados)
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: () => this.sucesso.set(true),
        error: (e: Error) => this.erro.set(e.message),
      });
  }
}
