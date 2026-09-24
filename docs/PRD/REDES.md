# Redes — a análise de desempenho em cinco plataformas

Versão: v262 · 24/09/2026 · protótipo (motor em `web/redes/`, gancho em
`docs/UX/camadas/v262.js`)

## O pedido

> "Análise de desempenho de redes sociais em 5 plataformas" — Instagram,
> Facebook, YouTube, TikTok e LinkedIn, a partir do que cada rede exporta.
> Registro de adaptadores como configuração; modelo cliente › plataforma ›
> conta › métrica › data; importar de novo **substitui, nunca soma**; modal
> com cliente, conta, plataforma escolhida por quem importa, mês, campos por
> adaptador, "solte tudo" com distribuição automática, status por arquivo,
> avisos e confirmação de sobrescrita; regras de análise; períodos que se
> sobrepõem; relatório mensal. Quatro fases, com critérios de aceite.
>
> E depois: "meu desejo é que você aprenda como são os arquivos que as
> plataformas geram, estude se é o suficiente para entender todo o processo de
> análise e qual seria a forma mais fácil de a aba ter a análise sem precisar
> enviar 24 arquivos." — o founder

Os arquivos de verdade (EJUP, exportados em 24/09) estão em
`web/verificar/fixtures/redes/` e são a base de todas as provas. O
repositório é privado e o site não serve essa pasta (`vercel.json`).

---

## 1. O que cada rede entrega (aprendido dos arquivos reais)

| Rede | Arquivos para um mês | O que vem | Armadilhas que o motor trata |
|---|---|---|---|
| **Instagram** | 6 CSV (um por gráfico do Meta Business Suite) | Séries **diárias do perfil inteiro**: Visualizações, Alcance, Interações com o conteúdo, Visitas ao perfil, Cliques no link, Seguidores | UTF-16 com `sep=,` e título antes do cabeçalho `"Data","Primary"`; **Seguidores vem em outro formato** (UTF-8, `;`, só os dias com novidade — os outros viram 0); títulos **idênticos aos do Facebook** ("Visualizações", "Interações com o conteúdo") |
| **Facebook** | 6 CSV | As mesmas seis séries da página, com Visualizadores no lugar de Alcance | Página quase sem atividade (série "praticamente vazia" pede confirmação); "Seguidores do Facebook" não diz se é novo ou total — tratado como novos por dia **e dito como suposição** |
| **YouTube** | 1 .zip por métrica escolhida no gráfico | **Dados da tabela**: um vídeo por linha, 17 colunas (visualizações, intencionais, tempo, duração média, CTR da miniatura…) **com uma linha "Total" do canal**; **Dados do gráfico**: a métrica por dia e por vídeo, **só dos principais vídeos**; **Total**: a métrica por dia do canal | A linha "Total" não é vídeo; o gráfico não é o canal inteiro; "Sep 17, 2026" e "0:11:19"; o nome do .zip vai até hoje e o dado até ontem; "Visualizações intencionais" ≠ "Visualizações" |
| **TikTok** | 1 .zip por aba — Overview, Content, Viewers, Followers (4) | Overview: 5 métricas diárias da conta; Viewers: espectadores (total, novos, recorrentes); Followers: histórico + gênero, territórios e horário ativo; Content: lista de vídeos | **Datas sem ano** ("24 de setembro"); `undefined` onde não há dado; IDs de 19 dígitos (número perderia os últimos); a lista de vídeos é **parcial e acumulada desde a publicação**, um retrato do dia do export; público **vazio** com poucos seguidores |
| **LinkedIn** | 1 .xlsx (pode mandar mais de um: anual e semanal) | Seis abas: Descoberta (totais do período), Engajamento (diário), Seguidores (diário + total do dia), Publicações mais em alta, Demografia do público e do conteúdo | Números guardados **como texto**; "Publicações mais em alta" são **dois rankings independentes** lado a lado (a mesma linha não é o mesmo post; o post é a URL; no máximo 50); "Usuários alcançados" só existe como total do período |

