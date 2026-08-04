-- Invariantes no nível do banco.
-- Ver docs/ENGINEERING/DATA_MODEL.md §Invariantes.
--
-- Estas regras NÃO vivem só na aplicação. Um bug de serviço, um script de
-- manutenção ou um psql aberto às duas da manhã não podem furá-las.

-- ============================================================================
-- I-02 · ContentVersion é imutável
-- ============================================================================
-- Toda mudança de conteúdo cria versão nova (D-007). Sem isso, o selo e o
-- termo de aprovação não valem nada — o passado poderia ser reescrito.

CREATE OR REPLACE FUNCTION maestro_block_update() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION
    '% é imutável: crie um novo registro em vez de atualizar (invariante do produto)',
    TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_version_immutable
  BEFORE UPDATE ON "ContentVersion"
  FOR EACH ROW EXECUTE FUNCTION maestro_block_update();

CREATE TRIGGER script_block_immutable
  BEFORE UPDATE ON "ScriptBlock"
  FOR EACH ROW EXECUTE FUNCTION maestro_block_update();

CREATE TRIGGER asset_immutable
  BEFORE UPDATE ON "Asset"
  FOR EACH ROW EXECUTE FUNCTION maestro_block_update();

-- ============================================================================
-- I-03 · AuditLog é append-only
-- ============================================================================
-- Regra #6: nada pode ser perdido. A única forma de cumprir isso é tirar de
-- todo mundo a permissão de perder.

CREATE OR REPLACE FUNCTION maestro_block_write() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION
    '% é append-only: UPDATE e DELETE não são permitidos',
    TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_append_only
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION maestro_block_write();

CREATE TRIGGER approval_term_append_only
  BEFORE UPDATE OR DELETE ON "ApprovalTerm"
  FOR EACH ROW EXECUTE FUNCTION maestro_block_write();

-- ============================================================================
-- I-04 · Approval só aceita UPDATE em undoneAt e notifiedAt
-- ============================================================================
-- Desfazer nunca apaga: marca. E a janela de resfriamento precisa poder
-- registrar que a notificação saiu (D-025).

CREATE OR REPLACE FUNCTION maestro_approval_guard() RETURNS trigger AS $$
BEGIN
  IF ROW(NEW."id", NEW."organizationId", NEW."contentId", NEW."versionId",
         NEW."batchId", NEW."decision", NEW."decidedById", NEW."seal",
         NEW."ip", NEW."userAgent", NEW."device",
         NEW."isOffline", NEW."offlineById", NEW."notifyAfter", NEW."createdAt")
     IS DISTINCT FROM
     ROW(OLD."id", OLD."organizationId", OLD."contentId", OLD."versionId",
         OLD."batchId", OLD."decision", OLD."decidedById", OLD."seal",
         OLD."ip", OLD."userAgent", OLD."device",
         OLD."isOffline", OLD."offlineById", OLD."notifyAfter", OLD."createdAt")
  THEN
    RAISE EXCEPTION
      'Approval só aceita alteração em undoneAt e notifiedAt'
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER approval_guard
  BEFORE UPDATE ON "Approval"
  FOR EACH ROW EXECUTE FUNCTION maestro_approval_guard();

-- ============================================================================
-- I-05 e I-06 · Conteúdo alterado derruba a aprovação
-- ============================================================================
-- A invariante central do produto (D-032).
--
-- Como ContentVersion é imutável, alterar um conteúdo aprovado obrigatoriamente
-- cria uma versão nova. Quando currentVersionId muda, a aprovação passa a
-- apontar para uma versão que não é mais a atual — e o status precisa cair.
--
-- Isto é o que transforma "o que foi aprovado é o que vai ao ar" de promessa
-- em propriedade do sistema. Não depende de nenhum serviço lembrar de fazer.

CREATE OR REPLACE FUNCTION maestro_drop_approval_on_change() RETURNS trigger AS $$
BEGIN
  IF NEW."currentVersionId" IS DISTINCT FROM OLD."currentVersionId"
     AND OLD."status" IN ('APPROVED', 'SCHEDULED')
  THEN
    NEW."status" := 'IN_PRODUCTION';

    INSERT INTO "AuditLog" (
      "id", "organizationId", "actorId", "action",
      "entityType", "entityId", "before", "after", "reason", "createdAt"
    ) VALUES (
      gen_random_uuid(), NEW."organizationId", NEW."updatedById", 'content.approval-dropped',
      'Content', NEW."id",
      jsonb_build_object('status', OLD."status", 'versionId', OLD."currentVersionId"),
      jsonb_build_object('status', NEW."status", 'versionId', NEW."currentVersionId"),
      'Conteúdo alterado depois de aprovado (I-05)', now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_drop_approval
  BEFORE UPDATE ON "Content"
  FOR EACH ROW EXECUTE FUNCTION maestro_drop_approval_on_change();

-- ============================================================================
-- I-07 · Publicação exige conteúdo aprovado
-- ============================================================================
-- O agendamento é a promessa cumprida. Sem aprovação, não existe (D-022).

CREATE OR REPLACE FUNCTION maestro_publication_guard() RETURNS trigger AS $$
DECLARE
  content_status TEXT;
BEGIN
  SELECT "status"::TEXT INTO content_status FROM "Content" WHERE "id" = NEW."contentId";
  IF content_status NOT IN ('APPROVED', 'SCHEDULED', 'PUBLISHED') THEN
    RAISE EXCEPTION
      'Publicação exige conteúdo aprovado. Status atual: %', content_status
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER publication_requires_approval
  BEFORE INSERT ON "Publication"
  FOR EACH ROW EXECUTE FUNCTION maestro_publication_guard();

-- ============================================================================
-- I-10 · Lote enviado exige objetivo do mês
-- ============================================================================

ALTER TABLE "Batch"
  ADD CONSTRAINT batch_sent_requires_goal
  CHECK ("status" = 'DRAFT' OR length(btrim("goal")) > 0);

-- ============================================================================
-- Índices parciais das filas quentes
-- ============================================================================
-- As tabelas são grandes; as filas são pequenas. O WHERE mantém o índice em
-- memória.

CREATE INDEX idx_content_awaiting
  ON "Content" ("organizationId", "status", "updatedAt")
  WHERE "status" = 'AWAITING_APPROVAL' AND "deletedAt" IS NULL;

CREATE INDEX idx_slot_uncovered
  ON "CalendarSlot" ("organizationId", "scheduledFor")
  WHERE "contentId" IS NULL AND "deletedAt" IS NULL;

CREATE INDEX idx_notification_due
  ON "Notification" ("scheduledFor")
  WHERE "sentAt" IS NULL AND "cancelledAt" IS NULL;

CREATE INDEX idx_publication_due
  ON "Publication" ("scheduledFor")
  WHERE "status" = 'QUEUED';
