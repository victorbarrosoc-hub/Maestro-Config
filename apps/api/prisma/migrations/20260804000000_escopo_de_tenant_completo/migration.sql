-- Escopo de tenant completo (I-01, D-063)
--
-- O cabeçalho do schema declara: "toda tabela de negócio carrega organizationId
-- como escalar indexado". Sete tabelas não carregavam. Sem a coluna, o cliente
-- Prisma escopado não tem o que filtrar, e a consulta passa direto.
--
-- O furo era alcançável por HTTP: `POST /v1/batch-items/:id/decision` recebe o
-- id pela URL e chamava `batchItem.findUniqueOrThrow` sem escopo, com include
-- de `content`. Um membro da organização A, de posse de um id da organização B,
-- lia título, estado e selo de conteúdo alheio. A escrita já era barrada; a
-- leitura, não.
--
-- Cada coluna é preenchida a partir da tabela-mãe, que sempre teve a etiqueta.
-- Nenhuma linha fica órfã, então a coluna pode virar NOT NULL na sequência.

-- ---------------------------------------------------------------------------
-- 1 · BatchItem — herda do lote
-- ---------------------------------------------------------------------------
ALTER TABLE "BatchItem" ADD COLUMN "organizationId" UUID;

UPDATE "BatchItem" bi
   SET "organizationId" = b."organizationId"
  FROM "Batch" b
 WHERE b."id" = bi."batchId";

ALTER TABLE "BatchItem" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "BatchItem_organizationId_idx" ON "BatchItem"("organizationId");

-- ---------------------------------------------------------------------------
-- 2 · Gate — herda da fase
-- ---------------------------------------------------------------------------
ALTER TABLE "Gate" ADD COLUMN "organizationId" UUID;

UPDATE "Gate" g
   SET "organizationId" = p."organizationId"
  FROM "Phase" p
 WHERE p."id" = g."phaseId";

ALTER TABLE "Gate" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "Gate_organizationId_idx" ON "Gate"("organizationId");

-- ---------------------------------------------------------------------------
-- 3 · ProjectTarget — herda do projeto
-- ---------------------------------------------------------------------------
ALTER TABLE "ProjectTarget" ADD COLUMN "organizationId" UUID;

UPDATE "ProjectTarget" t
   SET "organizationId" = p."organizationId"
  FROM "Project" p
 WHERE p."id" = t."projectId";

ALTER TABLE "ProjectTarget" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "ProjectTarget_organizationId_idx" ON "ProjectTarget"("organizationId");

-- ---------------------------------------------------------------------------
-- 4 · MethodologyTrack — herda da metodologia
-- ---------------------------------------------------------------------------
ALTER TABLE "MethodologyTrack" ADD COLUMN "organizationId" UUID;

UPDATE "MethodologyTrack" t
   SET "organizationId" = m."organizationId"
  FROM "Methodology" m
 WHERE m."id" = t."methodologyId";

ALTER TABLE "MethodologyTrack" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "MethodologyTrack_organizationId_idx" ON "MethodologyTrack"("organizationId");

-- ---------------------------------------------------------------------------
-- 5 · MethodologyPhase — herda da metodologia
-- ---------------------------------------------------------------------------
ALTER TABLE "MethodologyPhase" ADD COLUMN "organizationId" UUID;

UPDATE "MethodologyPhase" f
   SET "organizationId" = m."organizationId"
  FROM "Methodology" m
 WHERE m."id" = f."methodologyId";

ALTER TABLE "MethodologyPhase" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "MethodologyPhase_organizationId_idx" ON "MethodologyPhase"("organizationId");

-- ---------------------------------------------------------------------------
-- 6 · MethodologyGate — herda da fase da metodologia
-- ---------------------------------------------------------------------------
ALTER TABLE "MethodologyGate" ADD COLUMN "organizationId" UUID;

UPDATE "MethodologyGate" g
   SET "organizationId" = f."organizationId"
  FROM "MethodologyPhase" f
 WHERE f."id" = g."phaseId";

ALTER TABLE "MethodologyGate" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "MethodologyGate_organizationId_idx" ON "MethodologyGate"("organizationId");

-- ---------------------------------------------------------------------------
-- 7 · MethodologyDeliverable — herda da fase da metodologia
-- ---------------------------------------------------------------------------
ALTER TABLE "MethodologyDeliverable" ADD COLUMN "organizationId" UUID;

UPDATE "MethodologyDeliverable" d
   SET "organizationId" = f."organizationId"
  FROM "MethodologyPhase" f
 WHERE f."id" = d."phaseId";

ALTER TABLE "MethodologyDeliverable" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "MethodologyDeliverable_organizationId_idx" ON "MethodologyDeliverable"("organizationId");
