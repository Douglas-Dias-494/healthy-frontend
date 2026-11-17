import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/api.config';
import { mapApiError } from '../../core/http/translate-error';
import {
  Acompanhamento,
  AtivarAcompanhamentoRequest,
  Atendimento,
  AtualizarFichaRequest,
  FichaPaciente,
  Receita,
} from '../../core/models/clinico.model';

@Injectable({ providedIn: 'root' })
export class PacienteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URL}/pacientes/me`;

  getProfile(): Observable<FichaPaciente> {
    return this.http.get<FichaPaciente>(`${this.baseUrl}/ficha`).pipe(mapApiError());
  }

  updateProfile(data: AtualizarFichaRequest): Observable<FichaPaciente> {
    return this.http.put<FichaPaciente>(`${this.baseUrl}/ficha`, data).pipe(mapApiError());
  }

  listAppointments(): Observable<Atendimento[]> {
    return this.http.get<Atendimento[]>(`${this.baseUrl}/atendimentos`).pipe(mapApiError());
  }

  listPrescriptions(): Observable<Receita[]> {
    return this.http.get<Receita[]>(`${this.baseUrl}/receitas`).pipe(mapApiError());
  }

  listTrackings(): Observable<Acompanhamento[]> {
    return this.http.get<Acompanhamento[]>(`${this.baseUrl}/acompanhamentos`).pipe(mapApiError());
  }

  startTracking(data: AtivarAcompanhamentoRequest): Observable<Acompanhamento> {
    return this.http
      .post<Acompanhamento>(`${this.baseUrl}/acompanhamentos`, data)
      .pipe(mapApiError());
  }

  registerDose(id: number): Observable<Acompanhamento> {
    return this.http
      .patch<Acompanhamento>(`${this.baseUrl}/acompanhamentos/${id}/dose`, null)
      .pipe(mapApiError());
  }

  endTracking(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/acompanhamentos/${id}`).pipe(mapApiError());
  }
}
