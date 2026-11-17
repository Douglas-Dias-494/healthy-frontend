export type Perfil = 'PACIENTE' | 'MEDICO';

export interface LoginRequest {
  perfil: Perfil;
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  id: number;
  nome: string;
  perfil: Perfil;
}

export interface CadastroRequest {
  perfil: Perfil;
  nome: string;
  email: string;
  senha: string;
  crm?: string;
  especialidade?: string;
}
