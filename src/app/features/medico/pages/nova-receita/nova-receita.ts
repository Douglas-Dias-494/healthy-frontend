import { Component, effect, inject, input, signal } from '@angular/core';
import { loadable } from '../../../../core/utils/loadable';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { MedicoService } from '../../medico.service';

@Component({
  selector: 'app-nova-receita',
  imports: [ReactiveFormsModule],
  templateUrl: './nova-receita.html',
  styleUrl: './nova-receita.scss',
})
export class NovaReceita {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MedicoService);

  readonly pacienteId = input<string>();

  protected readonly pacientes = loadable(this.service.listPatients());
  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly sucesso = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    pacienteId: [null as number | null, Validators.required],
    medicamentos: this.fb.array([this.newMedication()], Validators.minLength(1)),
    observacoes: [''],
  });

  constructor() {
    effect(() => {
      const id = Number(this.pacienteId());
      if (id) {
        this.form.controls.pacienteId.setValue(id);
      }
    });
  }

  private newMedication() {
    return this.fb.nonNullable.group({
      nome: ['', Validators.required],
      dosagem: ['', Validators.required],
      quantidade: [1, [Validators.required, Validators.min(1)]],
      instrucoes: ['', Validators.required],
    });
  }

  protected addMedication(): void {
    this.form.controls.medicamentos.push(this.newMedication());
  }

  protected removeMedication(indice: number): void {
    this.form.controls.medicamentos.removeAt(indice);
  }

  protected submit(): void {
    this.sucesso.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { pacienteId, medicamentos, observacoes } = this.form.getRawValue();
    if (pacienteId === null) {
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);

    this.service
      .issuePrescription({ pacienteId, medicamentos, observacoes })
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: () => {
          this.sucesso.set(true);
          this.resetForm();
        },
        error: (e: Error) => this.erro.set(e.message),
      });
  }

  private resetForm(): void {
    this.form.controls.medicamentos.clear();
    this.form.controls.medicamentos.push(this.newMedication());
    this.form.reset({ pacienteId: null, observacoes: '' });
  }
}
