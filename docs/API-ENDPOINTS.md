# API do Healthy (Spring Boot)

Todos os endpoints abaixo **estão implementados** no backend e já são usados pelo Angular.
Os tipos de entrada e saída estão em `src/app/core/models/`. Os nomes dos campos do JSON são em
português (contrato com o front); os nomes de classes e métodos Java são em inglês (`@JsonProperty`).

Base: `/api` (`src/environments`: em desenvolvimento `http://localhost:8080/api`).
Datas: texto ISO `yyyy-MM-dd` (`LocalDate` no Java).
Autenticação: `Authorization: Bearer <token>` em tudo, exceto as rotas públicas marcadas abaixo
(o `authInterceptor` anexa o cabeçalho e, se o servidor responder 401, encerra a sessão).
Erros seguem o formato ProblemDetail: `{ status, detail, erros? }`; o front mostra a primeira mensagem de `erros`
(validação) ou o `detail`. **429** significa tentativas demais e traz o cabeçalho `Retry-After` (segundos).

## Autenticação

| Método | Rota | Acesso | Corpo | Resposta |
|---|---|---|---|---|
| POST | `/auth/login` | público | `{perfil, email, senha}` | 200 `{token, id, nome, perfil}` · 400 · 401 · 429 |
| POST | `/auth/cadastro` | público | `{perfil, nome, email, senha, crm?, especialidade?}` | 201 · 400 · 409 e-mail já existe · 429 |
| GET | `/auth/me` | logado | — | 200 `{id, nome, perfil}` · 401 |
| POST | `/auth/esqueci-senha` | público | `{email}` | **202 sempre** (exista a conta ou não) · 429 |
| POST | `/auth/redefinir-senha` | público (link do e-mail) | `{token, novaSenha}` | 204 · 400 link inválido/expirado ou senha fraca · 429 |
| POST | `/auth/alterar-senha` | logado | `{senhaAtual, novaSenha}` | 200 `{token, id, nome, perfil}` (token **novo**) · 400 · 429 |

- **Política de senha:** 8 a 72 caracteres, ao menos uma letra e um número, fora de uma lista de senhas comuns.
- **Trocar ou redefinir a senha encerra todas as sessões antigas.** `alterar-senha` devolve um token novo para a
  sessão atual continuar.
- O link de recuperação vale 30 min e funciona uma vez. Em desenvolvimento ele aparece no log da API.
- Front: `AuthService.login`, `signUp`, `forgotPassword`, `resetPassword`, `changePassword`.

## Paciente (token com perfil PACIENTE; médicos recebem 403)

O paciente é identificado pelo **token**, nunca por um id na URL (`/me`).

| Método | Rota | Corpo | Resposta | Front |
|---|---|---|---|---|
| GET | `/pacientes/me/ficha` | — | `{nome, email, cpf, dataNascimento, telefone}` (os três últimos são `null` até preencher) | `PacienteService.getProfile` |
| PUT | `/pacientes/me/ficha` | `{nome, cpf, dataNascimento, telefone?}` (CPF e telefone só com dígitos) | 200 ficha · 400 (CPF inválido, nascimento futuro...) · 409 CPF de outra conta | `PacienteService.updateProfile` |
| GET | `/pacientes/me/atendimentos` | — | `Atendimento[]` (mais recentes primeiro) | `PacienteService.listAppointments` |
| GET | `/pacientes/me/receitas` | — | `Receita[]` (mais recentes primeiro) | `PacienteService.listPrescriptions` |
| GET | `/pacientes/me/acompanhamentos` | — | `Acompanhamento[]` | `PacienteService.listTrackings` |
| POST | `/pacientes/me/acompanhamentos` | `{receitaId, medicamento, dataInicio, quantidade}` | 201 `Acompanhamento` · 400 · 404 receita de outra pessoa · 409 já em acompanhamento | `PacienteService.startTracking` |
| PATCH | `/pacientes/me/acompanhamentos/{id}/dose` | — | 200 `Acompanhamento` (desconta 1; mínimo 0) · 404 | `PacienteService.registerDose` |
| DELETE | `/pacientes/me/acompanhamentos/{id}` | — | 204 · 404 | `PacienteService.endTracking` |

