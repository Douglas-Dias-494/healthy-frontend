# Healthy (frontend)

Aplicativo Angular 21 do Healthy: pacientes e médicos mais perto um do outro. A API (Spring Boot) fica no
repositório `healthy-backend`.

## Rodar

```bash
npm install
npm start          # http://localhost:4200
```

Precisa da API rodando em `http://localhost:8080` (`./mvnw spring-boot:run` no backend). Entre com um usuário de
teste (senha `123456`): `paciente@healthy.com` ou `medico@healthy.com`.

> Se você mudar `angular.json` ou os arquivos de `src/environments`, **reinicie** o `npm start`: o servidor só
> lê essas configurações ao iniciar.

## Testes e build

```bash
npm test -- --watch=false
npm run build
```

## Ambientes

O endereço da API vem de `src/environments`:

| Arquivo | Usado em | `apiUrl` |
|---|---|---|
| `environment.development.ts` | `npm start` | `http://localhost:8080/api` |
| `environment.ts` | `npm run build` (produção) | `/api` (mesmo endereço do site, atrás de um proxy reverso) |

## Estrutura

```
src/app
├── core/        sessão (AuthService), guards, interceptor, validadores, modelos, utilitários
├── shared/      layout (Shell), componentes e pipes reutilizáveis
└── features/    auth (login, cadastro, recuperação de senha), paciente, medico
```

Cada área (`paciente`, `medico`) tem rotas próprias carregadas sob demanda e um serviço que fala com a API.

## Documentação

- `docs/API-ENDPOINTS.md`: endpoints usados pelo app.
- Segurança (backend): `healthy-backend/docs/SECURITY.md`. No front: o token JWT fica no navegador
  (`localStorage` se marcar "Lembrar de mim", senão `sessionStorage`) e é anexado só às chamadas da própria API.
