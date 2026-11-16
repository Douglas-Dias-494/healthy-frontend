import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../core/api.config';
import { PacienteService } from './paciente.service';

describe('PacienteService', () => {
  let service: PacienteService;
  let http: HttpTestingController;
  const base = `${API_URL}/pacientes/me`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PacienteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should GET the appointments of the logged patient', async () => {
    const result = firstValueFrom(service.listAppointments());
    const request = http.expectOne(`${base}/atendimentos`);
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 1 }]);
    expect(await result).toEqual([{ id: 1 }] as never);
  });

  it('should GET prescriptions and trackings from their own endpoints', () => {
    service.listPrescriptions().subscribe();
    service.listTrackings().subscribe();
    http.expectOne(`${base}/receitas`).flush([]);
    http.expectOne(`${base}/acompanhamentos`).flush([]);
  });

  it('should POST the tracking data to start a tracking', () => {
    const data = {
      receitaId: 1,
      medicamento: 'Dipirona',
      dosagem: '500 mg',
      dataInicio: '2026-11-16',
      quantidade: 20,
    };
    service.startTracking(data).subscribe();

    const request = http.expectOne(`${base}/acompanhamentos`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(data);
    request.flush({});
  });

  it('should PATCH the dose endpoint to register a dose', () => {
    service.registerDose(7).subscribe();
    const request = http.expectOne(`${base}/acompanhamentos/7/dose`);
    expect(request.request.method).toBe('PATCH');
    request.flush({});
  });

  it('should DELETE the tracking to end it', () => {
    service.endTracking(7).subscribe();
    const request = http.expectOne(`${base}/acompanhamentos/7`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should GET the profile (ficha) of the logged patient', () => {
    service.getProfile().subscribe();
    const request = http.expectOne(`${base}/ficha`);
    expect(request.request.method).toBe('GET');
    request.flush({
      nome: 'Maria',
      email: 'maria@x.com',
      cpf: null,
      dataNascimento: null,
      telefone: null,
    });
  });

  it('should PUT the profile with digits only', () => {
    const data = {
      nome: 'Maria Silva',
      cpf: '52998224725',
      dataNascimento: '1990-05-17',
      telefone: '11987654321',
    };
    service.updateProfile(data).subscribe();

    const request = http.expectOne(`${base}/ficha`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(data);
    request.flush({ ...data, email: 'maria@x.com' });
  });

  it('should show the backend message when the CPF belongs to another account', async () => {
    const result = firstValueFrom(
      service.updateProfile({
        nome: 'Maria',
        cpf: '52998224725',
        dataNascimento: '1990-05-17',
        telefone: null,
      }),
    );

    http
      .expectOne(`${base}/ficha`)
      .flush(
        { status: 409, detail: 'Este CPF já está cadastrado em outra conta.' },
        { status: 409, statusText: 'Conflict' },
      );

    await expect(result).rejects.toThrow('Este CPF já está cadastrado em outra conta.');
  });

  it('should surface the backend message on errors', async () => {
    const result = firstValueFrom(
      service.startTracking({
        receitaId: 1,
        medicamento: 'Dipirona',
        dosagem: '',
        dataInicio: '2026-11-16',
        quantidade: 1,
      }),
    );

    http
      .expectOne(`${base}/acompanhamentos`)
      .flush(
        { status: 409, detail: 'Este remédio já está em acompanhamento.' },
        { status: 409, statusText: 'Conflict' },
      );

    await expect(result).rejects.toThrow('Este remédio já está em acompanhamento.');
  });
});
