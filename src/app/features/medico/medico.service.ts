import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/api.config';
import { mapApiError } from '../../core/http/translate-error';
import { NovaReceitaRequest, PacienteAtendido } from '../../core/models/clinico.model';

/**
 * Tudo que a área do médico lê ou grava na API.
 * O médico é identificado pelo token JWT ("/me"); o servidor valida que ele só emite receita
 * para pacientes que já atendeu.
 */
@Injectable({ providedIn: 'root' })
export class MedicoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URL}/medicos/me`;

  /** GET /medicos/me/pacientes: um item por paciente, com o atendimento mais recente */
  listPatients(): Observable<PacienteAtendido[]> {
    return this.http.get<PacienteAtendido[]>(`${this.baseUrl}/pacientes`).pipe(mapApiError());
  }

  /**
   * POST /medicos/me/receitas: 201 sem corpo | 400 dados inválidos | 403 paciente não associado.
   * A receita já nasce aprovada (o médico a está emitindo) e a data é definida pelo servidor.
   */
  issuePrescription(data: NovaReceitaRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/receitas`, data).pipe(mapApiError());
  }
}
