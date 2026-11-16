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
];

const MENU_MEDICO: ItemMenu[] = [
  { caminho: '/medico/pacientes', rotulo: 'Meus pacientes' },
  { caminho: '/medico/nova-receita', rotulo: 'Nova receita' },
];

/**
 * Esqueleto das áreas logadas: cabeçalho + menu + <router-outlet>.
 * As páginas de cada perfil aparecem dentro do <router-outlet>.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly auth = inject(AuthService);

  protected readonly usuario = this.auth.usuario;

  // computed: recalcula sozinho quando o usuário muda
  protected readonly menu = computed(() =>
    this.usuario()?.perfil === 'MEDICO' ? MENU_MEDICO : MENU_PACIENTE,
  );
  protected readonly inicio = computed(() => this.menu()[0].caminho);

  protected sair(): void {
    this.auth.encerrarSessao();
  }
}
