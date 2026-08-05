/**
 * As três metodologias de fábrica.
 *
 * `DATA_MODEL.md §Seeds`: toda organização nova recebe estas três, e nada mais.
 * Cliente, projeto e campanha nascem do onboarding.
 *
 * Vive em `src/` e não no seed porque **a criação real de organização depende
 * dela** (D-065). O seed de desenvolvimento passou a ser só um dos usos — e o
 * arquivo de seed instanciava um Prisma próprio, o que daria duas conexões se
 * a API importasse de lá.
 *
 * Recebe o cliente por parâmetro: funciona tanto com o cliente raiz (no seed e
 * no cadastro, quando a organização acabou de nascer) quanto dentro de uma
 * transação.
 */

import { DeliverableKind, ContentFormat, Platform } from '@prisma/client';
import type { Prisma } from '@prisma/client';

type PhaseSeed = {
  order: number;
  name: string;
  label?: string;
  question: string;
  note?: string;
  durationDays: number;
  agendaDays: number;
  agendaReason?: string;
  gate?: { question: string; criteria: string; decidedBy: string };
  deliverables: Array<{
    track: string;
    kind: DeliverableKind;
    label: string;
    output?: string;
    quantity?: number;
    format?: ContentFormat;
    platform?: Platform;
  }>;
};

type MethodologySeed = {
  name: string;
  objective: string;
  question: string;
  signature?: string;
  variables: string[];
  prerequisites: Array<{ label: string; description?: string }>;
  tracks: Array<{ name: string; description?: string; color: string }>;
  phases: PhaseSeed[];
};

const SYSTEM_METHODOLOGIES: MethodologySeed[] = [
  {
    name: 'Social sempre ativo',
    objective: 'Manter presença e autoridade constantes, em ciclos mensais',
    question: 'O que este mês precisa dizer?',
    variables: ['NOME DO CLIENTE'],
    prerequisites: [{ label: 'Perfil com acesso concedido', description: 'Meta Business conectado' }],
    tracks: [
      {
        name: 'Conteúdo',
        description: 'Publicações do mês, do planejamento à veiculação',
        color: 'var(--brass-500)',
      },
    ],
    phases: [
      {
        order: 1,
        name: 'Ciclo mensal',
        question: 'O que este mês precisa dizer?',
        durationDays: 30,
        agendaDays: 1,
        agendaReason: 'alinhamento de pauta e gravação de material',
        deliverables: [
          {
            track: 'Conteúdo',
            kind: DeliverableKind.VOLUME,
            label: 'Reels do mês',
            quantity: 4,
            format: ContentFormat.REELS,
            platform: Platform.INSTAGRAM,
          },
          {
            track: 'Conteúdo',
            kind: DeliverableKind.VOLUME,
            label: 'Carrosséis e posts',
            quantity: 8,
            format: ContentFormat.CAROUSEL,
            platform: Platform.INSTAGRAM,
          },
          {
            track: 'Conteúdo',
            kind: DeliverableKind.MILESTONE,
            label: 'Pauta do mês aprovada',
            output: 'Calendário fechado com o cliente',
          },
        ],
      },
    ],
  },

  {
    name: 'Lançamento 90 dias',
    objective: 'Levar um produto do anúncio ao pós-venda em três fases',
    question: 'O mercado paga por isso, e quanto?',
    variables: ['NOME DO PRODUTO', 'DATA DE ABERTURA'],
    prerequisites: [
      { label: 'Produto definido', description: 'Promessa, público e preço fechados antes de começar' },
    ],
    tracks: [
      { name: 'Conteúdo', description: 'Autoridade e aquecimento da audiência', color: 'var(--brass-500)' },
      { name: 'Ativos de venda', description: 'Página, vídeos e checkout', color: 'var(--cobalt-500)' },
    ],
    phases: [
      {
        order: 1,
        name: 'Aquecimento',
        question: 'A audiência sabe que isso existe?',
        durationDays: 30,
        agendaDays: 2,
        agendaReason: 'gravação do conteúdo de autoridade',
        deliverables: [
          {
            track: 'Conteúdo',
            kind: DeliverableKind.VOLUME,
            label: 'Conteúdo de aquecimento',
            quantity: 12,
            format: ContentFormat.POST,
            platform: Platform.INSTAGRAM,
          },
          {
            track: 'Ativos de venda',
            kind: DeliverableKind.MILESTONE,
            label: 'Página de captura no ar',
            output: 'Lista começa a crescer',
          },
        ],
      },
      {
        order: 2,
        name: 'Abertura',
        label: 'Decisão',
        question: 'O mercado paga antes de a gente entregar?',
        durationDays: 14,
        agendaDays: 1,
        agendaReason: 'gravação dos vídeos de venda',
        gate: {
          question: 'Vale seguir com o formato planejado?',
          criteria: 'Leads captados + vendas na primeira semana',
          decidedBy: 'agency+client',
        },
        deliverables: [
          {
            track: 'Conteúdo',
            kind: DeliverableKind.VOLUME,
            label: 'Conteúdo de carrinho aberto',
            quantity: 10,
            format: ContentFormat.STORY,
            platform: Platform.INSTAGRAM,
          },
          {
            track: 'Ativos de venda',
            kind: DeliverableKind.MILESTONE,
            label: 'Página de vendas e checkout',
            output: 'Carrinho aberto',
          },
        ],
      },
      {
        order: 3,
        name: 'Pós',
        label: 'Chegada',
        question: 'Quem comprou está tendo resultado?',
        durationDays: 46,
        agendaDays: 2,
        agendaReason: 'gravação de depoimentos e conteúdo de entrega',
        deliverables: [
          {
            track: 'Conteúdo',
            kind: DeliverableKind.VOLUME,
            label: 'Prova social e entrega',
            quantity: 8,
            format: ContentFormat.CAROUSEL,
            platform: Platform.INSTAGRAM,
          },
          {
            track: 'Ativos de venda',
            kind: DeliverableKind.MILESTONE,
            label: 'Relatório do ciclo',
            output: 'Base para o próximo lançamento',
          },
        ],
      },
    ],
  },

  {
    name: 'Livre',
    objective: 'Sem fases previstas — para quem ainda não tem método definido',
    question: 'O que estamos tentando alcançar?',
    variables: [],
    prerequisites: [],
    tracks: [{ name: 'Conteúdo', color: 'var(--brass-500)' }],
    phases: [
      {
        order: 1,
        name: 'Contínuo',
        question: 'O que estamos tentando alcançar?',
        note: 'Dá pra definir o método depois — muita agência descobre o dela rodando.',
        durationDays: 365,
        agendaDays: 0,
        deliverables: [],
      },
    ],
  },
];

