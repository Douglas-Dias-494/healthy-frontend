import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/api.config';
import { mapApiError } from '../../core/http/translate-error';
import {
  NovaReceitaRequest,
  NovoAtendimentoRequest,
  PacienteAtendido,
  PacienteBusca,
} from '../../core/models/clinico.model';

@Injectable({ providedIn: 'root' })
export class MedicoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URL}/medicos/me`;

  listPatients(): Observable<PacienteAtendido[]> {
    return this.http.get<PacienteAtendido[]>(`${this.baseUrl}/pacientes`).pipe(mapApiError());
  }

  findPatientByEmail(email: string): Observable<PacienteBusca> {
    return this.http
      .post<PacienteBusca>(`${this.baseUrl}/pacientes/busca`, { email })
      .pipe(mapApiError());
  }

  registerAppointment(data: NovoAtendimentoRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/atendimentos`, data).pipe(mapApiError());
  }

  issuePrescription(data: NovaReceitaRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/receitas`, data).pipe(mapApiError());
  }
}
