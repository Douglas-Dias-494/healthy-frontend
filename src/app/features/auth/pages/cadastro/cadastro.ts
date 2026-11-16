import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { CadastroRequest, Perfil } from '../../../../core/models/auth.model';

/**
 * Validador de GRUPO: olha dois campos ao mesmo tempo.
 * Validadores de campo só enxergam o próprio valor; para comparar senha com confirmação
 * é preciso validar o grupo inteiro. O erro fica em form.errors (e não no campo).
 */
const passwordsMatch: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null => {
  const senha = grupo.get('senha')?.value;
  const confirmacao = grupo.get('confirmarSenha')?.value;
  return senha === confirmacao ? null : { senhasDiferentes: true };
};

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
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', Validators.required],
      // Só valem para médico; as regras são ligadas/desligadas no effect abaixo
      crm: [''],
      especialidade: [''],
    },
    { validators: passwordsMatch },
  );

  // valueChanges é um Observable; toSignal o transforma em signal para usar no template e no computed
  private readonly perfil = toSignal(this.form.controls.perfil.valueChanges, {
    initialValue: this.form.controls.perfil.value,
  });
  protected readonly ehMedico = computed(() => this.perfil() === 'MEDICO');

  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly sucesso = signal(false);

  constructor() {
    // Sempre que o perfil mudar: liga "obrigatório" em CRM/especialidade (médico) ou desliga (paciente).
    effect(() => {
      const medico = this.ehMedico();
      for (const campo of [this.form.controls.crm, this.form.controls.especialidade]) {
        if (medico) {
          campo.setValidators([Validators.required, Validators.maxLength(40)]);
        } else {
          campo.clearValidators();
        }
        campo.reset(''); // limpa o valor e reavalia as regras
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

    // A confirmação de senha só serve para validar aqui: não vai para o backend.
    const { confirmarSenha: _confirmacao, crm, especialidade, ...basico } = this.form.getRawValue();
    const dados: CadastroRequest = this.ehMedico() ? { ...basico, crm, especialidade } : basico;

    this.auth
      .signUp(dados)
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: () => this.sucesso.set(true),
        // Aqui revelar "e-mail já existe" é aceitável (o usuário precisa saber para tentar outro)
        error: (e: Error) => this.erro.set(e.message),
      });
  }
}
