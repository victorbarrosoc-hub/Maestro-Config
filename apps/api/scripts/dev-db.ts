/**
 * Banco de desenvolvimento — Postgres de verdade, sem instalar nada.
 *
 * Sobe o PGlite (Postgres compilado para WASM) atrás de um socket TCP que fala
 * o protocolo do Postgres. Do lado de fora é um Postgres comum: o Prisma
 * conecta, roda migration, roda seed e não sabe a diferença.
 *
 * Por que isto existe: até aqui as invariantes eram testadas contra o PGlite
 * em processo, mas os *serviços* nunca executaram uma query. Exigir Docker
 * para destravar isso é atrito que adiou a verificação por quatro blocos de
 * API. Aqui o custo é `npm run db:server`.
 *
 * Não é ambiente de produção e não pretende ser. É o banco que permite
 * descobrir hoje um erro de Prisma que só apareceria no deploy.
 *
 *   npm -w @maestro/api run db:server
 *
 * Os dados ficam em `apps/api/.pglite` e sobrevivem ao restart. Para começar
 * do zero, apague a pasta — ou rode com `--fresh`.
 */

import { rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(HERE, '..', '.pglite');

const PORT = Number(process.env.DEV_DB_PORT ?? 5432);
const HOST = process.env.DEV_DB_HOST ?? '127.0.0.1';

/**
 * O padrão da biblioteca é 1. O Prisma abre um pool, então 1 conexão trava
 * na primeira query concorrente. As queries continuam serializadas por dentro
 * — o PGlite é single-threaded —, mas as conexões não disputam mais.
 */
const MAX_CONNECTIONS = 20;

async function main() {
  if (process.argv.includes('--fresh')) {
    await rm(DATA_DIR, { recursive: true, force: true });
    console.log('· dados anteriores apagados');
  }

  const db = await PGlite.create({ dataDir: DATA_DIR });
  const server = new PGLiteSocketServer({
    db,
    port: PORT,
    host: HOST,
    maxConnections: MAX_CONNECTIONS,
  });

  await server.start();

  console.log(`
  Maestro — banco de desenvolvimento

  ${server.getServerConn()}
  dados em  apps/api/.pglite

  DATABASE_URL="postgresql://postgres:postgres@${HOST}:${PORT}/postgres"

  Ctrl+C para parar.
`);

  const parar = async () => {
    console.log('\n· encerrando');
    await server.stop();
    await db.close();
    process.exit(0);
  };

  process.on('SIGINT', parar);
  process.on('SIGTERM', parar);
}

main().catch((erro) => {
  console.error('falha ao subir o banco de desenvolvimento:', erro);
  process.exit(1);
});
