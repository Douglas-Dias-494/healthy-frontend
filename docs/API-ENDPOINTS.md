# API do Healthy (Spring Boot)

Todos os endpoints abaixo **estão implementados** no backend e já são usados pelo Angular.
Os tipos de entrada e saída estão em `src/app/core/models/`. Os nomes dos campos do JSON são em
português (contrato com o front); os nomes de classes e métodos Java são em inglês (`@JsonProperty`).

Base: `http://localhost:8080/api` (`src/app/core/api.config.ts`).
Datas: texto ISO `yyyy-MM-dd` (`LocalDate` no Java).
Autenticação: `Authorization: Bearer <token>` em tudo, exceto login e cadastro
(o `authInterceptor` anexa o cabeçalho e, se o servidor responder 401, encerra a sessão).
Erros seguem o formato ProblemDetail: `{ status, detail, erros? }`; o front mostra o `detail`.

## Autenticação

| Método | Rota | Acesso | Corpo | Resposta |
|---|---|---|---|---|
| POST | `/auth/login` | público | `{perfil, email, senha}` | 200 `{token, id, nome, perfil}` · 400 · 401 |
| POST | `/auth/cadastro` | público | `{perfil, nome, email, senha, crm?, especialidade?}` | 201 · 400 · 409 e-mail já existe |
| GET | `/auth/me` | logado | — | 200 `{id, nome, perfil}` · 401 |

Front: `AuthService.login`, `AuthService.signUp`.

## Paciente (token com perfil PACIENTE; médicos recebem 403)

O paciente é identificado pelo **token**, nunca por um id na URL (`/me`).

| Método | Rota | Corpo | Resposta | Front |
|---|---|---|---|---|
| GET | `/pacientes/me/atendimentos` | — | `Atendimento[]` (mais recentes primeiro) | `PacienteService.listAppointments` |
| GET | `/pacientes/me/receitas` | — | `Receita[]` (mais recentes primeiro) | `PacienteService.listPrescriptions` |
| GET | `/pacientes/me/acompanhamentos` | — | `Acompanhamento[]` | `PacienteService.listTrackings` |
| POST | `/pacientes/me/acompanhamentos` | `{receitaId, medicamento, dataInicio, quantidade}` | 201 `Acompanhamento` · 400 · 404 receita de outra pessoa · 409 já em acompanhamento | `PacienteService.startTracking` |
| PATCH | `/pacientes/me/acompanhamentos/{id}/dose` | — | 200 `Acompanhamento` (desconta 1; mínimo 0) · 404 | `PacienteService.registerDose` |
| DELETE | `/pacientes/me/acompanhamentos/{id}` | — | 204 · 404 | `PacienteService.endTracking` |

Detalhes: a `dosagem` é lida da receita (o campo enviado pelo front é ignorado); `quantidade` entre 1 e 1000.

## Médico (token com perfil MEDICO; pacientes recebem 403)

| Método | Rota | Corpo | Resposta | Front |
|---|---|---|---|---|
| GET | `/medicos/me/pacientes` | — | `PacienteAtendido[]`: um item por paciente, com o atendimento mais recente | `MedicoService.listPatients` |
| POST | `/medicos/me/receitas` | `{pacienteId, medicamentos[], observacoes}` | 201 sem corpo · 400 inválido · 403 paciente não associado | `MedicoService.issuePrescription` |

A receita nasce aprovada (o médico a emite) e a data é a de hoje, definida pelo servidor.

## Regras garantidas pelo backend

- Token e **perfil** validados em cada rota (`SecurityConfig`); os guards do Angular só escondem telas.
- Rotas públicas (login e cadastro) ignoram o cabeçalho `Authorization`, para um token vencido não bloquear o login.
- O médico só emite receita para paciente que **atendeu**.
- Cada paciente só enxerga e altera os **próprios** dados: toda busca filtra pelo dono, e id de outra pessoa
  responde 404 (não 403), para não revelar que o id existe.
- Senha em hash BCrypt; mensagem de login igual para qualquer falha.
- Tudo é validado de novo no servidor (`@Valid`); o formulário do Angular é só conforto.
- Acompanhamento: o mesmo remédio da mesma receita não se repete (restrição UNIQUE no banco), a quantidade
  restante nunca fica abaixo de 0, e `@Version` impede que duas doses simultâneas se percam (409).

## Tabelas (H2/JPA)

`usuarios` (id, perfil, nome, email único, senha_hash, crm, especialidade) ·
`appointments` (id, patient_id, doctor_id, appointment_date, location, reason) ·
`prescriptions` (id, patient_id, doctor_id, prescription_date, notes) ·
`prescription_items` (prescription_id, position, name, dosage, quantity, instructions) ·
`medication_trackings` (id, patient_id, prescription_id, medication_name, dosage, start_date,
total_quantity, remaining_quantity, version) · `patients` (perfil clínico, ainda sem ligação com `usuarios`).

## Dados de desenvolvimento

Com `healthy.seed=true` o backend cria 6 usuários (senha `123456`), 5 consultas e 2 receitas quando o banco
está vazio: paciente@healthy.com, jose.almeida@healthy.com, paula.reis@healthy.com (pacientes) e
medico@healthy.com, ana.souza@healthy.com, carlos.lima@healthy.com (médicos).
