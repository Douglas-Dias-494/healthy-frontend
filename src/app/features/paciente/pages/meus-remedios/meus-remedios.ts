import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { loadable } from '../../../../core/utils/loadable';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { todayIso } from '../../../../core/utils/data';
import { Acompanhamento, Medicamento, Receita } from '../../../../core/models/clinico.model';
import { PacienteService } from '../../paciente.service';

interface RemedioDisponivel {
  receita: Receita;
  medicamento: Medicamento;
}

@Component({
  selector: 'app-meus-remedios',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './meus-remedios.html',
  styleUrl: './meus-remedios.scss',
})
export class MeusRemedios implements OnInit {
  private readonly service = inject(PacienteService);
  private readonly fb = inject(FormBuilder);

  protected readonly receitas = loadable(this.service.listPrescriptions());

  protected readonly pageError = signal<string | null>(null);

  protected readonly acompanhamentos = signal<Acompanhamento[] | undefined>(undefined);

  protected readonly disponiveis = computed<RemedioDisponivel[] | undefined>(() => {
    const receitas = this.receitas.data();
    const acompanhados = this.acompanhamentos();
    if (!receitas || !acompanhados) {
      return undefined;
    }

    return receitas
      .flatMap((receita) => receita.medicamentos.map((medicamento) => ({ receita, medicamento })))
      .filter(
        (item) =>
          !acompanhados.some(
            (a) => a.receitaId === item.receita.id && a.medicamento === item.medicamento.nome,
          ),
      );
  });

  protected readonly abertoChave = signal<string | null>(null);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    dataInicio: [todayIso(), Validators.required],
    quantidade: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.load();
  }

  protected itemKey(item: RemedioDisponivel): string {
    return `${item.receita.id}|${item.medicamento.nome}`;
  }

  protected percentage(acompanhamento: Acompanhamento): number {
    return (acompanhamento.quantidadeRestante / acompanhamento.quantidadeTotal) * 100;
  }

  protected openActivation(item: RemedioDisponivel): void {
    this.erro.set(null);
    this.form.reset({ dataInicio: todayIso(), quantidade: item.medicamento.quantidade });
    this.abertoChave.set(this.itemKey(item));
  }

  protected cancelActivation(): void {
    this.abertoChave.set(null);
  }

  protected confirmActivation(item: RemedioDisponivel): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erro.set(null);

    const { dataInicio, quantidade } = this.form.getRawValue();

    this.service
      .startTracking({
        receitaId: item.receita.id,
        medicamento: item.medicamento.nome,
        dosagem: item.medicamento.dosagem,
        dataInicio,
        quantidade,
      })
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          this.abertoChave.set(null);
          this.load();
        },
        error: (e: Error) => this.erro.set(e.message),
      });
  }

  protected registerDose(acompanhamento: Acompanhamento): void {
    this.pageError.set(null);
    this.service.registerDose(acompanhamento.id).subscribe({
      next: (atualizado) => {
        this.acompanhamentos.update((lista) =>
          lista?.map((a) => (a.id === atualizado.id ? atualizado : a)),
        );
      },
      error: (e: Error) => this.pageError.set(e.message),
    });
  }

  protected endTracking(acompanhamento: Acompanhamento): void {
    this.pageError.set(null);
    this.service.endTracking(acompanhamento.id).subscribe({
      next: () => this.load(),
      error: (e: Error) => this.pageError.set(e.message),
    });
  }

  private load(): void {
    this.service.listTrackings().subscribe({
      next: (lista) => this.acompanhamentos.set(lista),
      error: (e: Error) => this.pageError.set(e.message),
    });
  }
}
