import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink
    // TODO: importar ReactiveFormsModule (formulário) e RouterLink (links de navegação)
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  // TODO 1: criar o FormGroup com os controles perfil, email, senha e lembrar
  //         (use Validators: required, email, minLength) — dica: inject(FormBuilder) ou new FormGroup
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    perfil: ['PACIENTE' as 'PACIENTE' | 'MEDICO', Validators.required],
    email: ['', [Validators.required, Validators.maxLength(100)]],
    senha: ['', [Validators.required]]
  })

  // Estado da tela. Cada signal guarda um valor e avisa o Angular quando ele muda.
  // false = senha escondida (type="password")
  protected readonly mostrarSenha = signal(false);
  // true enquanto a requisição de login estiver em andamento
  protected readonly carregando = signal(false);
  // texto do erro vindo do login; null = sem erro (o genérico é necessário, senão o tipo seria só "null")
  protected readonly erro = signal<string | null>(null);

  // Inverte o valor atual: false vira true e true vira false
  protected alternarSenha(): void {
    this.mostrarSenha.update((valorAtual) => !valorAtual);
  }

  protected onSubmit(): void {
    
  }

  // TODO 4: criar o método entrar():
  //         - se o formulário for inválido, marcar os campos como tocados e parar
  //         - chamar o AuthService (ainda a criar) e tratar sucesso/erro
  //         - em caso de sucesso, redirecionar conforme o perfil (paciente x médico)

}
