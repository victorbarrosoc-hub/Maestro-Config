/* v272 — a tarefa sem card não passa do Do, e a boas-vindas não se repete.

   1. Ensaio: a seta levava tarefa de PRODUÇÃO sem card até o Check, o
      "Com o cliente" e o Act. Lá não há o que liberar nem o que o cliente
      decidir — o card mostrava só "estruturar a pauta" e ninguém sabia por
      quê. (Visto no vídeo do founder: "Post manifesto / aspas", passada de
      Plan para Check pela seta, com "— sem card ainda —".)
      O handler da seta corta a propagação, então aqui a regra roda no
      desenho: a tarefa que ACABOU de chegar numa coluna de card sem ter
      card volta para onde estava, com o motivo. A que já estava lá antes
      (dado antigo) não é mexida — ganha uma linha dizendo o que falta.

   2. Conversas: a mensagem de boas-vindas da semente nascia com a hora de
      agora e sem id, a cada login que recomeçava as Conversas. Cada uma
      virava mensagem nova, avisava "Alguém escreveu em Geral" e ficava no
      fio. A semente não traz mais mensagem; aqui as repetidas saem, fica a
      primeira. */
(function(){
  const COLS_DE_CARD = ['check', 'cliente', 'act'];
  const BOAS_VINDAS = 'A casa nova está de pé. Cada canal é um assunto — e o cliente só vê o canal dele.';
  const antes = {};                                   /* id da tarefa → coluna no último desenho */
  const semCard = t => t && typeof catIdDe === 'function' && catIdDe(t) === 'producao'
    && typeof cardDaTarefa === 'function' && !cardDaTarefa(t);

  function barrar(){
    if(!S.ensaio || !Array.isArray(S.ensaio.tarefas)) return;
    for(const t of S.ensaio.tarefas){
      const era = antes[t.id];
      if(semCard(t) && COLS_DE_CARD.includes(t.col) && era && !COLS_DE_CARD.includes(era)){
        t.col = era;
        if(typeof toast === 'function') toast('Sem card não passa do Do. Estruture a pauta primeiro.');
      }
      antes[t.id] = t.col;
    }
  }
  function dizer(){
    document.querySelectorAll('.enCard[data-entar]').forEach(c => {
      const t = (S.ensaio && S.ensaio.tarefas || []).find(x => x.id === +c.dataset.entar);
      if(!semCard(t) || !COLS_DE_CARD.includes(t.col) || c.querySelector('.v272Sem')) return;
      const a = c.querySelector('.acoes');
      if(a) a.insertAdjacentHTML('beforebegin', '<div class="cyEtapa v272Sem"><span><b>Sem card.</b> O Check libera card — estruture a pauta.</span></div>');
    });
  }
  function boasVindas(){
    const g = S.chat && Array.isArray(S.chat.canais) && S.chat.canais.find(c => c.id === 'geral');
    if(!g || !Array.isArray(g.msgs)) return;
    let viu = false;
    const n = g.msgs.filter(m => !(m && m.txt === BOAS_VINDAS) || (viu ? false : (viu = true)));
    if(n.length !== g.msgs.length) g.msgs = n;
  }
  render = (function(orig){
    return function(){
      try{ barrar(); boasVindas(); }catch(e){}
      const r = orig.apply(this, arguments);
      try{ dizer(); }catch(e){}
      return r;
    };
  })(render);
})();
