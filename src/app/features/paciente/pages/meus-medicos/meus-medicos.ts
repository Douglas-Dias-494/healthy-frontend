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

  // loadable() assina o Observable e entrega dois signals: data e error.
  // Enquanto a resposta não chega, data() é undefined (usamos isso para mostrar "Carregando").
  protected readonly atendimentos = loadable(this.service.listAppointments());
}