**A conta dos "24 arquivos":** 6 + 6 + 3 (YouTube, uma por métrica) + 7
(TikTok, com o Content exportado quatro vezes) + 2 (LinkedIn) = 24. O mínimo
para um mês completo é **18**: 6 + 6 + 1 + 4 + 1.

---

## 2. O estudo: os arquivos bastam?

### Bastam para

- **A tendência de cada rede, dia a dia** — exibições, pessoas, interações,
  seguidores, cliques — com o nome que a própria rede usa.
- **Comparar com o mês anterior de forma justa** (o mesmo trecho de dias).
- **Achar os dias fora do padrão** e a taxa de engajamento de cada rede,
  recalculada das somas, com a fórmula à vista.
- **YouTube por vídeo**: a tabela tem tudo por vídeo e o total do canal no
  período — dá para separar o que veio dos lançamentos do mês e do catálogo.
- **TikTok por vídeo**, com a ressalva de ser acumulado desde a publicação.
- **LinkedIn**: as publicações que mais renderam (pela URL) e o público.

### Não bastam para — e o que falta

| Pergunta | Por que os arquivos não respondem | O que responderia |
|---|---|---|
| **Qual post gerou o pico?** (Instagram, Facebook) | Os 12 arquivos do Meta são do perfil inteiro, dia a dia. Nenhum traz dado por publicação | O export por conteúdo do Meta Business Suite (não veio no Drive — mande um e o adaptador entra sem código), ou a API. **E a Maestro já sabe o que saiu em cada dia:** a v262 mostra, embaixo de cada pico, os cards do Cronograma daquele dia e da véspera |
| **Quantas pessoas diferentes viram no mês?** | Alcance e visualizadores vêm por dia; a mesma pessoa em dois dias conta duas vezes | Só a API (alcance de período). A tela mostra média por dia e diz por quê |
| **Pago × orgânico** | Nenhum arquivo separa | API |
| **Stories** | Não vieram | Export de Stories ou API |
| **Público do Instagram/Facebook** | Não veio (TikTok veio vazio; LinkedIn veio) | Export de público do Meta ou API |
| **TikTok por vídeo, por dia** | A lista é um retrato acumulado | API |
| **Mais de uma métrica diária do YouTube** | Cada export traz UMA métrica no gráfico | Um .zip por métrica, ou a API |
| **Somar as redes** | Nunca: "visualização" do Instagram, do YouTube e do LinkedIn medem coisas diferentes | Não existe — o "lado a lado" põe cada rede com o nome dela |

**Conclusão:** para o relatório mensal de tendência por rede, **os arquivos
bastam**. Para responder *o que funcionou* no Instagram e no Facebook, falta o
dado por publicação — e a ponte mais barata é o que a Maestro já tem: o
Cronograma (já ligado aos picos na v262).

---

## 3. A forma mais fácil, sem 24 arquivos

