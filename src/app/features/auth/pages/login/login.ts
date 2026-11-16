import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { Perfil } from '../../../../core/models/auth.model';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  // Serviço de login (mock por enquanto) e navegação entre telas
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group({
    // 'PACIENTE' as Perfil: começa em PACIENTE, mas o tipo aceita só os valores de Perfil
    perfil: ['PACIENTE' as Perfil, Validators.required],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    senha: ['', [Validators.required]],
    lembrar: false,
  });

  // Estado da tela. Cada signal guarda um valor e avisa o Angular quando ele muda.
  // false = senha escondida (type="password")
  protected readonly mostrarSenha = signal(false);
  // true enquanto a requisição de login estiver em andamento
  protected readonly carregando = signal(false);
  // texto do erro vindo do login; null = sem erro (o genérico é necessário, senão o tipo seria só "null")
  protected readonly erro = signal<string | null>(null);

  // Inverte o valor atual: false vira true e true vira false
  protected togglePassword(): void {
    this.mostrarSenha.update((valorAtual) => !valorAtual);
  }

  protected onSubmit(): void {
    // 1) Formulário inválido: marca todos os campos como "tocados" (para mostrar os erros) e para aqui
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // 2) Prepara a tela: liga o spinner e apaga o erro da tentativa anterior
    this.carregando.set(true);
    this.erro.set(null);

    // 3) Chama o serviço. Nada acontece até o subscribe()
    this.auth
      .login(this.form.getRawValue())
      // finalize roda no fim, com sucesso OU erro: o spinner sempre desliga
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (resposta) => {
          // Guarda quem entrou. "Lembrar de mim" marcado = fica salvo mesmo fechando o navegador
          this.auth.startSession(resposta, this.form.controls.lembrar.value);

          // 4) Sucesso: cada perfil vai para a sua área
          const destino = resposta.perfil === 'MEDICO' ? '/medico' : '/paciente';
          this.router.navigate([destino]);
        },
        // A mensagem vem do AuthService: "E-mail ou senha incorretos." (o backend usa a mesma para
        // qualquer falha, sem revelar se o e-mail existe) ou "não foi possível conectar" se a API estiver fora
        error: (e: Error) => this.erro.set(e.message),
      });
  }
}
