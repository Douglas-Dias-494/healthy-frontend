import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

interface ItemMenu {
  caminho: string;
  rotulo: string;
}

const MENU_PACIENTE: ItemMenu[] = [
  { caminho: '/paciente/medicos', rotulo: 'Meus médicos' },
  { caminho: '/paciente/receitas', rotulo: 'Receitas' },
  { caminho: '/paciente/remedios', rotulo: 'Meus remédios' },
  { caminho: '/paciente/perfil', rotulo: 'Meu perfil' },
];

const MENU_MEDICO: ItemMenu[] = [
  { caminho: '/medico/pacientes', rotulo: 'Meus pacientes' },
  { caminho: '/medico/registrar-atendimento', rotulo: 'Registrar atendimento' },
  { caminho: '/medico/nova-receita', rotulo: 'Nova receita' },
  { caminho: '/medico/conta', rotulo: 'Minha conta' },
];

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly auth = inject(AuthService);

  protected readonly usuario = this.auth.usuario;

  protected readonly menu = computed(() =>
    this.usuario()?.perfil === 'MEDICO' ? MENU_MEDICO : MENU_PACIENTE,
  );
  protected readonly inicio = computed(() => this.menu()[0].caminho);

  protected signOut(): void {
    this.auth.endSession();
  }
}
