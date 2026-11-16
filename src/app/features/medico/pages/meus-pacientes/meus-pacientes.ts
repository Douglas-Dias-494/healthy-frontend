import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { loadable } from '../../../../core/utils/loadable';
import { RouterLink } from '@angular/router';
import { IniciaisPipe } from '../../../../shared/pipes/iniciais.pipe';
import { MedicoService } from '../../medico.service';

@Component({
  selector: 'app-meus-pacientes',
  imports: [DatePipe, RouterLink, IniciaisPipe],
  templateUrl: './meus-pacientes.html',
  styleUrl: './meus-pacientes.scss',
})
export class MeusPacientes {
  private readonly service = inject(MedicoService);

  protected readonly pacientes = loadable(this.service.listPatients());
}