Detalhes: a `dosagem` é lida da receita (o campo enviado pelo front é ignorado); `quantidade` entre 1 e 1000.
O CPF só é devolvido ao próprio paciente: nunca aparece em nenhuma resposta da área do médico.

## Médico (token com perfil MEDICO; pacientes recebem 403)

| Método | Rota | Corpo | Resposta | Front |
|---|---|---|---|---|
| GET | `/medicos/me/pacientes` | — | `PacienteAtendido[]`: um item por paciente, com o atendimento mais recente | `MedicoService.listPatients` |
| POST | `/medicos/me/pacientes/busca` | `{email}` (no corpo, não na URL) | 200 `{id, nome}` · 404 não é um paciente · 429 (30 buscas/min) | `MedicoService.findPatientByEmail` |
| POST | `/medicos/me/atendimentos` | `{pacienteId, data, local, motivo}` | 201 · 400 (data futura...) · 404 paciente · 409 já registrado | `MedicoService.registerAppointment` |
| POST | `/medicos/me/receitas` | `{pacienteId, medicamentos[], observacoes}` | 201 sem corpo · 400 inválido · 403 paciente não associado | `MedicoService.issuePrescription` |

**Registrar um atendimento é o que associa médico e paciente.** Só depois dele o paciente vê o médico, o médico vê
o paciente na lista e pode emitir receita. A busca devolve só id e nome, e responde igual para "não existe" e
"é um médico". A receita nasce aprovada e a data é a de hoje, definida pelo servidor.

## Regras garantidas pelo backend

- Token e **perfil** validados em cada rota (`SecurityConfig`); os guards do Angular só escondem telas.
- Cada paciente só enxerga e altera os **próprios** dados: toda busca filtra pelo dono, e id de outra pessoa
  responde 404 (não 403), para não revelar que o id existe.
- O médico só emite receita para paciente que **atendeu**.
- Limite de tentativas em login, cadastro, recuperação de senha, troca de senha e busca de paciente (429).
- Senha em hash BCrypt; mensagem de login igual para qualquer falha.
- Tudo é validado de novo no servidor (`@Valid`); o formulário do Angular é só conforto.
- Acompanhamento: o mesmo remédio da mesma receita não se repete (UNIQUE no banco), a quantidade restante nunca
  fica abaixo de 0, e `@Version` impede que duas doses simultâneas se percam (409).
- Mais detalhes e riscos conhecidos: `healthy-backend/docs/SECURITY.md`.

## Tabelas (H2/JPA, criadas pelas migrações Flyway)

`usuarios` (id, perfil, nome, email único, senha_hash, crm, especialidade, token_version) ·
`patients` (id, usuario_id único, cpf único, birth_date, phone) ·
`appointments` (id, patient_id, doctor_id, appointment_date, location, reason; único por médico+paciente+data) ·
`prescriptions` (id, patient_id, doctor_id, prescription_date, notes) ·
`prescription_items` (prescription_id, position, name, dosage, quantity, instructions) ·
`medication_trackings` (id, patient_id, prescription_id, medication_name, dosage, start_date,
total_quantity, remaining_quantity, version) ·
`password_reset_tokens` (id, usuario_id, token_hash único, expires_at, created_at).

## Dados de desenvolvimento

Com `healthy.seed=true` (perfil `dev`) o backend cria 6 usuários (senha `123456`), 5 consultas e 2 receitas quando o
banco está vazio: paciente@healthy.com, jose.almeida@healthy.com, paula.reis@healthy.com (pacientes) e
medico@healthy.com, ana.souza@healthy.com, carlos.lima@healthy.com (médicos).
