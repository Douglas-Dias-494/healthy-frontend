import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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

  protected readonly receitas = toSignal(this.service.listarReceitas());
}
