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

  /**
   * Chega pela URL: /medico/nova-receita?pacienteId=5
   * (withComponentInputBinding em app.config.ts liga o parâmetro ao input com o mesmo nome).
   * Vem como texto e pode não existir.
   */
  readonly pacienteId = input<string>();

  protected readonly pacientes = loadable(this.service.listPatients());
  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly sucesso = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    // null = nada selecionado ainda; o <select> usa [ngValue] para guardar o número do paciente
    pacienteId: [null as number | null, Validators.required],
    // FormArray: lista de FormGroups, um por medicamento. Cresce e diminui em tempo de execução.
    medicamentos: this.fb.array([this.newMedication()], Validators.minLength(1)),
    observacoes: [''],
  });

  constructor() {
    // effect: roda quando o input muda. Aqui, pré-seleciona o paciente vindo da URL.
    effect(() => {
      const id = Number(this.pacienteId());
      if (id) {
        this.form.controls.pacienteId.setValue(id);
      }
    });
  }

  /** Cria o grupo de campos de UM medicamento. */
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
      return; // o validador required já impede, isto só tranquiliza o TypeScript
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
    // Volta a UM medicamento vazio e zera estados de "tocado"/"alterado".
    this.form.controls.medicamentos.clear();
    this.form.controls.medicamentos.push(this.newMedication());
    this.form.reset({ pacienteId: null, observacoes: '' });
  }
}
