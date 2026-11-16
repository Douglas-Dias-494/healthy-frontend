# Endpoints que o backend (Spring Boot) precisa ter

Contrato usado pelo frontend. Hoje o front usa dados de mentira (`core/mock/mock-db.ts`);
cada método dos serviços tem um comentário `// API:` com a chamada correspondente.
Os tipos de entrada e saída estão em `src/app/core/models/`.

Base: `http://localhost:8080/api` (`src/app/core/api.config.ts`).
Datas: texto ISO `yyyy-MM-dd` (`LocalDate` no Java).
Autenticação: `Authorization: Bearer <token>` em tudo, exceto login e cadastro
(o `authInterceptor` já anexa o cabeçalho).

## Autenticação (públicos)

| Método | Rota | Corpo | Resposta | Onde o front chama |
|---|---|---|---|---|
| POST | `/auth/login` | `LoginRequest` `{perfil, email, senha}` | 200 `LoginResponse` `{token, id, nome, perfil}` · 401 | `AuthService.login` |
| POST | `/auth/cadastro` | `CadastroRequest` `{perfil, nome, email, senha, crm?, especialidade?}` | 201 · 409 e-mail já existe · 422 dados inválidos | `AuthService.cadastrar` |

## Paciente (token com perfil PACIENTE)

O paciente é identificado pelo **token**, nunca por um id na URL (`/me`).

| Método | Rota | Corpo | Resposta | Onde o front chama |
|---|---|---|---|---|
| GET | `/pacientes/me/atendimentos` | — | `Atendimento[]` (mais recentes primeiro) | `PacienteService.listarAtendimentos` → tela *Meus médicos* |
| GET | `/pacientes/me/receitas` | — | `Receita[]` (só as emitidas/aprovadas) | `PacienteService.listarReceitas` → *Receitas* e *Meus remédios* |
| GET | `/pacientes/me/acompanhamentos` | — | `Acompanhamento[]` | `PacienteService.listarAcompanhamentos` → *Meus remédios* |
| POST | `/pacientes/me/acompanhamentos` | `AtivarAcompanhamentoRequest` | 201 `Acompanhamento` · 409 já em acompanhamento | `PacienteService.ativarAcompanhamento` |
| PATCH | `/pacientes/me/acompanhamentos/{id}/dose` | — | 200 `Acompanhamento` (desconta 1; mínimo 0) | `PacienteService.registrarDose` |
| DELETE | `/pacientes/me/acompanhamentos/{id}` | — | 204 | `PacienteService.encerrarAcompanhamento` |

## Médico (token com perfil MEDICO)

| Método | Rota | Corpo | Resposta | Onde o front chama |
|---|---|---|---|---|
| GET | `/medicos/me/pacientes` | — | `PacienteAtendido[]` | `MedicoService.listarPacientes` → *Meus pacientes* e *Nova receita* |
| POST | `/medicos/me/receitas` | `NovaReceitaRequest` `{pacienteId, medicamentos[], observacoes}` | 201 · 403 paciente não associado · 422 inválido | `MedicoService.emitirReceita` |

## Regras que SÓ o backend pode garantir

- Validar o token e o **perfil** em cada rota (`@PreAuthorize` / Spring Security). Os guards do
  Angular só escondem telas; qualquer pessoa pode chamar a API direto.
- O médico só emite receita para paciente que ele **atendeu** (existe um atendimento entre os dois).
- O paciente só enxerga e altera os **próprios** dados (filtrar sempre pelo usuário do token).
- Senha guardada com hash (BCrypt), nunca em texto puro.
- Validar tudo de novo no servidor (`@Valid`): as validações do formulário são só conforto.
- Receita: `quantidade >= 1`, ao menos 1 medicamento; a data da receita é definida pelo servidor.
- Acompanhamento: `quantidadeRestante` nunca abaixo de 0 e nunca acima de `quantidadeTotal`.

## Tabelas sugeridas (H2/JPA)

`usuario` (id, perfil, nome, email, senha_hash) · `medico` (usuario_id, crm, especialidade) ·
`atendimento` (id, paciente_id, medico_id, data, local, motivo) ·
`receita` (id, paciente_id, medico_id, data, observacoes) ·
`receita_item` (id, receita_id, nome, dosagem, quantidade, instrucoes) ·
`acompanhamento` (id, paciente_id, receita_id, medicamento, dosagem, data_inicio,
quantidade_total, quantidade_restante)
