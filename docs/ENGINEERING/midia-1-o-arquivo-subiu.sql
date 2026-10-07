-- midia-1 — o arquivo do card subiu para a nuvem? (SÓ LEITURA, não muda nada)
-- v323, 7/out. "O documento só está no celular de quem montou o card."
-- Rodar no SQL Editor do Supabase. As duas consultas só leem.

-- 1) o depósito de arquivos aceita PDF? (allowed_mime_types vazio = aceita tudo)
select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'midia';

-- 2) os arquivos que NÃO são imagem nem vídeo, dos últimos 15 dias:
--    com endereço = está na nuvem; sem endereço = ficou só no aparelho de quem subiu
select cliente, card_id, dados->>'nome' as arquivo, dados->>'tipo' as tipo,
       case when coalesce(dados->>'url','') like 'http%' then 'na nuvem' else 'SÓ NO APARELHO' end as onde,
       atualizado_em
from card_midias
where apagado_em is null
  and coalesce(dados->>'tipo','') not in ('imagem','video','link')
  and atualizado_em > now() - interval '15 days'
order by atualizado_em desc;
