import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { hojeIso } from '../../../../core/utils/data';
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

  // Receitas só são lidas: toSignal resolve.
  protected readonly receitas = toSignal(this.service.listarReceitas());

  // Acompanhamentos mudam (ativar, dose, encerrar): guardamos num signal que atualizamos.
  protected readonly acompanhamentos = signal<Acompanhamento[] | undefined>(undefined);

  /**
   * computed: lista derivada. Recalcula sozinha sempre que receitas OU acompanhamentos mudam.
   * = remédios das receitas menos os que já estão em acompanhamento.
   */
  protected readonly disponiveis = computed<RemedioDisponivel[] | undefined>(() => {
    const receitas = this.receitas();
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
    dataInicio: [hojeIso(), Validators.required],
    quantidade: [1, [Validators.required, Validators.min(1)]],
  });

  // ngOnInit roda uma vez, logo depois que o componente é criado.
  ngOnInit(): void {
    this.carregar();
  }

  protected chave(item: RemedioDisponivel): string {
    return `${item.receita.id}|${item.medicamento.nome}`;
  }

  protected percentual(acompanhamento: Acompanhamento): number {
    return (acompanhamento.quantidadeRestante / acompanhamento.quantidadeTotal) * 100;
  }

  protected abrirAtivacao(item: RemedioDisponivel): void {
    this.erro.set(null);
    // Sugere a quantidade que o médico prescreveu e a data de hoje.
    this.form.reset({ dataInicio: hojeIso(), quantidade: item.medicamento.quantidade });
    this.abertoChave.set(this.chave(item));
  }

  protected cancelarAtivacao(): void {
    this.abertoChave.set(null);
  }

  protected confirmarAtivacao(item: RemedioDisponivel): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erro.set(null);

    const { dataInicio, quantidade } = this.form.getRawValue();

    this.service
      .ativarAcompanhamento({
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
          this.carregar(); // recarrega: o remédio sai de "disponíveis" e entra em "acompanhamento"
        },
        error: (e: Error) => this.erro.set(e.message),
      });
  }

  protected registrarDose(acompanhamento: Acompanhamento): void {
    this.service.registrarDose(acompanhamento.id).subscribe((atualizado) => {
      // Troca só o item alterado, sem recarregar a lista inteira.
      this.acompanhamentos.update((lista) =>
        lista?.map((a) => (a.id === atualizado.id ? atualizado : a)),
      );
    });
  }

  protected encerrar(acompanhamento: Acompanhamento): void {
    this.service.encerrarAcompanhamento(acompanhamento.id).subscribe(() => this.carregar());
  }

  private carregar(): void {
    this.service.listarAcompanhamentos().subscribe((lista) => this.acompanhamentos.set(lista));
  }
}
