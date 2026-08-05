/**
 * Testes de HTTP — a API pela porta da frente.
 *
 * Sobe o app de verdade (`createApp()`, a mesma montagem do `main.ts`) numa
 * porta livre, contra um Postgres embutido, e bate nele com `fetch`.
 *
 * Por que existe: os 124 testes anteriores chamavam os serviços direto. Nada
 * exercitava controller, guard, `ValidationPipe`, serialização nem cookie — e
 * foi essa lacuna que deixou passar uma API que **não subia** e um executor
 * que derrubava toda a injeção de dependência do NestJS, devolvendo 500 em
 * toda rota autenticada.
 *
 * ## Por que `.spec.ts` e não `.test.ts`
 *
 * Este arquivo **precisa** rodar sob SWC: o NestJS depende dos metadados de
 * decorator, e o `tsx` (esbuild) não os gera. O `npm test` roda as duas
 * suítes, cada uma no executor que serve para ela. A extensão diferente é o
 * que separa os dois globs — não é estilo, é requisito de execução.
 */

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import type { INestApplication } from '@nestjs/common';

const MIGRATIONS = join(__dirname, '..', 'prisma', 'migrations');

function portaLivre(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address() as { port: number };
      s.close(() => resolve(port));
    });
  });
}

let pg: PGlite;
let dbServer: PGLiteSocketServer;
let app: INestApplication;
let base: string;

let prismaRoot: typeof import('../src/prisma')['prismaRoot'];

/** Uma organização com um administrador aceito, pronta para uso. */
interface Conta {
  orgId: string;
  email: string;
}

