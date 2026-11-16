import { Component } from '@angular/core';
import { ChangePassword } from '../../../../shared/components/change-password/change-password';

@Component({
  selector: 'app-minha-conta',
  imports: [ChangePassword],
  templateUrl: './minha-conta.html',
  styles: `
    .conta {
      max-width: 720px;
    }
  `,
})
export class MinhaConta {}
