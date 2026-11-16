import { inject, Injectable } from '@angular/core';
import { defer, delay, Observable, of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { mockDb, proximoId } from '../../core/mock/mock-db';
import { NovaReceitaRequest, PacienteAtendido } from '../../core/models/clinico.model';
import { hojeIso } from '../../core/utils/data';

/**
 * Tudo que a área do médico precisa buscar ou gravar.
 * Mesma ideia do PacienteService: hoje mock, depois HttpClient (ver "API:").
 * No backend real o médico é identificado pelo token JWT ("/me").
 */
@Injectable({ providedIn: 'root' })
export class MedicoService {
  private readonly auth = inject(AuthService);

  private get medicoId(): number {
    return this.auth.usuario()?.id ?? 0;
  }

  // API: GET /api/medicos/me/pacientes  -> PacienteAtendido[]  (atendimento mais recente primeiro)
  listarPacientes(): Observable<PacienteAtendido[]> {
    return defer(() => {
      const lista: PacienteAtendido[] = mockDb.atendimentos
        .filter((a) => a.medicoId === this.medicoId)
        .sort((a, b) => b.data.localeCompare(a.data))
        .map((a) => ({
          id: a.pacienteId,
          nome: mockDb.pacientes.find((p) => p.id === a.pacienteId)?.nome ?? 'Paciente',
          dataAtendimento: a.data,
          local: a.local,
          motivo: a.motivo,
        }));
      return of(lista).pipe(delay(500));
    });
  }

  // API: POST /api/medicos/me/receitas  body: NovaReceitaRequest  -> 201 | 403 | 422
  //  - 403: o paciente não está associado a este médico (REGRA DE NEGÓCIO: valide no backend!)
  //  - 422: dados inválidos (sem medicamentos, quantidade < 1...)
  //  A receita já nasce aprovada: o médico a está emitindo.
  emitirReceita(dados: NovaReceitaRequest): Observable<void> {
    return defer(() => {
      const atendeuEstePaciente = mockDb.atendimentos.some(
        (a) => a.medicoId === this.medicoId && a.pacienteId === dados.pacienteId,
      );
      if (!atendeuEstePaciente) {
        return throwError(() => new Error('Este paciente não está associado a você.'));
      }

      mockDb.receitas.push({
        id: proximoId(mockDb.receitas),
        pacienteId: dados.pacienteId,
        medicoId: this.medicoId,
        data: hojeIso(),
        medicamentos: dados.medicamentos,
        observacoes: dados.observacoes.trim(),
      });
      return of(undefined).pipe(delay(700));
    });
  }
}