export async function provisionSystemMethodologies(
  prisma: Prisma.TransactionClient,
  organizationId: string,
  { silencioso = false }: { silencioso?: boolean } = {},
) {
  for (const m of SYSTEM_METHODOLOGIES) {
    const methodology = await prisma.methodology.create({
      data: {
        organizationId,
        name: m.name,
        objective: m.objective,
        question: m.question,
        signature: m.signature,
        variables: m.variables,
        prerequisites: m.prerequisites,
        isSystem: true,
      },
    });

    const trackByName = new Map<string, string>();
    for (const [i, t] of m.tracks.entries()) {
      const track = await prisma.methodologyTrack.create({
        data: {
          organizationId,
          methodologyId: methodology.id,
          name: t.name,
          description: t.description,
          color: t.color,
          order: i + 1,
        },
      });
      trackByName.set(t.name, track.id);
    }

    for (const p of m.phases) {
      const phase = await prisma.methodologyPhase.create({
        data: {
          organizationId,
          methodologyId: methodology.id,
          order: p.order,
          name: p.name,
          label: p.label,
          question: p.question,
          note: p.note,
          durationDays: p.durationDays,
          agendaDays: p.agendaDays,
          agendaReason: p.agendaReason,
        },
      });

      if (p.gate) {
        await prisma.methodologyGate.create({
          data: { organizationId, phaseId: phase.id, ...p.gate },
        });
      }

      for (const [i, d] of p.deliverables.entries()) {
        const trackId = trackByName.get(d.track);
        if (!trackId) throw new Error(`Trilha "${d.track}" não existe em "${m.name}"`);
        await prisma.methodologyDeliverable.create({
          data: {
            organizationId,
            phaseId: phase.id,
            trackId,
            kind: d.kind,
            label: d.label,
            output: d.output,
            quantity: d.quantity,
            format: d.format,
            platform: d.platform,
            order: i + 1,
          },
        });
      }
    }

    if (!silencioso) {
      console.log(`  ✓ ${m.name} — ${m.phases.length} fase(s), ${m.tracks.length} trilha(s)`);
    }
  }
}

