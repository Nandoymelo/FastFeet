# FastFeet API

API de uma transportadora: administradores cadastram entregadores, destinatários e pedidos; entregadores retiram, entregam (com foto) e devolvem pedidos. O destinatário recebe uma notificação a cada mudança de status.

## Tecnologias

NestJS, Prisma, PostgreSQL, JWT (RS256), Zod e Vitest. O código segue DDD e Clean Architecture:

```
src/
  core/     blocos reutilizáveis (entidades, Either, eventos de domínio, erros)
  domain/   regras de negócio (entidades, casos de uso, contratos de repositório)
  infra/    HTTP, banco, autenticação, armazenamento e eventos
  test/     factories, repositórios em memória e setup dos testes
```

## Como rodar

Requisitos: Node 20.19 ou superior e Docker.

```bash
npm install
cp .env.example .env
```

Gere o par de chaves do JWT e cole cada saída em base64 no `.env`:

```bash
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in private.pem -out public.pem
base64 < private.pem | tr -d '\n'   # JWT_PRIVATE_KEY
base64 < public.pem | tr -d '\n'    # JWT_PUBLIC_KEY
rm private.pem public.pem
```

Suba o banco, aplique as migrations, crie o administrador e inicie a API:

```bash
docker compose up -d
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
npm run start:dev
```

A API fica em `http://localhost:3333`.

O seed cria um administrador para desenvolvimento: CPF `117.569.880-64`, senha `12345`. Não use essas credenciais fora do ambiente local.

## Testes

```bash
npm test           # unitários
npm run test:e2e   # ponta a ponta (precisa do banco no ar)
```

Cada arquivo e2e usa um schema próprio no PostgreSQL, apagado ao final.

## Rotas

Todas, exceto `POST /sessions`, exigem `Authorization: Bearer <token>`. Há exemplos em [client.http](client.http).

| Método | Rota | Quem | Descrição |
|---|---|---|---|
| POST | `/sessions` | público | login com CPF e senha |
| POST | `/deliveryman` | admin | cadastra entregador |
| GET | `/deliveryman?page=` | admin | lista entregadores |
| GET | `/deliveryman/:id` | admin | busca entregador |
| PUT | `/deliveryman/:id` | admin | edita nome e CPF |
| PATCH | `/deliveryman/:id/password` | admin | altera a senha |
| DELETE | `/deliveryman/:id` | admin | remove entregador |
| POST | `/recipient` | admin | cadastra destinatário |
| GET | `/recipient?page=` | admin | lista destinatários |
| GET | `/recipient/:id` | admin | busca destinatário |
| PUT | `/recipient/:id` | admin | edita destinatário |
| DELETE | `/recipient/:id` | admin | remove destinatário sem pedidos |
| POST | `/order` | admin | cria pedido |
| GET | `/order?page=` | admin | lista pedidos |
| GET | `/order/:id` | admin | busca pedido |
| PUT | `/order/:id` | admin | troca o destinatário |
| DELETE | `/order/:id` | admin | remove pedido |
| PATCH | `/order/:id/available` | admin | libera para retirada |
| GET | `/order/nearby?latitude=&longitude=&page=` | entregador | pedidos disponíveis num raio de 10 km |
| GET | `/order/mine?page=` | entregador | pedidos do entregador logado |
| PATCH | `/order/:id/pickup` | entregador | retira o pedido |
| PATCH | `/order/:id/deliver` | entregador | entrega, com a foto no campo `photo` (JPEG ou PNG, até 5 MB) |
| PATCH | `/order/:id/return` | entregador | devolve um pedido entregue por ele |

As listagens trazem 20 itens por página. Em `/order/nearby` e `/order/mine`, cada pedido vem com o destinatário (`recipient`: nome, endereço e coordenadas).

## Ciclo do pedido

`PENDING` → `AVAILABLE` → `PICKED_UP` → `DELIVERED` → `RETURNED`

O status é calculado a partir das datas do pedido. Depois da retirada, o pedido não pode mais ser editado nem removido. Somente quem retirou pode entregar e devolver.

## Erros

| Código | Situação |
|---|---|
| 400 | dados inválidos |
| 401 | token ausente ou inválido |
| 403 | perfil sem permissão |
| 404 | recurso não encontrado |
| 409 | conflito com o estado atual (CPF em uso, transição de status inválida, destinatário com pedidos) |
| 413 / 415 | foto grande demais ou em formato não aceito |

## Limitações conhecidas

- O envio de notificações é simulado: elas são gravadas no banco e escritas no log (`LogNotificationSender`). Não há envio real nem rota para marcá-las como lidas, porque o destinatário não tem login.
- As fotos são salvas em disco local (`uploads/`) e não há rota para baixá-las.
- Remover um entregador mantém os pedidos dele, que ficam sem entregador.
