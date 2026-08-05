/**
 * Seed de desenvolvimento — uma organização com as metodologias de fábrica.
 *
 * A instalação das metodologias vive em `src/organizations/methodologies.provision.ts`,
 * porque o cadastro real de agência depende dela (D-065). Aqui é só o uso de
 * desenvolvimento.
 */

import { PrismaClient } from '@prisma/client';
import { provisionSystemMethodologies } from '../src/organizations/methodologies.provision';

const prisma = new PrismaClient();

async function main() {
  const slug = 'studio-norte';
  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) {
    console.log(`Organização "${slug}" já existe. Nada a fazer.`);
    return;
  }

  const org = await prisma.organization.create({
    data: {
      name: 'Studio Norte',
      slug,
      plan: 'TRIAL',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias (PRICING)
    },
  });

  console.log(`Organização de desenvolvimento criada: ${org.name}`);
  console.log('Metodologias de fábrica:');
  await provisionSystemMethodologies(prisma, org.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
