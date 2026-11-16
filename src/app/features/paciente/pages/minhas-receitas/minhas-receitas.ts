import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { loadable } from '../../../../core/utils/loadable';
import { RouterLink } from '@angular/router';
import { PacienteService } from '../../paciente.service';

@Component({
  selector: 'app-minhas-receitas',
  imports: [DatePipe, RouterLink],
  templateUrl: './minhas-receitas.html',
  styleUrl: './minhas-receitas.scss',
})
export class MinhasReceitas {
  private readonly service = inject(PacienteService);

  protected readonly receitas = loadable(this.service.listPrescriptions());
}
