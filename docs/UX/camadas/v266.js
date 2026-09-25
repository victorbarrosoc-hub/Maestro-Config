/* =====================================================================
   v266 — O QUADRO NÃO ENCOLHE SOZINHO.

   25/set: o Ensaio perdeu todas as tarefas da casa e todas as concluídas;
   ficaram só as tarefas dos cards (o repositor as recria). O banco
   confirmou: `__estado__` com 10 tarefas, nenhuma da casa, nenhuma
   concluída, lixeira vazia — ninguém apagou.

   Reproduzido: um aparelho que já tinha o quadro reabre, e a carga da
   v54 fazia `S.ensaio = __config__.estudio` — o quadro do banco POR CIMA
   do deste aparelho. Com aquela cópia vazia ou velha, o aparelho passava a
   "ter apagado" tudo, e a mescla de três lados da v151 fez o certo com o
   dado errado: base cheia, local vazio → exclusão, gravada no __estado__.
   A carga agora junta (no próprio protótipo). Esta é a rede, a mesma ideia
   da v177 para a pauta: AUSÊNCIA NÃO É EXCLUSÃO.

   Antes de subir o estado, compara o quadro com a base (o que o banco
   tinha da última vez): tarefa da casa ou concluída que sumiu SEM lixeira e
   SEM lápide explicando é devolvida ao lugar em que estava. Pouca coisa (até
   2, ou menos de um terço) passa: pode ser o dia a dia de outro caminho.
   Tarefa de card fica de fora — o repositor e a faxina das v193/v224 cuidam
   delas, e elas somem de propósito ("reposta" cede o lugar).
   ===================================================================== */
(function(){
  const MIN = 3, PARTE = 0.34;
  const ids = l => (Array.isArray(l) ? l : []).filter(t => t && t.id != null);
  const daCasa = t => t && t.cardId == null;

  function explicados(e){
    const x = new Set();
    for(const it of (e.lixo || [])) if(it && it.tarefa && it.tarefa.id != null) x.add(String(it.tarefa.id));
    const F = window.MaestroFaxinaEnsaio;
    return { tem: id => x.has(String(id)) || !!(F && F.temLapide && F.temLapide(String(id))) };
  }

  /* devolve o que sumiu sem explicação; diz quantos voltaram */
  function consertar(){
    try{
      if(typeof S !== 'object' || !S || !S.ensaio) return 0;
      if(typeof abertoPorLink === 'function' && abertoPorLink()) return 0;
      const Sin = window.Sincro, base = Sin && Sin.base && Sin.base.ensaio;
      if(!base) return 0;
      const e = S.ensaio;
      e.tarefas = Array.isArray(e.tarefas) ? e.tarefas : [];
      e.feitas = Array.isArray(e.feitas) ? e.feitas : [];
      const agora = new Set([...ids(e.tarefas), ...ids(e.feitas)].map(t => String(t.id)));
      const antes = [...ids(base.tarefas).filter(daCasa).map(t => ({ t, onde: 'tarefas' })),
                     ...ids(base.feitas).map(t => ({ t, onde: 'feitas' }))];
      if(antes.length < MIN) return 0;
      const ex = explicados(e);
      const sumiram = antes.filter(x => !agora.has(String(x.t.id)) && !ex.tem(x.t.id));
      if(sumiram.length < MIN || sumiram.length / antes.length < PARTE) return 0;
      for(const x of sumiram) e[x.onde].push(JSON.parse(JSON.stringify(x.t)));
      e.prox = Math.max(+e.prox || 0, ...sumiram.map(x => (+x.t.id || 0) + 1));
      try{ if(typeof ligarTarefaAoCard === 'function') e.tarefas.forEach(ligarTarefaAoCard); }catch(er){}
      try{ console.warn('[v266] o quadro ia perder ' + sumiram.length + ' tarefa(s) sem ninguém apagar — devolvidas.'); }catch(er){}
      try{ if(typeof toast === 'function') toast(`O Ensaio ia perder ${sumiram.length} tarefas sem ninguém apagar. Elas voltaram.`); }catch(er){}
      window.MaestroQuadroDevolvidas = (window.MaestroQuadroDevolvidas || 0) + sumiram.length;
      return sumiram.length;
    }catch(er){ return 0; }
  }
  window.MaestroQuadroNaoEncolhe = { consertar };

  /* antes de subir: é aqui que a perda viraria banco */
  function embrulhar(){
    const Sin = window.Sincro;
    if(!Sin || typeof Sin.enviar !== 'function' || Sin.enviar._v266) return !!(Sin && Sin.enviar && Sin.enviar._v266);
    const orig = Sin.enviar;
    const novo = function(){ if(consertar()){ try{ if(S.modal == null && !S.full) render(); }catch(er){} } return orig.apply(this, arguments); };
    novo._v266 = true;
    Sin.enviar = novo;
    return true;
  }
  if(!embrulhar()){ let n = 0; const t = setInterval(() => { if(embrulhar() || ++n > 50) clearInterval(t); }, 200); }

  /* e depois de toda carga: a tela volta a mostrar a verdade */
  if(typeof sbCarregar === 'function') sbCarregar = (function(orig){
    return function(){
      return Promise.resolve(orig.apply(this, arguments)).then(ok => {
        if(consertar()){ try{ render(); }catch(er){} }
        return ok;
      });
    };
  })(sbCarregar);
})();
