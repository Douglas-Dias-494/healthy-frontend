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