before(async () => {
  const portaDb = await portaLivre();

  pg = await PGlite.create();
  const migrations = readdirSync(MIGRATIONS, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  for (const dir of migrations) {
    await pg.exec(readFileSync(join(MIGRATIONS, dir, 'migration.sql'), 'utf8'));
  }

  dbServer = new PGLiteSocketServer({ db: pg, port: portaDb, host: '127.0.0.1', maxConnections: 5 });
  await dbServer.start();

  process.env.DATABASE_URL =
    `postgresql://postgres:postgres@127.0.0.1:${portaDb}/postgres?schema=public&connection_limit=1&pgbouncer=true`;
  process.env.NODE_ENV = 'test';

  ({ prismaRoot } = await import('../src/prisma'));

  const { createApp } = await import('../src/app.factory');
  app = await createApp();
  await app.listen(0);
  base = (await app.getUrl()).replace('[::1]', '127.0.0.1') + '/v1';
});

after(async () => {
  await app?.close();
  await dbServer?.stop();
  await pg?.close();
});

/** Cria organização e um administrador já aceito. */
async function contaComAdmin(sufixo: string): Promise<Conta> {
  const org = await prismaRoot.organization.create({
    data: { name: `Studio ${sufixo}`, slug: `studio-${sufixo}` },
  });
  const email = `admin-${sufixo}@exemplo.com`;
  const user = await prismaRoot.user.create({ data: { email, name: 'Victor' } });
  await prismaRoot.organizationMember.create({
    data: {
      organizationId: org.id,
      userId: user.id,
      role: 'AGENCY_ADMIN',
      acceptedAt: new Date(),
    },
  });
  return { orgId: org.id, email };
}

/** Faz o percurso real do login: pede o link, consome o token, guarda o cookie. */
async function entrar(email: string): Promise<string> {
  const pedido = await fetch(`${base}/auth/magic-link`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const { token } = (await pedido.json()) as { token: string };

  const sessao = await fetch(`${base}/auth/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  const cookie = sessao.headers.getSetCookie().find((c) => c.startsWith('maestro_session='));
  assert.ok(cookie, 'a sessão precisa vir por cookie');
  return cookie.split(';')[0]!;
}

// ============================================================================

describe('o app sobe e responde', () => {
  test('rota inexistente devolve 404 em Problem Details', async () => {
    const r = await fetch(`${base}/nao-existe`);
    assert.equal(r.status, 404);
    assert.match(r.headers.get('content-type') ?? '', /problem\+json/);
  });

  test('a injeção de dependência do NestJS funciona', async () => {
    // Se o guard subir sem `reflector`, isto vira 500 — foi o que aconteceu
    // sob `tsx`. Este teste é a trava contra a volta desse executor.
    const r = await fetch(`${base}/clients`);
    assert.notEqual(r.status, 500, 'guard sem dependências injetadas devolve 500');
  });
});

describe('negar por padrão (a regra do guard)', () => {
  test('sem sessão, rota protegida devolve 403 legível', async () => {
    const r = await fetch(`${base}/clients`);
    assert.equal(r.status, 403);

    const p = (await r.json()) as { title: string; detail: string; type: string };
    assert.match(p.type, /forbidden/);
    // UX_WRITING: o que aconteceu + o que fazer. Nunca stack trace.
    assert.match(p.title, /permissão/);
    assert.match(p.detail, /Entre de novo/);
  });

  test('cookie inválido não passa', async () => {
    const r = await fetch(`${base}/clients`, {
      headers: { cookie: 'maestro_session=inventado' },
    });
    assert.equal(r.status, 403);
  });

  test('o erro nunca vaza stack trace, SQL ou nome de tabela', async () => {
    const corpo = await (await fetch(`${base}/clients`)).text();
    for (const proibido of ['at ', 'SELECT', 'prisma', 'Organization', '.ts:']) {
      assert.ok(!corpo.includes(proibido), `vazou "${proibido}" na resposta`);
    }
  });
});

describe('link mágico e sessão (D-027)', () => {
  test('responde igual para e-mail que não existe — não confirmamos quem tem conta', async () => {
    const r = await fetch(`${base}/auth/magic-link`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ninguem@exemplo.com' }),
    });
    assert.ok(r.ok);
    const corpo = (await r.json()) as { sent: boolean };
    assert.equal(corpo.sent, true);
  });

  test('o percurso completo entrega uma sessão por cookie httpOnly', async () => {
    const conta = await contaComAdmin('login');

    const pedido = await fetch(`${base}/auth/magic-link`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: conta.email }),
    });
    const { token } = (await pedido.json()) as { token: string };

    const sessao = await fetch(`${base}/auth/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    assert.ok(sessao.ok);

    const cookie = sessao.headers.getSetCookie().find((c) => c.startsWith('maestro_session='));
    assert.ok(cookie, 'sem cookie não há sessão');
    assert.match(cookie, /HttpOnly/i, 'o JavaScript da página nunca lê o token');

    const corpo = (await sessao.json()) as { sessionToken?: string; memberships: unknown[] };
    assert.equal(corpo.sessionToken, undefined, 'o token não volta no corpo, só no cookie');
    assert.equal(corpo.memberships.length, 1);
  });

  test('o token do link é de uso único (I-20)', async () => {
    const conta = await contaComAdmin('uso-unico');

    const pedido = await fetch(`${base}/auth/magic-link`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: conta.email }),
    });
    const { token } = (await pedido.json()) as { token: string };

    const corpo = JSON.stringify({ token });
    const cabecalho = { 'content-type': 'application/json' };

    const primeira = await fetch(`${base}/auth/session`, { method: 'POST', headers: cabecalho, body: corpo });
    assert.ok(primeira.ok);

    const segunda = await fetch(`${base}/auth/session`, { method: 'POST', headers: cabecalho, body: corpo });
    assert.equal(segunda.status, 410, 'o segundo uso precisa ser recusado');
  });

  test('token inventado devolve 410, não 500', async () => {
    const r = await fetch(`${base}/auth/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'nao-existe' }),
    });
    assert.equal(r.status, 410);
  });
});

describe('sessão válida, escopo de organização', () => {
  test('/auth/me devolve usuário, organização e papel', async () => {
    const conta = await contaComAdmin('me');
    const cookie = await entrar(conta.email);

    const r = await fetch(`${base}/auth/me`, {
      headers: { cookie, 'x-maestro-organization': conta.orgId },
    });
    assert.equal(r.status, 200);

    const corpo = (await r.json()) as {
      user: { email: string };
      organization: { id: string };
      role: string;
    };
    assert.equal(corpo.user.email, conta.email);
    assert.equal(corpo.organization.id, conta.orgId);
    assert.equal(corpo.role, 'AGENCY_ADMIN');
  });

  test('sessão de uma organização não acessa outra (I-01 na borda HTTP)', async () => {
    const a = await contaComAdmin('borda-a');
    const b = await contaComAdmin('borda-b');
    const cookie = await entrar(a.email);

    const r = await fetch(`${base}/auth/me`, {
      headers: { cookie, 'x-maestro-organization': b.orgId },
    });
    assert.equal(r.status, 403, 'sem vínculo, não entra — nem com sessão válida');
  });

  test('criar cliente funciona e já nasce isolado', async () => {
    const a = await contaComAdmin('cli-a');
    const b = await contaComAdmin('cli-b');

    const cookieA = await entrar(a.email);
    const criado = await fetch(`${base}/clients`, {
      method: 'POST',
      headers: { cookie: cookieA, 'x-maestro-organization': a.orgId, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Loja Norte' }),
    });
    assert.ok(criado.ok, `esperava sucesso, veio ${criado.status}`);

    const cookieB = await entrar(b.email);
    const listaB = await fetch(`${base}/clients`, {
      headers: { cookie: cookieB, 'x-maestro-organization': b.orgId },
    });
    const clientesB = (await listaB.json()) as unknown[];
    assert.equal(clientesB.length, 0, 'a organização B não pode ver o cliente da A');
  });
});

describe('a porta de entrada — fundar a agência (D-065)', () => {
  /** Entra sem passar por `contaComAdmin`: é gente nova, sem organização. */
  async function entrarSemAgencia(email: string) {
    const pedido = await fetch(`${base}/auth/magic-link`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const { token } = (await pedido.json()) as { token: string };
    const sessao = await fetch(`${base}/auth/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const corpo = (await sessao.json()) as { memberships: unknown[] };
    assert.equal(corpo.memberships.length, 0, 'esta pessoa ainda não tem agência');
    return sessao.headers.getSetCookie().find((c) => c.startsWith('maestro_session='))!.split(';')[0]!;
  }

  async function fundar(cookie: string, name: string, confirm?: boolean) {
    return fetch(`${base}/organizations`, {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify(confirm === undefined ? { name } : { name, confirm }),
    });
  }

  test('sem sessão nenhuma, não funda nada', async () => {
    const r = await fundar('maestro_session=inventado', 'Agência Fantasma');
    assert.equal(r.status, 403);
  });

  test('quem acabou de entrar consegue fundar a agência', async () => {
    const cookie = await entrarSemAgencia('victor@fundar-um.com');

    const r = await fundar(cookie, 'Studio Norte');
    // `clone()` porque o corpo só pode ser lido uma vez, e a mensagem de falha
    // precisa dele tanto quanto a asserção seguinte.
    assert.ok(r.ok, `esperava sucesso, veio ${r.status}: ${await r.clone().text()}`);

    const corpo = (await r.json()) as {
      organization: { id: string; slug: string; plan: string; trialEndsAt: string };
      role: string;
    };

    assert.equal(corpo.role, 'AGENCY_ADMIN', 'quem funda administra');
    assert.equal(corpo.organization.slug, 'studio-norte');
    assert.equal(corpo.organization.plan, 'TRIAL');

    // Trial de 14 dias sem cartão (D-057).
    const dias = Math.round(
      (new Date(corpo.organization.trialEndsAt).getTime() - Date.now()) / 86_400_000,
    );
    assert.equal(dias, 14);
  });

  test('a agência já nasce com as três metodologias de fábrica', async () => {
    const cookie = await entrarSemAgencia('victor@fundar-dois.com');
    const r = await fundar(cookie, 'Studio Sul');
    const { organization } = (await r.json()) as { organization: { id: string } };

    const metodologias = await prismaRoot.methodology.findMany({
      where: { organizationId: organization.id },
      select: { name: true, isSystem: true },
    });

    assert.equal(metodologias.length, 3, 'ninguém começa em tela vazia');
    assert.ok(metodologias.every((m) => m.isSystem));
    assert.ok(metodologias.some((m) => m.name === 'Social sempre ativo'));
  });

  test('logo depois de fundar, já dá para usar a plataforma', async () => {
    const cookie = await entrarSemAgencia('victor@fundar-tres.com');
    const criada = await fundar(cookie, 'Studio Leste');
    const { organization } = (await criada.json()) as { organization: { id: string } };

    // O teste que faltava: ontem este passo devolvia 403 e não havia saída.
    const cliente = await fetch(`${base}/clients`, {
      method: 'POST',
      headers: {
        cookie,
        'x-maestro-organization': organization.id,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ name: 'Loja Norte' }),
    });

    assert.ok(cliente.ok, `criar cliente logo após fundar: veio ${cliente.status}`);
  });

  test('nome de agência repetido não colide no endereço', async () => {
    const a = await entrarSemAgencia('ana@fundar-repetido-a.com');
    const b = await entrarSemAgencia('bruno@fundar-repetido-b.com');

    const um = await fundar(a, 'Agência Igual');
    const dois = await fundar(b, 'Agência Igual');

    const p1 = (await um.json()) as { organization: { slug: string } };
    const p2 = (await dois.json()) as { organization: { slug: string } };

    assert.equal(p1.organization.slug, 'agencia-igual');
    assert.equal(p2.organization.slug, 'agencia-igual-2');
  });

  test('mesmo domínio de e-mail avisa, mas não tranca', async () => {
    const primeiro = await entrarSemAgencia('victor@studionorte-teste.com');
    await fundar(primeiro, 'Studio Norte Teste');

    const colega = await entrarSemAgencia('maria@studionorte-teste.com');

    const aviso = await fundar(colega, 'Studio Norte Teste 2');
    assert.equal(aviso.status, 409, 'a colega precisa ser avisada');

    const p = (await aviso.json()) as { title: string; detail: string; canConfirm: boolean };
    assert.match(p.title, /já usa a Maestro/);
    assert.match(p.detail, /convite/);
    assert.equal(p.canConfirm, true, 'o aviso precisa oferecer o caminho de seguir');

    // E seguir tem que funcionar — o aviso avisa, nunca tranca.
    const insistindo = await fundar(colega, 'Studio Norte Teste 2', true);
    assert.ok(insistindo.ok, `confirmar deveria criar, veio ${insistindo.status}`);
  });

  test('e-mail pessoal não dispara o aviso — gmail não é empresa', async () => {
    const um = await entrarSemAgencia('victor.pessoal@gmail.com');
    await fundar(um, 'Agência do Victor');

    const outro = await entrarSemAgencia('maria.pessoal@gmail.com');
    const r = await fundar(outro, 'Agência da Maria');

    assert.ok(r.ok, 'duas pessoas com gmail não são a mesma equipe');
  });

  test('nome vazio é recusado com mensagem legível', async () => {
    const cookie = await entrarSemAgencia('victor@fundar-vazio.com');
    const r = await fundar(cookie, '');

    assert.equal(r.status, 400);
    const p = (await r.json()) as { detail: string };
    assert.match(p.detail, /nome da sua agência/i);
  });
});

