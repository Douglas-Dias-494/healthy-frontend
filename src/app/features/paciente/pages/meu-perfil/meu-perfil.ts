import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { loadable } from '../../../../core/utils/loadable';
import { todayIso } from '../../../../core/utils/data';
import {
  cpf,
  formatCpf,
  formatPhone,
  notInFuture,
  onlyDigits,
  phone,
} from '../../../../core/validators/validators';
import { ChangePassword } from '../../../../shared/components/change-password/change-password';
import { PacienteService } from '../../paciente.service';

@Component({
  selector: 'app-meu-perfil',
  imports: [ReactiveFormsModule, ChangePassword],
  templateUrl: './meu-perfil.html',
  styleUrl: './meu-perfil.scss',
})
export class MeuPerfil {
  private readonly service = inject(PacienteService);
  private readonly fb = inject(FormBuilder);

  protected readonly profile = loadable(this.service.getProfile());
  protected readonly today = todayIso();

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    cpf: ['', [Validators.required, cpf()]],
    dataNascimento: ['', [Validators.required, notInFuture(todayIso)]],
    telefone: ['', phone()],
  });

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal(false);

  constructor() {
    // Quando a ficha chega da API, preenche o formulário (CPF e telefone já formatados para leitura)
    effect(() => {
      const data = this.profile.data();
      if (data) {
        this.form.patchValue({
          nome: data.nome,
          cpf: formatCpf(data.cpf),
          dataNascimento: data.dataNascimento ?? '',
          telefone: formatPhone(data.telefone),
        });
      }
    });
  }

  protected submit(): void {
    this.success.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const { nome, cpf: cpfValue, dataNascimento, telefone } = this.form.getRawValue();

    this.service
      .updateProfile({
        nome: nome.trim(),
        cpf: onlyDigits(cpfValue), // o servidor recebe só os dígitos
        dataNascimento,
        telefone: onlyDigits(telefone) || null,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (saved) => {
          this.success.set(true);
          this.form.patchValue({
            nome: saved.nome,
            cpf: formatCpf(saved.cpf),
            telefone: formatPhone(saved.telefone),
          });
        },
        error: (e: Error) => this.error.set(e.message),
      });
  }
}
