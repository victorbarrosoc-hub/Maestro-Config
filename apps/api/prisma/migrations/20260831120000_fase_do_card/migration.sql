-- D-080 · a fase substitui o status.
--
-- O ContentStatus tinha oito valores e quatro deles eram ambíguos entre as
-- duas voltas do card (D-076): um AWAITING_APPROVAL só não distingue "com o
-- cliente pelo texto" de "com o cliente pela peça". A fase distingue, porque
-- ela É a posição no ciclo.
--
-- O aterro não perde nada, e a razão é exata: o modelo antigo só conseguia
-- expressar a SEGUNDA volta. A primeira — o ciclo do texto — é conceito novo,
-- que o ContentStatus nunca representou. Então todo registro existente é, por
-- definição, de segunda volta, e o mapa abaixo é uma bijeção sobre o que havia.
--
-- CHANGES_REQUESTED não vira fase: vira PRODUCAO, que é onde o card fica
-- depois de o cliente pedir alteração. O pedido em si continua onde sempre
-- esteve e onde é auditável: a linha em "Approval".

CREATE TYPE "ContentPhase" AS ENUM (
  'RASCUNHO', 'CRIADO', 'REVISAO', 'TEXTO_CLI', 'TEXTO_OK',
  'PRODUCAO', 'REVISAO2', 'POST_CLI', 'APROVADO', 'AGENDADO', 'POSTADO',
  'FALHOU', 'CANCELADO'
);

CREATE TYPE "StrategyStatus" AS ENUM (
  'DRAFT', 'AWAITING_APPROVAL', 'CHANGES_REQUESTED', 'APPROVED'
);

-- ---------- Content.status → Content.phase ----------
ALTER TABLE "Content" ADD COLUMN "phase" "ContentPhase" NOT NULL DEFAULT 'RASCUNHO';

UPDATE "Content" SET "phase" = CASE "status"
  WHEN 'DRAFT'             THEN 'RASCUNHO'::"ContentPhase"
  WHEN 'IN_PRODUCTION'     THEN 'PRODUCAO'::"ContentPhase"
  WHEN 'AWAITING_APPROVAL' THEN 'POST_CLI'::"ContentPhase"
  WHEN 'CHANGES_REQUESTED' THEN 'PRODUCAO'::"ContentPhase"
  WHEN 'APPROVED'          THEN 'APROVADO'::"ContentPhase"
  WHEN 'SCHEDULED'         THEN 'AGENDADO'::"ContentPhase"
  WHEN 'PUBLISHED'         THEN 'POSTADO'::"ContentPhase"
  WHEN 'FAILED'            THEN 'FALHOU'::"ContentPhase"
END;

DROP INDEX IF EXISTS "Content_campaignId_status_idx";
DROP INDEX IF EXISTS "Content_organizationId_status_idx";
ALTER TABLE "Content" DROP COLUMN "status";

CREATE INDEX "Content_campaignId_phase_idx"     ON "Content"("campaignId", "phase");
CREATE INDEX "Content_organizationId_phase_idx" ON "Content"("organizationId", "phase");

-- ---------- Project.strategyStatus ganha enum próprio ----------
-- Ela pegava carona no ContentStatus e herdava cinco valores que nunca fizeram
-- sentido para uma estratégia. Os quatro que usava atravessam com o mesmo nome.
ALTER TABLE "Project" ALTER COLUMN "strategyStatus" DROP DEFAULT;
ALTER TABLE "Project" ALTER COLUMN "strategyStatus" TYPE "StrategyStatus"
  USING (CASE "strategyStatus"::text
    WHEN 'DRAFT'             THEN 'DRAFT'
    WHEN 'AWAITING_APPROVAL' THEN 'AWAITING_APPROVAL'
    WHEN 'CHANGES_REQUESTED' THEN 'CHANGES_REQUESTED'
    WHEN 'APPROVED'          THEN 'APPROVED'
    ELSE 'DRAFT'
  END)::"StrategyStatus";
ALTER TABLE "Project" ALTER COLUMN "strategyStatus" SET DEFAULT 'DRAFT';


-- ---------- os gatilhos que liam Content."status" ----------
-- Sem isto o DROP COLUMN acima derruba invariantes em silêncio. Os dois são
-- reescritos, e um deles GANHA alcance: o I-05 agora protege também a
-- aprovação do TEXTO, que o status antigo nem sabia expressar.

-- I-05 e I-06 · conteúdo alterado derruba a aprovação (D-032).
CREATE OR REPLACE FUNCTION maestro_drop_approval_on_change() RETURNS trigger AS $$
DECLARE
  nova "ContentPhase";
BEGIN
  IF NEW."currentVersionId" IS DISTINCT FROM OLD."currentVersionId" THEN
    -- a peça aprovada volta para produção; o texto aprovado volta para a mesa
    IF    OLD."phase" IN ('APROVADO', 'AGENDADO') THEN nova := 'PRODUCAO';
    ELSIF OLD."phase" = 'TEXTO_OK'                THEN nova := 'CRIADO';
    ELSE  RETURN NEW;
    END IF;

    NEW."phase" := nova;

    INSERT INTO "AuditLog" (
      "id", "organizationId", "actorId", "action",
      "entityType", "entityId", "before", "after", "reason", "createdAt"
    ) VALUES (
      gen_random_uuid(), NEW."organizationId", NEW."updatedById", 'content.approval-dropped',
      'Content', NEW."id",
      jsonb_build_object('phase', OLD."phase", 'versionId', OLD."currentVersionId"),
      jsonb_build_object('phase', NEW."phase", 'versionId', NEW."currentVersionId"),
      'Conteúdo alterado depois de aprovado (I-05)', now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- I-07 · publicação exige conteúdo aprovado (D-022).
CREATE OR REPLACE FUNCTION maestro_publication_guard() RETURNS trigger AS $$
DECLARE
  fase TEXT;
BEGIN
  SELECT "phase"::TEXT INTO fase FROM "Content" WHERE "id" = NEW."contentId";
  IF fase NOT IN ('APROVADO', 'AGENDADO', 'POSTADO') THEN
    RAISE EXCEPTION
      'Publicação exige conteúdo aprovado. Fase atual: %', fase
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- o índice parcial da fila quente seguia o valor antigo
DROP INDEX IF EXISTS idx_content_awaiting;
CREATE INDEX idx_content_awaiting
  ON "Content" ("organizationId", "phase", "updatedAt")
  WHERE "phase" IN ('TEXTO_CLI', 'POST_CLI') AND "deletedAt" IS NULL;

DROP TYPE "ContentStatus";
