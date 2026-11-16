import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/api.config';
import { mapApiError } from '../../core/http/translate-error';
import {
  Acompanhamento,
  AtivarAcompanhamentoRequest,
  Atendimento,
  Receita,
} from '../../core/models/clinico.model';

/**
 * Tudo que a área do paciente lê ou grava na API.
 * O paciente é identificado pelo token JWT (por isso as URLs usam "/me"): o front nunca envia o id
 * do usuário, então não há como pedir os dados de outra pessoa.
 */
@Injectable({ providedIn: 'root' })
export class PacienteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URL}/pacientes/me`;

  /** GET /pacientes/me/atendimentos: consultas, da mais recente para a mais antiga */
  listAppointments(): Observable<Atendimento[]> {
    return this.http.get<Atendimento[]>(`${this.baseUrl}/atendimentos`).pipe(mapApiError());
  }

  /** GET /pacientes/me/receitas: receitas já emitidas pelos médicos */
  listPrescriptions(): Observable<Receita[]> {
    return this.http.get<Receita[]>(`${this.baseUrl}/receitas`).pipe(mapApiError());
  }

  /** GET /pacientes/me/acompanhamentos */
  listTrackings(): Observable<Acompanhamento[]> {
    return this.http.get<Acompanhamento[]>(`${this.baseUrl}/acompanhamentos`).pipe(mapApiError());
  }

  /** POST /pacientes/me/acompanhamentos: 201 | 400 | 404 receita de outro paciente | 409 já existe */
  startTracking(data: AtivarAcompanhamentoRequest): Observable<Acompanhamento> {
    return this.http
      .post<Acompanhamento>(`${this.baseUrl}/acompanhamentos`, data)
      .pipe(mapApiError());
  }

  /** PATCH /pacientes/me/acompanhamentos/{id}/dose: o servidor desconta 1 unidade (mínimo 0) */
  registerDose(id: number): Observable<Acompanhamento> {
    return this.http
      .patch<Acompanhamento>(`${this.baseUrl}/acompanhamentos/${id}/dose`, null)
      .pipe(mapApiError());
  }

  /** DELETE /pacientes/me/acompanhamentos/{id}: 204 */
  endTracking(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/acompanhamentos/${id}`).pipe(mapApiError());
  }
}
