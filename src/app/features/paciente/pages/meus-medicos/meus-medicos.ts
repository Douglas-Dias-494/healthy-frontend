import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { loadable } from '../../../../core/utils/loadable';
import { IniciaisPipe } from '../../../../shared/pipes/iniciais.pipe';
import { PacienteService } from '../../paciente.service';

@Component({
  selector: 'app-meus-medicos',
  imports: [DatePipe, IniciaisPipe],
  templateUrl: './meus-medicos.html',
})
export class MeusMedicos {
  private readonly service = inject(PacienteService);

  protected readonly atendimentos = loadable(this.service.listAppointments());
}
