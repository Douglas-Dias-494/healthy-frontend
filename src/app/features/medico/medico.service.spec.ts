import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../core/api.config';
import { MedicoService } from './medico.service';

describe('MedicoService', () => {
  let service: MedicoService;
  let http: HttpTestingController;
  const base = `${API_URL}/medicos/me`;

  const prescription = {
    pacienteId: 1,
    medicamentos: [
      { nome: 'Dipirona', dosagem: '500 mg', quantidade: 10, instrucoes: '1 a cada 8 horas' },
    ],
    observacoes: '',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MedicoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should GET the doctor patients', () => {
    service.listPatients().subscribe();
    const request = http.expectOne(`${base}/pacientes`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('should POST the prescription without sending any doctor id', () => {
    service.issuePrescription(prescription).subscribe();

    const request = http.expectOne(`${base}/receitas`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(prescription);
    request.flush(null, { status: 201, statusText: 'Created' });
  });

  it('should POST the e-mail in the BODY (never in the URL) to search a patient', async () => {
    const result = firstValueFrom(service.findPatientByEmail('maria@exemplo.com'));

    const request = http.expectOne(`${base}/pacientes/busca`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'maria@exemplo.com' });
    expect(request.request.urlWithParams).not.toContain('maria');
    request.flush({ id: 1, nome: 'Maria' });

    expect(await result).toEqual({ id: 1, nome: 'Maria' });
  });

  it('should show the backend message when no patient is found (404)', async () => {
    const result = firstValueFrom(service.findPatientByEmail('ninguem@exemplo.com'));

    http
      .expectOne(`${base}/pacientes/busca`)
      .flush(
        { status: 404, detail: 'Nenhum paciente encontrado com este e-mail.' },
        { status: 404, statusText: 'Not Found' },
      );

    await expect(result).rejects.toThrow('Nenhum paciente encontrado com este e-mail.');
  });

  it('should POST the appointment without sending any doctor id', () => {
    const appointment = {
      pacienteId: 1,
      data: '2026-11-01',
      local: 'Clínica Vida',
      motivo: 'Retorno',
    };
    service.registerAppointment(appointment).subscribe();

    const request = http.expectOne(`${base}/atendimentos`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(appointment);
    request.flush(null, { status: 201, statusText: 'Created' });
  });

  it('should show the backend message for a duplicated appointment (409)', async () => {
    const result = firstValueFrom(
      service.registerAppointment({
        pacienteId: 1,
        data: '2026-11-01',
        local: 'Clínica Vida',
        motivo: 'Retorno',
      }),
    );

    http
      .expectOne(`${base}/atendimentos`)
      .flush(
        { status: 409, detail: 'Já existe um atendimento deste paciente nesta data.' },
        { status: 409, statusText: 'Conflict' },
      );

    await expect(result).rejects.toThrow('Já existe um atendimento deste paciente nesta data.');
  });

  it('should surface the backend message when the patient is not associated (403)', async () => {
    const result = firstValueFrom(service.issuePrescription(prescription));

    http
      .expectOne(`${base}/receitas`)
      .flush(
        { status: 403, detail: 'Este paciente não está associado a você.' },
        { status: 403, statusText: 'Forbidden' },
      );

    await expect(result).rejects.toThrow('Este paciente não está associado a você.');
  });
});
