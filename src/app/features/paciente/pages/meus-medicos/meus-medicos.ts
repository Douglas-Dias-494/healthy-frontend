import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { IniciaisPipe } from '../../../../shared/pipes/iniciais.pipe';
import { PacienteService } from '../../paciente.service';

@Component({
  selector: 'app-meus-medicos',
  imports: [DatePipe, IniciaisPipe],
  templateUrl: './meus-medicos.html',
})
export class MeusMedicos {
  private readonly service = inject(PacienteService);

  // toSignal assina o Observable e entrega o resultado como signal.
  // Enquanto a resposta não chega, o valor é undefined (usamos isso para mostrar "Carregando").
  protected readonly atendimentos = toSignal(this.service.listarAtendimentos());
}
