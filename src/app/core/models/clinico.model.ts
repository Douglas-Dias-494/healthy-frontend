export interface MedicoResumo {
  id: number;
  nome: string;
  especialidade: string;
  crm: string;
}

export interface Atendimento {
  id: number;
  medico: MedicoResumo;
  data: string;
  local: string;
}

export interface Medicamento {
  nome: string;
  dosagem: string;
  quantidade: number;
  instrucoes: string;
}

export interface Receita {
  id: number;
  medico: MedicoResumo;
  data: string;
  medicamentos: Medicamento[];
  observacoes: string;
}

export interface Acompanhamento {
  id: number;
  receitaId: number;
  medicamento: string;
  dosagem: string;
  dataInicio: string;
  quantidadeTotal: number;
  quantidadeRestante: number;
}

export interface AtivarAcompanhamentoRequest {
  receitaId: number;
  medicamento: string;
  dosagem: string;
  dataInicio: string;
  quantidade: number;
}

export interface PacienteAtendido {
  id: number;
  nome: string;
  dataAtendimento: string;
  local: string;
  motivo: string;
}

export interface FichaPaciente {
  nome: string;
  email: string;
  cpf: string | null;
  dataNascimento: string | null;
  telefone: string | null;
}

export interface AtualizarFichaRequest {
  nome: string;
  cpf: string;
  dataNascimento: string;
  telefone: string | null;
}

export interface PacienteBusca {
  id: number;
  nome: string;
}

export interface NovoAtendimentoRequest {
  pacienteId: number;
  data: string;
  local: string;
  motivo: string;
}

export interface NovaReceitaRequest {
  pacienteId: number;
  medicamentos: Medicamento[];
  observacoes: string;
}
