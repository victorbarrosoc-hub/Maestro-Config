import { ContentPhase } from '@prisma/client';

/**
 * AS FASES DO CARD — a implementação canônica da D-076 no servidor.
 *
 * A D-076 decidiu que existe **um card só**, com **um campo só** de estado: a
 * fase. A coluna do Ensaio é uma LEITURA da fase, nunca um segundo campo. A
 * D-080 resolveu que esse campo é o `ContentPhase` — o antigo `ContentStatus`
 * não conseguia dizer em qual das duas voltas o card estava.
 *
 * O card dá DUAS voltas pelo mesmo ciclo:
 *
 *   1ª volta, o TEXTO:  RASCUNHO → CRIADO → REVISAO  → TEXTO_CLI → TEXTO_OK
 *   2ª volta, a PEÇA:   TEXTO_OK → PRODUCAO → REVISAO2 → POST_CLI → APROVADO
 *
 * `TEXTO_OK` é a dobradiça: é o fim da primeira volta e o começo da segunda.
 * Por isso ela aparece nas duas linhas acima e pertence, aqui, à primeira —
 * é o estado em que o texto ACABOU de ser aprovado e a produção ainda não
 * começou.
 *
 * O que NÃO é fase: "alterações solicitadas". Pedir alteração é um EVENTO —
 * já registrado em `Approval` com a decisão, o autor, o selo e o IP. O efeito
 * dele sobre o card é voltar uma casa (para CRIADO ou PRODUCAO, conforme a
 * volta). Guardar também um estado `CHANGES_REQUESTED` seria a mesma coisa
 * dita duas vezes, que é exatamente o que a D-076 matou.
 *
 * As chaves são as mesmas do protótipo (`texto_cli`, `post_cli`…), em
 * maiúsculas por convenção de enum. A diferença é só de caixa: total,
 * mecânica e sem julgamento — não é tradução de significado, que é o que a
 * D-080 recusou no caminho C.
 */

/** Em qual volta a fase está. A dobradiça `TEXTO_OK` fecha a primeira. */
export const VOLTA: Record<ContentPhase, 1 | 2> = {
  RASCUNHO: 1,
  CRIADO: 1,
  REVISAO: 1,
  TEXTO_CLI: 1,
  TEXTO_OK: 1,
  PRODUCAO: 2,
  REVISAO2: 2,
  POST_CLI: 2,
  APROVADO: 2,
  AGENDADO: 2,
  POSTADO: 2,
  FALHOU: 2,
  CANCELADO: 2,
};

/** Está com o cliente agora: só ele move daqui. */
export const NO_CLIENTE: ContentPhase[] = [ContentPhase.TEXTO_CLI, ContentPhase.POST_CLI];

/** O cliente já decidiu e o card seguiu adiante. */
export const APROVADAS: ContentPhase[] = [
  ContentPhase.APROVADO,
  ContentPhase.AGENDADO,
  ContentPhase.POSTADO,
];

/** Já foi ao ar, ou não vai mais: fase final, ninguém move. */
export const ENCERRADAS: ContentPhase[] = [
  ContentPhase.POSTADO,
  ContentPhase.FALHOU,
  ContentPhase.CANCELADO,
];

/**
 * Para onde vai ao ser enviado ao cliente.
 *
 * A pergunta que o `ContentStatus` não sabia responder: este envio é de texto
 * ou de peça? A fase responde sozinha, porque ela sabe a volta.
 */
export function aoEnviar(fase: ContentPhase): ContentPhase {
  return VOLTA[fase] === 1 ? ContentPhase.TEXTO_CLI : ContentPhase.POST_CLI;
}

/** O cliente aprovou: fim da volta. */
export function aoAprovar(fase: ContentPhase): ContentPhase {
  return fase === ContentPhase.TEXTO_CLI ? ContentPhase.TEXTO_OK : ContentPhase.APROVADO;
}

/** O cliente pediu alteração: volta uma casa, na volta em que está. */
export function aoPedirAlteracao(fase: ContentPhase): ContentPhase {
  return fase === ContentPhase.TEXTO_CLI ? ContentPhase.CRIADO : ContentPhase.PRODUCAO;
}

/**
 * Desfazer a decisão devolve o card à mão do cliente.
 *
 * Aceita tanto a fase de "aprovado" quanto a de "voltou com alteração", porque
 * o desfazer chega depois de a fase já ter mudado.
 */
export function aoDesfazer(fase: ContentPhase): ContentPhase {
  const daPrimeiraVolta = fase === ContentPhase.TEXTO_OK || fase === ContentPhase.CRIADO;
  return daPrimeiraVolta ? ContentPhase.TEXTO_CLI : ContentPhase.POST_CLI;
}
