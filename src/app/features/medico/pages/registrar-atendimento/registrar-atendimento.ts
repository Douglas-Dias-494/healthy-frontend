import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PacienteBusca } from '../../../../core/models/clinico.model';
import { todayIso } from '../../../../core/utils/data';
import { notInFuture } from '../../../../core/validators/validators';
import { MedicoService } from '../../medico.service';

/**
 * Registrar um atendimento é o que "associa" médico e paciente: só depois disso o paciente vê o médico,
 * o médico vê o paciente na lista dele e pode emitir receita para ele.
 * Passo 1: achar o paciente pelo e-mail exato. Passo 2: informar data, local e motivo.
 */
@Component({
  selector: 'app-registrar-atendimento',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registrar-atendimento.html',
  styleUrl: './registrar-atendimento.scss',
})
export class RegistrarAtendimento {
  private readonly service = inject(MedicoService);
  private readonly fb = inject(FormBuilder);

  protected readonly today = todayIso();

  protected readonly searchForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
  });

  protected readonly appointmentForm = this.fb.nonNullable.group({
    data: [todayIso(), [Validators.required, notInFuture(todayIso)]],
    local: ['', [Validators.required, Validators.maxLength(200)]],
    motivo: ['', [Validators.required, Validators.maxLength(200)]],
  });

  /** Paciente encontrado na busca (passo 2 aparece quando há um). */
  protected readonly patient = signal<PacienteBusca | null>(null);
  protected readonly searching = signal(false);
  protected readonly searchError = signal<string | null>(null);

  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  /** Último atendimento registrado (para mostrar a confirmação e o atalho "Emitir receita"). */
  protected readonly registered = signal<PacienteBusca | null>(null);

  protected searchPatient(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    this.searching.set(true);
    this.searchError.set(null);
    this.registered.set(null);

    this.service
      .findPatientByEmail(this.searchForm.controls.email.value)
      .pipe(finalize(() => this.searching.set(false)))
      .subscribe({
        next: (found) => this.patient.set(found),
        error: (e: Error) => this.searchError.set(e.message),
      });
  }

  protected changePatient(): void {
    this.patient.set(null);
    this.saveError.set(null);
    this.searchForm.reset();
  }

  protected submit(): void {
    const patient = this.patient();
    if (!patient) {
      return;
    }
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);

    const { data, local, motivo } = this.appointmentForm.getRawValue();

    this.service
      .registerAppointment({
        pacienteId: patient.id,
        data,
        local: local.trim(),
        motivo: motivo.trim(),
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.registered.set(patient);
          this.patient.set(null);
          this.searchForm.reset();
          this.appointmentForm.reset({ data: todayIso(), local: '', motivo: '' });
        },
        error: (e: Error) => this.saveError.set(e.message),
      });
  }
}