describe('o corpo da requisição não manda no tenant', () => {
  test('organizationId no corpo não sobrepõe o da sessão', async () => {
    const a = await contaComAdmin('corpo-a');
    const b = await contaComAdmin('corpo-b');
    const cookie = await entrar(a.email);

    const r = await fetch(`${base}/clients`, {
      method: 'POST',
      headers: { cookie, 'x-maestro-organization': a.orgId, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Invasor', organizationId: b.orgId }),
    });

    // Recusar é o ideal; aceitar ignorando o campo é aceitável. Gravar na
    // organização B, nunca.
    if (r.ok) {
      const criado = (await r.json()) as { organizationId?: string };
      assert.notEqual(criado.organizationId, b.orgId, 'gravou na organização errada');
    }

    const naB = await prismaRoot.client.findMany({ where: { organizationId: b.orgId } });
    assert.equal(naB.length, 0, 'nenhum cliente pode ter caído na organização B');
  });

  test('campo inesperado é recusado com 4xx, não com erro de servidor', async () => {
    const a = await contaComAdmin('recusa-a');
    const b = await contaComAdmin('recusa-b');
    const cookie = await entrar(a.email);

    const r = await fetch(`${base}/clients`, {
      method: 'POST',
      headers: { cookie, 'x-maestro-organization': a.orgId, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Invasor', organizationId: b.orgId }),
    });

    assert.ok(r.status >= 400 && r.status < 500, `esperava 4xx, veio ${r.status}`);
  });
});

describe('validação da entrada', () => {
  test('corpo vazio não derruba o servidor', async () => {
    const a = await contaComAdmin('vazio');
    const cookie = await entrar(a.email);

    const r = await fetch(`${base}/clients`, {
      method: 'POST',
      headers: { cookie, 'x-maestro-organization': a.orgId, 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    assert.ok(r.status >= 400 && r.status < 500, `campo obrigatório ausente: esperava 4xx, veio ${r.status}`);

    // RFC 9457: `title` e `detail` são texto, nunca lista. E precisam ser
    // exibíveis ao usuário — UX_WRITING pede o que aconteceu + o que fazer.
    const p = (await r.json()) as { title: unknown; detail?: unknown; errors?: unknown };
    assert.equal(typeof p.title, 'string', `title veio como ${typeof p.title}: ${JSON.stringify(p.title)}`);
    assert.equal(typeof p.detail, 'string', 'detail precisa dizer o que corrigir');
    assert.match(String(p.detail), /nome/i, 'a mensagem precisa apontar o campo');
  });

  test('tipo errado não derruba o servidor', async () => {
    const a = await contaComAdmin('tipo');
    const cookie = await entrar(a.email);

    const r = await fetch(`${base}/clients`, {
      method: 'POST',
      headers: { cookie, 'x-maestro-organization': a.orgId, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 12345 }),
    });

    assert.ok(r.status >= 400 && r.status < 500, `nome numérico: esperava 4xx, veio ${r.status}`);
  });
});
