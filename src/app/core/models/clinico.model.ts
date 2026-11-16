/**
 * Contrato de dados do Healthy.
 * Datas viajam como texto ISO "yyyy-MM-dd" (é assim que o Spring serializa LocalDate).
 */

export interface MedicoResumo {
  id: number;
  nome: string;
  especialidade: string;
  crm: string;
}

/** Uma consulta, do ponto de vista do paciente. */
export interface Atendimento {
  id: number;
  medico: MedicoResumo;
  data: string;
  local: string;
}

export interface Medicamento {
  nome: string;
  dosagem: string;
  /** Unidades prescritas (comprimidos, cápsulas...) */
  quantidade: number;
  instrucoes: string;
}

/** Receita digital. Só existe para o paciente depois que o médico a aprova/emite. */
export interface Receita {
  id: number;
  medico: MedicoResumo;
  data: string;
  medicamentos: Medicamento[];
  observacoes: string;
}

/** Acompanhamento de um remédio que o paciente ativou. */
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

/** Uma consulta, do ponto de vista do médico. */
export interface PacienteAtendido {
  id: number;
  nome: string;
  dataAtendimento: string;
  local: string;
  motivo: string;
}

/** Ficha do paciente. cpf, dataNascimento e telefone são null até ele preencher. */
export interface FichaPaciente {
  nome: string;
  email: string;
  cpf: string | null;
  dataNascimento: string | null;
  telefone: string | null;
}

/** CPF e telefone vão só com dígitos (sem máscara). */
export interface AtualizarFichaRequest {
  nome: string;
  cpf: string;
  dataNascimento: string;
  telefone: string | null;
}

/** Resultado da busca de paciente por e-mail: só o necessário para o médico confirmar quem é. */
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
