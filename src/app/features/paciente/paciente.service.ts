import { inject, Injectable } from '@angular/core';
import { defer, delay, Observable, of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AcompanhamentoRow, buscarMedico, mockDb, proximoId } from '../../core/mock/mock-db';
import {
  Acompanhamento,
  AtivarAcompanhamentoRequest,
  Atendimento,
  Receita,
} from '../../core/models/clinico.model';

/**
 * Tudo que a área do paciente precisa buscar ou gravar.
 *
 * Hoje usa o mockDb. Quando o backend existir, cada método vira uma chamada
 * HttpClient (ver o comentário "API:" de cada um) e o resto do app não muda.
 *
 * Nota: no backend de verdade o front NÃO envia o id do paciente. O servidor descobre
 * quem é pelo token JWT (por isso as URLs usam "/me"). Aqui o id é lido só para o mock.
 */
@Injectable({ providedIn: 'root' })
export class PacienteService {
  private readonly auth = inject(AuthService);

  private get pacienteId(): number {
    return this.auth.usuario()?.id ?? 0;
  }

  // API: GET /api/pacientes/me/atendimentos  -> Atendimento[]  (mais recentes primeiro)
  listarAtendimentos(): Observable<Atendimento[]> {
    return defer(() => {
      const lista: Atendimento[] = mockDb.atendimentos
        .filter((a) => a.pacienteId === this.pacienteId)
        .sort((a, b) => b.data.localeCompare(a.data))
        .map((a) => ({ id: a.id, medico: buscarMedico(a.medicoId), data: a.data, local: a.local }));
      return of(lista).pipe(delay(500));
    });
  }

  // API: GET /api/pacientes/me/receitas  -> Receita[]  (só as aprovadas/emitidas pelo médico)
  listarReceitas(): Observable<Receita[]> {
    return defer(() => {
      const lista: Receita[] = mockDb.receitas
        .filter((r) => r.pacienteId === this.pacienteId)
        .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id)
        .map((r) => ({
          id: r.id,
          medico: buscarMedico(r.medicoId),
          data: r.data,
          medicamentos: r.medicamentos,
          observacoes: r.observacoes,
        }));
      return of(lista).pipe(delay(500));
    });
  }

  // API: GET /api/pacientes/me/acompanhamentos  -> Acompanhamento[]
  listarAcompanhamentos(): Observable<Acompanhamento[]> {
    return defer(() => {
      const lista = mockDb.acompanhamentos
        .filter((a) => a.pacienteId === this.pacienteId)
        .map(paraAcompanhamento);
      return of(lista).pipe(delay(400));
    });
  }

  // API: POST /api/pacientes/me/acompanhamentos  body: AtivarAcompanhamentoRequest
  //      -> 201 Acompanhamento | 409 (remédio já em acompanhamento)
  ativarAcompanhamento(dados: AtivarAcompanhamentoRequest): Observable<Acompanhamento> {
    return defer(() => {
      const jaExiste = mockDb.acompanhamentos.some(
        (a) =>
          a.pacienteId === this.pacienteId &&
          a.receitaId === dados.receitaId &&
          a.medicamento === dados.medicamento,
      );
      if (jaExiste) {
        return throwError(() => new Error('Este remédio já está em acompanhamento.'));
      }

      const novo: AcompanhamentoRow = {
        id: proximoId(mockDb.acompanhamentos),
        pacienteId: this.pacienteId,
        receitaId: dados.receitaId,
        medicamento: dados.medicamento,
        dosagem: dados.dosagem,
        dataInicio: dados.dataInicio,
        quantidadeTotal: dados.quantidade,
        quantidadeRestante: dados.quantidade,
      };
      mockDb.acompanhamentos.push(novo);
      return of(paraAcompanhamento(novo)).pipe(delay(400));
    });
  }

  // API: PATCH /api/pacientes/me/acompanhamentos/{id}/dose  -> Acompanhamento atualizado
  //      (o servidor desconta 1 unidade; nunca deixa ficar abaixo de 0)
  registrarDose(id: number): Observable<Acompanhamento> {
    return defer(() => {
      const item = this.buscarDoPaciente(id);
      if (!item) {
        return throwError(() => new Error('Acompanhamento não encontrado.'));
      }
      item.quantidadeRestante = Math.max(0, item.quantidadeRestante - 1);
      return of(paraAcompanhamento(item)).pipe(delay(200));
    });
  }

  // API: DELETE /api/pacientes/me/acompanhamentos/{id}  -> 204
  encerrarAcompanhamento(id: number): Observable<void> {
    return defer(() => {
      const posicao = mockDb.acompanhamentos.findIndex(
        (a) => a.id === id && a.pacienteId === this.pacienteId,
      );
      if (posicao === -1) {
        return throwError(() => new Error('Acompanhamento não encontrado.'));
      }
      mockDb.acompanhamentos.splice(posicao, 1);
      return of(undefined).pipe(delay(200));
    });
  }

  private buscarDoPaciente(id: number): AcompanhamentoRow | undefined {
    return mockDb.acompanhamentos.find((a) => a.id === id && a.pacienteId === this.pacienteId);
  }
}

/** Devolve uma cópia sem o pacienteId (a linha do "banco" tem mais campos que o contrato). */
function paraAcompanhamento(linha: AcompanhamentoRow): Acompanhamento {
  const { pacienteId: _ignorado, ...acompanhamento } = linha;
  return acompanhamento;
}
