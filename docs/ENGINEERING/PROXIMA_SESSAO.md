# Onde parou — 7 de setembro de 2026, fim do dia

## O que está de pé e em uso
A plataforma está sendo usada pela equipe. Push, aviso por dentro, presença e
os links de aprovação funcionando, todos conferidos pelo founder no aparelho
dele.

## O que ficou combinado para a próxima sessão

**O sino ampliado — aprovação e prazo.** O founder escolheu, quando perguntei
o escopo: "menção, mensagem e tarefa, mais aprovação e prazo". As três
primeiras estão de pé. Faltam duas:

1. **Cliente aprovou ou pediu alteração** → avisa a equipe. É direto: o evento
   já existe e o funil do `avisar()` já leva ao sino, ao aviso na tela e ao
   push. É ligar na decisão do cliente.

2. **Card com data chegando** → este é diferente, e é o que precisa ser
   explicado antes de construir. Ele **nasce do relógio, não de um gesto**.
   Todos os outros avisos saem porque alguém fez alguma coisa, e essa pessoa
   está com a Maestro aberta — é o navegador dela que acorda o carteiro. Um
   prazo não tem esse alguém: às 9h da manhã ninguém precisa estar online para
   o card de amanhã virar aviso.

   Por isso ele precisa de **agendamento no banco** (`pg_cron`), que é uma
   extensão que o founder liga com um clique em Database → Extensions. Com ela
   de pé, um agendamento chama o carteiro de hora em hora, e uma função decide
   quais cards estão perto da data.

   **Explicar isso ao founder antes de construir** — foi o combinado.

## O que continua aberto, sem pressa

- **INPI.** Não depositar antes da busca de anterioridade por radical
  (`MAESTRO*`) nas classes 9, 35, 41 e 42. O risco não é a Mastercard: são
  quatro "Maestro" brasileiros de software, e o Maestro ABM é quase o mesmo
  mercado. Ver D-024.
- **WhatsApp.** Esperando o chip. `WHATSAPP_QUANDO_CHEGAR.md` tem a ordem, os
  templates e os erros que custam caro.
- **Tabelas de backup** (`pauta_backup_2026_09_06`, `pauta_backup_antes_recuperar`,
  `config_backup_2026_09_07`) — dá para apagar depois de alguns dias.
- **O Cortez** aparece na lista de clientes sem ser cliente de verdade: ele
  nasce no código, resquício da demonstração.
- **Linha órfã `n5`** na tabela `pauta` — pauta de um cliente que não está mais
  na lista.

## O que aprendemos hoje, e vale carregar

Três defeitos diferentes tiveram a mesma forma: **uma escrita que apaga o que
não conhece.** A mescla de cadastro apagava a chave do link que o outro lado
tinha; o `cliAtual()` substituía o cliente que não resolvia pelo primeiro da
lista; e a v174 já tinha corrigido a foto sumindo pelo mesmo motivo.

Quando algo "some" nesta casa, a primeira hipótese deve ser essa: alguém
escreveu por cima sem saber que havia algo ali.

E o método que fechou todos: **parar de teorizar e ir medir.** Os três
primeiros diagnósticos dos links estavam errados — culpei a Mastercard, a
porta dos links, o `cliFora`. O que resolveu foi sempre consultar o banco e
comparar quem funciona com quem não funciona.
