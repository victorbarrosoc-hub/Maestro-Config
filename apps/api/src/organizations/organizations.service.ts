/**
 * O cadastro da agência — a porta de entrada da plataforma (D-065).
 *
 * Até aqui a Maestro era uma sala trancada: o seed criava uma organização com
 * zero membros, toda rota exigia vínculo e o convite exigia estar logado.
 * Dava para entrar e não havia nada onde entrar.
 *
 * A pessoa chega aqui já autenticada pelo link mágico, e ainda sem
 * organização. Este serviço cria as três coisas que faltavam de uma vez:
 * a organização, o vínculo como administradora e as metodologias de fábrica.
 */

import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { Plan, Role } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { prismaRoot } from '../prisma';
import { ProblemException } from '../common/problem.filter';
import { provisionSystemMethodologies } from './methodologies.provision';

/** Trial de 14 dias, sem cartão (D-057). */
const TRIAL_DAYS = 14;

/**
 * Provedores de e-mail pessoal. Domínio daqui não diz nada sobre a empresa da
 * pessoa, então o aviso de equipe duplicada não se aplica.
 */
const EMAIL_PESSOAL = new Set([
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.com.br', 'outlook.com',
  'outlook.com.br', 'live.com', 'msn.com', 'yahoo.com', 'yahoo.com.br',
  'icloud.com', 'me.com', 'mac.com', 'proton.me', 'protonmail.com',
  'bol.com.br', 'uol.com.br', 'terra.com.br', 'ig.com.br', 'globo.com',
]);

export interface CreateOrganizationInput {
  name: string;
  confirm?: boolean;
}

@Injectable()
export class OrganizationsService {
  /**
   * Cria a agência e coloca quem pediu como administradora.
   *
   * Tudo numa transação: organização sem membro é exatamente o estado que
   * deixou a plataforma inacessível, e ele não pode voltar a existir por uma
   * falha no meio do caminho.
   */
  async create(userId: string, email: string, input: CreateOrganizationInput) {
    if (!input.confirm) {
      const vizinhas = await this.equipesComMesmoDominio(email, userId);
      if (vizinhas.length) throw equipeJaExiste(vizinhas);
    }

    const slug = await this.slugLivre(input.name);

    return prismaRoot.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: input.name.trim(),
          slug,
          plan: Plan.TRIAL,
          trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
        },
      });

      // Quem cria é administradora, e já aceita: não faz sentido convidar
      // a si mesma para a agência que acabou de fundar.
      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId,
          role: Role.AGENCY_ADMIN,
          acceptedAt: new Date(),
        },
      });

      // O cliente estendido (soft delete + escopo) não é atribuível ao tipo de
      // transação do Prisma, embora exponha os mesmos delegates. O cast é local
      // e só afeta a tipagem — a instalação usa `create`, que ambos têm igual.
      await provisionSystemMethodologies(
        tx as unknown as Prisma.TransactionClient,
        organization.id,
        { silencioso: true },
      );

      await tx.auditLog.create({
        data: {
          organizationId: organization.id,
          actorId: userId,
          action: 'organization.created',
          entityType: 'Organization',
          entityId: organization.id,
        },
      });

      return {
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          plan: organization.plan,
          trialEndsAt: organization.trialEndsAt,
        },
        role: Role.AGENCY_ADMIN,
      };
    });
  }

  /**
   * Outras agências que já usam a Maestro com o mesmo domínio de e-mail.
   *
   * Não é vazamento: a pessoa provou controlar um e-mail nesse domínio ao
   * consumir o link mágico. Só enxerga o que é da própria casa.
   */
  private async equipesComMesmoDominio(email: string, userId: string) {
    const dominio = email.split('@')[1]?.toLowerCase();
    if (!dominio || EMAIL_PESSOAL.has(dominio)) return [];

    const membros = await prismaRoot.organizationMember.findMany({
      where: {
        acceptedAt: { not: null },
        userId: { not: userId },
        role: { notIn: [Role.CLIENT, Role.CLIENT_VIEWER] },
        user: { email: { endsWith: `@${dominio}` } },
      },
      select: { organization: { select: { id: true, name: true } } },
      take: 5,
    });

    const vistas = new Map<string, string>();
    for (const m of membros) vistas.set(m.organization.id, m.organization.name);
    return [...vistas].map(([id, name]) => ({ id, name }));
  }

  /** `Studio Norte` → `studio-norte`, `studio-norte-2`… */
  private async slugLivre(nome: string) {
    const base =
      nome
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'agencia';

    for (let i = 0; i < 50; i++) {
      const tentativa = i === 0 ? base : `${base}-${i + 1}`;
      const existe = await prismaRoot.organization.findUnique({
        where: { slug: tentativa },
        select: { id: true },
      });
      if (!existe) return tentativa;
    }

    return `${base}-${Date.now().toString(36)}`;
  }
}

/** Avisa, nunca tranca. Reenviar com `confirm: true` cria assim mesmo (D-065). */
function equipeJaExiste(agencias: Array<{ id: string; name: string }>) {
  const nomes = agencias.map((a) => a.name).join(', ');
  return new ProblemException(HttpStatus.CONFLICT, {
    type: 'https://api.maestro.app/errors/team-already-here',
    title: 'Sua equipe já usa a Maestro',
    detail: `${nomes} já está aqui. Peça um convite a quem administra — assim vocês ficam na mesma conta, com o mesmo histórico.`,
    organizations: agencias,
    // A interface mostra "Criar mesmo assim" e reenvia com confirm.
    canConfirm: true,
  });
}