**Hoje (no ar na v262): um arraste só.** Selecione todos os arquivos de
todas as redes de uma vez. Cada arquivo vai para o campo certo pelo
**conteúdo**, não pelo nome; o que é de outra rede fica na bandeja ("De
outras redes") e "Importar Facebook agora" troca de rede com os arquivos já
no lugar. A partir do segundo mês a conta já vem escolhida. Na prática: uma
seleção de arquivos e um "Importar" por rede. E dá para importar com menos
arquivos — o que faltar é dito ("Faltam: … Dá para importar sem elas").

**No ar desde a v263: "Importar as 5 redes".** O importador abre em
"Todas as redes": um arraste com os arquivos das cinco, um card por rede, um
"Conferi" e um botão. Os únicos arquivos que podem pedir um toque são os
gêmeos do Meta ("Visualizações" e "Interações com o conteúdo", mesmo título
no Instagram e no Facebook): com períodos diferentes, a tela resolve sozinha
e diz por quê; no mesmo período, dois toques (o par se resolve sozinho).

**O fim dos arquivos: conectar as contas.** Em ordem de facilidade (os
requisitos das plataformas mudam — conferir na hora de pedir):

1. **YouTube — YouTube Analytics API.** Projeto no Google Cloud e login do
   Google do dono do canal. Em modo de teste funciona com até 100 contas sem
   verificação, mas o acesso vence a cada 7 dias; para uso contínuo, a
   verificação do app pelo Google. Traz qualquer métrica, por dia e por vídeo
   — acaba o "uma métrica por export".
2. **Instagram + Facebook — API do Meta (Graph).** O **mesmo app** que o
   WhatsApp Cloud API já vai exigir: verificação da empresa e revisão das
   permissões de insights (Instagram e página). Traz **por publicação** — o
   que os 12 arquivos não trazem. Com YouTube e Meta ligados, **13 dos 18
   arquivos somem**.
3. **TikTok — API para contas business.** App aprovado pelo TikTok. Enquanto
   isso: 4 .zip por mês.
4. **LinkedIn — Community Management API.** O mais difícil (acesso restrito,
   revisão de caso de uso). Enquanto isso: 1 .xlsx por mês — já é o formato
   mais barato dos cinco.

---

## 4. As decisões

1. **A plataforma é sempre escolhida por quem importa.** "Visualizações" e
   "Interações com o conteúdo" têm o mesmo título no Instagram e no
   Facebook; adivinhar erraria em silêncio. O que só uma rede tem (Alcance,
   Visitas ao perfil) vai para a bandeja da rede certa; título que cita outra
   rede pede confirmação.
2. **Reconhecimento pelo conteúdo, nunca pelo nome do arquivo.** Com os nomes
   trocados, os seis arquivos do Instagram caem nos mesmos seis campos.
3. **Importar de novo substitui, nunca soma.** Chave: cliente, rede, conta,
   métrica, dia. Antes de gravar a tela diz quantas datas já existiam e
   quantas mudariam, e pede "Substituir". Cada valor guarda de que
   importação veio.
4. **Ausência não é zero.** `undefined`, vazio e `N/A` viram ausência — e a
   tela diz quantas células vieram assim.
5. **Pessoas nunca são somadas.** Alcance, visualizadores e espectadores
   aparecem como média por dia; totais de período (LinkedIn) ficam **por
   período**, lado a lado, sem se misturar.
6. **Redes nunca são somadas entre si.** O "lado a lado" agrupa por família
   (exibições, pessoas, interações, seguidores, cliques) e mostra cada rede
   com o nome original da métrica.
7. **Comparar com o mesmo trecho do mês anterior** (01 a 23/08 quando setembro
   tem 01 a 23/09; fevereiro limita em 28). Base mínima: 10 para totais, 5
   para médias; abaixo disso, "sem base", nunca uma porcentagem enganosa.
8. **Atividade mínima:** menos de 5 dias com valor → sem média nem tendência,
   e diz isso. Médias começam no primeiro dia com atividade.
9. **Picos:** pelo menos 3× a mediana dos dias positivos e pelo menos 10,
   agrupados por dia, no máximo 5 — e o Cronograma daquele dia e da véspera
   embaixo de cada um (só cards agendados, aprovados ou postados, da mesma
   rede; o Facebook não tem código de rede no Cronograma, então lá não se
   chuta nada).
10. **Taxa de engajamento recalculada das somas**, com a fórmula escrita.
11. **Datas sem ano (TikTok)** se resolvem de trás para a frente a partir de
    hoje — atravessando a virada do ano — e **pedem confirmação** antes de
    gravar ("Entendi 24/09/2025 a 23/09/2026. Confere?").
12. **O mês de referência precisa estar nos arquivos.** Se não está, bloqueia
    e oferece o mês que eles cobrem ("Usar setembro de 2026").
13. **A lista de vídeos do TikTok é um retrato**: vale o dia do export, não
    conta como cobertura do mês, e quatro exports são unidos pelo ID.
14. **YouTube:** a linha "Total" é total do canal; o gráfico é rotulado
    "principais vídeos"; lançamentos do período × catálogo.
15. **LinkedIn:** dois rankings que nunca se cruzam; a publicação é a URL, e
    **só https do LinkedIn vira link** (um endereço forjado na planilha não
    vira `javascript:`).
16. **Formato novo sem código:** arquivo não reconhecido mostra as primeiras
    linhas e oferece "Registrar este formato"; o adaptador fica numa linha da
    agência e, da próxima vez, o arquivo entra sozinho.
17. **Nada falha em silêncio.** Zip quebrado, `.xls` antigo, PDF, arquivo
    vazio, formato desconhecido: cada um diz o que houve.
18. **Todas as redes de uma vez (v263)** — o padrão do importador. A regra 1
    continua: o que casa com mais de uma rede ou é escolhido por quem
    importa, ou é sugerido com o motivo (só uma das redes tem outros
    arquivos · mesmo período dos outros · o par do que já foi escolhido) e
    entra no "Conferi". Cada rede grava na sua linha: a que falha não leva
    as outras, a que não pode entrar não segura as outras.

## 5. Arquitetura e dados

- **O motor mora fora do protótipo**, em `web/redes/` (registro, motor,
  dados, análise, tela e estilo — ~180 KB). O protótipo tem teto de 3,05 MB e
  o motor não cabe; ele desce **só quando a aba Redes abre**.
- **Uma linha por cliente e rede** na tabela `pauta`:
  `__redes__:<cliente>:<rede>`, com a marca `maestroRedes: 2`. A carga geral
  do app pede `dados->>maestroRedes=is.null` (um ano de cinco redes não desce
  para quem não abre a aba) e, por garantia, pula nomes `__redes__:`.
- **Adaptadores registrados** pela agência: `__redes__:_adaptadores`.
- **Gravar** é o mesmo contrato do resto do app: lê a linha, aplica, grava com
  trava de revisão (`dados->>rev`); conflito tenta de novo; falha tem cara
  ("Não gravou: … Nada foi alterado.").
- Tudo passa pela RLS por agência (`org`), como qualquer linha da `pauta`. Os
  links de cliente (`?aprovar=`/`?ver=`) não leem estas linhas.
- **A v238 sai da tela.** Os dados que ela gravou (`__redes__`, somando por
  publicação) continuam no banco; a aba nova avisa quantos são e pede
  reimportação pelos arquivos de cada rede — aquela versão deduzia a rede
  pelo arquivo e somava, as duas coisas que este pedido proíbe.

## 6. Provas

- `web/verificar/v262-redes-motor.mjs` — **100 provas**, sem navegador, com
  os arquivos reais: reconhecimento, valores, datas, substituir-nunca-somar,
  bloqueio de mês, cada rede, falhas com cara, análise do mês e lado a lado.
- `web/verificar/v262-redes-importar.mjs` — **78 provas** no navegador, com um
  PostgREST de mentira que tem trava de revisão e `org`: carga sob demanda,
  importar pela tela, sobrescrever, campo errado, bandeja, mês fora,
  confirmação do TikTok, formato novo, relatório com as cinco redes,
  Cronograma nos picos, falha do banco, texto que nunca vira código, celular
  (com a moldura da v240) e o motor que não chega.
- A suíte da v238 (`v238-a-aba-redes.mjs`) foi aposentada: ela cobrava a tela
  que saiu e "importar soma", o oposto da regra nova.

## 7. O que fica para depois

- Adaptador do export **por conteúdo** do Meta (precisa de um arquivo real).
- As conexões por API, na ordem da seção 3.
- A leitura escrita (resumo do mês em texto) — com o cérebro da marca.
