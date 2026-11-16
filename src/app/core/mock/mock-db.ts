import { Acompanhamento, MedicoResumo, Medicamento } from '../models/clinico.model';

/**
 * "Banco de dados" falso, em memória, só para o front funcionar antes do backend existir.
 * Cada lista equivale a uma TABELA (no futuro, uma @Entity do Spring no H2).
 * Os dados se perdem ao recarregar a página (F5).
 *
 * Quando o backend estiver pronto, este arquivo inteiro pode ser apagado.
 */

export interface PacienteRow {
  id: number;
  nome: string;
}

export interface AtendimentoRow {
  id: number;
  pacienteId: number;
  medicoId: number;
  data: string;
  local: string;
  motivo: string;
}

export interface ReceitaRow {
  id: number;
  pacienteId: number;
  medicoId: number;
  data: string;
  medicamentos: Medicamento[];
  observacoes: string;
}

export interface AcompanhamentoRow extends Acompanhamento {
  pacienteId: number;
}

// Os ids dos usuários de login (Maria = 1, Dr. João = 2) vêm do AuthService.
const medicos: MedicoResumo[] = [
  { id: 2, nome: 'Dr. João', especialidade: 'Clínico Geral', crm: 'CRM-SP 123456' },
  { id: 3, nome: 'Dra. Ana Souza', especialidade: 'Cardiologia', crm: 'CRM-SP 234567' },
  { id: 4, nome: 'Dr. Carlos Lima', especialidade: 'Dermatologia', crm: 'CRM-RJ 345678' },
];

const pacientes: PacienteRow[] = [
  { id: 1, nome: 'Maria' },
  { id: 5, nome: 'José Almeida' },
  { id: 6, nome: 'Paula Reis' },
];

const atendimentos: AtendimentoRow[] = [
  {
    id: 1,
    pacienteId: 1,
    medicoId: 2,
    data: '2026-10-20',
    local: 'Clínica Vida — São Paulo, SP',
    motivo: 'Dor de garganta e febre',
  },
  {
    id: 2,
    pacienteId: 1,
    medicoId: 3,
    data: '2026-09-05',
    local: 'Hospital do Coração — São Paulo, SP',
    motivo: 'Controle de pressão arterial',
  },
  {
    id: 3,
    pacienteId: 1,
    medicoId: 4,
    data: '2026-07-12',
    local: 'Clínica Pele Saudável — Rio de Janeiro, RJ',
    motivo: 'Avaliação de manchas na pele',
  },
  {
    id: 4,
    pacienteId: 5,
    medicoId: 2,
    data: '2026-11-03',
    local: 'Clínica Vida — São Paulo, SP',
    motivo: 'Check-up anual',
  },
  {
    id: 5,
    pacienteId: 6,
    medicoId: 2,
    data: '2026-11-10',
    local: 'Clínica Vida — São Paulo, SP',
    motivo: 'Dor lombar',
  },
];

const receitas: ReceitaRow[] = [
  {
    id: 1,
    pacienteId: 1,
    medicoId: 2,
    data: '2026-10-20',
    medicamentos: [
      {
        nome: 'Dipirona',
        dosagem: '500 mg',
        quantidade: 20,
        instrucoes: '1 comprimido a cada 8 horas, se houver dor ou febre',
      },
      {
        nome: 'Amoxicilina',
        dosagem: '500 mg',
        quantidade: 21,
        instrucoes: '1 cápsula a cada 8 horas, por 7 dias',
      },
    ],
    observacoes: 'Repouso e boa hidratação. Retornar se a febre persistir por mais de 3 dias.',
  },
  {
    id: 2,
    pacienteId: 1,
    medicoId: 3,
    data: '2026-09-05',
    medicamentos: [
      {
        nome: 'Losartana',
        dosagem: '50 mg',
        quantidade: 30,
        instrucoes: '1 comprimido pela manhã, todos os dias',
      },
    ],
    observacoes: 'Medir a pressão semanalmente.',
  },
];

const acompanhamentos: AcompanhamentoRow[] = [];

export const mockDb = { medicos, pacientes, atendimentos, receitas, acompanhamentos };

/** Gera o próximo id de uma "tabela" (o banco de verdade faz isso sozinho). */
export function proximoId(lista: { id: number }[]): number {
  return Math.max(0, ...lista.map((item) => item.id)) + 1;
}

export function buscarMedico(id: number): MedicoResumo {
  return (
    mockDb.medicos.find((m) => m.id === id) ?? { id, nome: 'Médico', especialidade: '—', crm: '—' }
  );
}
