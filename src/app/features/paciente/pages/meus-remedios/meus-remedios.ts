import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { loadable } from '../../../../core/utils/loadable';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { todayIso } from '../../../../core/utils/data';
import { Acompanhamento, Medicamento, Receita } from '../../../../core/models/clinico.model';
import { PacienteService } from '../../paciente.service';

/** Um remédio de uma receita que ainda não está em acompanhamento. */
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

  // Receitas só são lidas: loadable() resolve (dados + erro).
  protected readonly receitas = loadable(this.service.listPrescriptions());

  // Falha ao carregar os acompanhamentos ou ao registrar dose / encerrar
  protected readonly pageError = signal<string | null>(null);

  // Acompanhamentos mudam (ativar, dose, encerrar): guardamos num signal que atualizamos.
  protected readonly acompanhamentos = signal<Acompanhamento[] | undefined>(undefined);

  /**
   * computed: lista derivada. Recalcula sozinha sempre que receitas OU acompanhamentos mudam.
   * = remédios das receitas menos os que já estão em acompanhamento.
   */
  protected readonly disponiveis = computed<RemedioDisponivel[] | undefined>(() => {
    const receitas = this.receitas.data();
    const acompanhados = this.acompanhamentos();
    if (!receitas || !acompanhados) {
      return undefined; // ainda carregando
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

  // Qual remédio está com o formulário de ativação aberto (chave "receitaId|nome"). Só um por vez.
  protected readonly abertoChave = signal<string | null>(null);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    dataInicio: [todayIso(), Validators.required],
    quantidade: [1, [Validators.required, Validators.min(1)]],
  });

  // ngOnInit roda uma vez, logo depois que o componente é criado.
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
    // Sugere a quantidade que o médico prescreveu e a data de hoje.
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
          this.load(); // recarrega: o remédio sai de "disponíveis" e entra em "acompanhamento"
        },
        error: (e: Error) => this.erro.set(e.message),
      });
  }

  protected registerDose(acompanhamento: Acompanhamento): void {
    this.pageError.set(null);
    this.service.registerDose(acompanhamento.id).subscribe({
      next: (atualizado) => {
        // Troca só o item alterado, sem recarregar a lista inteira.
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
