/* =====================================================================
   v260 — O NOME DO CARD SE MONTA SOZINHO.

   O founder: "não quero cards com nomes completamente diferentes, quero
   um padrão — o cliente primeiro, depois o tipo de conteúdo, depois a
   temática". Exemplo dele: "Roberto - Carrossel - Inovação no Direito".

   O nome passa a ser MONTADO, não digitado:
       Cliente · Tipo · Tema
   · o cliente vem de onde a pauta foi aberta, e o tipo dos botões de
     Formato — os dois ficam travados (ninguém escreve "Carrosel");
   · só o TEMA se digita;
   · rede e data ficam fora: o card já mostra as duas, e um carrossel
     que vai ao Instagram e ao LinkedIn é a mesma peça;
   · "·" e não "-": o hífen mora dentro dos temas ("Pré-venda").

   O campo `#pt-t` continua sendo a FONTE do nome — várias camadas o leem
   ao salvar (a tarefa do Ensaio é renomeada por ele, v227; o link do
   cliente e o lote mostram `p.t`). Ele vira oculto e recebe o nome
   montado a cada tecla; então toda tela que já existe passa a mostrar o
   padrão sem ser tocada. Tema vazio deixa `#pt-t` vazio, e os salvares
   que já existem recusam sozinhos.

   A demanda interna (Livre) não entra: não tem cliente nem tipo.
   ===================================================================== */
(function(){
  const SEP = ' · ';
  const fmts = () => {
    let l = [];
    try{ l = S.ptFmts && S.ptFmts.size ? [...S.ptFmts] : (S.ptFmt ? [S.ptFmt] : []); }catch(e){}
    return l.filter(f => f && f !== 'Livre');
  };
  const cliente = () => { try{ return String((cliAtual() || {}).nome || '').trim(); }catch(e){ return ''; } };
  const tipo = () => fmts().join(' + ');
  const montar = tema => {
    tema = String(tema || '').replace(/\s+/g, ' ').trim();
    if(tema.length < 2) return '';
    return [cliente(), tipo(), tema].filter(Boolean).join(SEP);
  };

  /* o tema de um nome que já existe: tira "Cliente · Tipo · " quando o
     nome já está no padrão (mesmo que o cliente tenha mudado de nome
     depois), e tira "Tipo · " dos nomes antigos ("Story · Autoridade") */
  const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function temaDe(nome){
    let t = String(nome || '').trim(); if(!t) return '';
    const F = (typeof FORMATOS !== 'undefined' ? FORMATOS : []).map(esc).join('|');
    if(F){
      const tipoRe = `(?:${F})(?:\\s\\+\\s(?:${F}))*`;
      let m = t.match(new RegExp(`^.+?\\s·\\s${tipoRe}\\s·\\s(.+)$`));
      if(m) return m[1].trim();
      m = t.match(new RegExp(`^${tipoRe}\\s·\\s(.+)$`));
      if(m) return m[1].trim();
    }
    const c = cliente();
    if(c && t.startsWith(c + SEP)) return t.slice((c + SEP).length).trim();
    return t;
  }

  /* o tema digitado vive enquanto o formulário está aberto — um
     redesenho (trocar formato, um aviso) não pode perdê-lo */
  let aberto = null, temaVivo = null;

  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  function pilulas(){
    const c = cliente(), t = tipo();
    return `<span class="v260Pil v260Cli" title="O cliente vem de onde a pauta foi aberta">${h(c || 'Cliente')}</span><i>·</i>`
      + `<span class="v260Pil v260Tipo ${t ? '' : 'falta'}" title="Muda nos botões de Formato">${h(t || 'Tipo')}</span><i>·</i>`;
  }

  if(typeof modalPauta === 'function') modalPauta = (function(orig){
    return function(id){
      let html = orig.apply(this, arguments);
      try{
        if(!html || html.indexOf('>Título da demanda<') >= 0) return html;
        if(html.indexOf('id="pt-t"') < 0) return html;
        const chave = id || 'novo';
        if(aberto !== chave){
          aberto = chave;
          const p = id && S.pauta ? S.pauta.find(x => x.id === id) : null;
          temaVivo = temaDe(p ? p.t : '');
        }
        const foco = /id="pt-t"[^>]*data-ptfoco/.test(html) || / data-ptfoco="1"[^>]*id="pt-t"/.test(html);
        html = html.replace(/<label for="pt-t">[\s\S]*?<\/label>/,
          `<label for="v260Tema">Nome do card<span class="fdica">monta sozinho: cliente · tipo · tema</span></label>`);
        html = html.replace(/<input id="pt-t"[^>]*>/,
          `<div class="v260Nome">${pilulas()}<input id="v260Tema" value="${h(temaVivo)}" autocomplete="off"
             placeholder="Tema — ex.: Inovação no Direito" aria-describedby="v260Prev"${foco ? ' data-v260foco="1"' : ''}></div>
           <div class="v260Prev" id="v260Prev" aria-live="polite">${h(montar(temaVivo)) || '<span>Escreva o tema para dar nome ao card</span>'}</div>
           <input type="hidden" id="pt-t" value="${h(montar(temaVivo))}">`);
      }catch(e){}
      return html;
    };
  })(modalPauta);

  /* tudo o que mexe no nome passa por aqui */
  function atualizar(){
    const campo = document.getElementById('v260Tema'); if(!campo) return;
    temaVivo = campo.value;
    const nome = montar(temaVivo);
    const oculto = document.getElementById('pt-t'); if(oculto) oculto.value = nome;
    const prev = document.getElementById('v260Prev');
    if(prev) prev.innerHTML = nome ? h(nome) : '<span>Escreva o tema para dar nome ao card</span>';
    const caixa = campo.closest('.v260Nome');
    if(caixa){ caixa.querySelectorAll('.v260Pil, .v260Nome > i').forEach(e => e.remove()); campo.insertAdjacentHTML('beforebegin', pilulas()); }
  }
  document.addEventListener('input', e => { if(e.target && e.target.id === 'v260Tema'){ e.target.classList.remove('v260Erro'); atualizar(); } });
  /* o formato muda o tipo: depois de o botão fazer o trabalho dele */
  document.addEventListener('click', e => {
    if(e.target.closest && e.target.closest('[data-fmtpick],[data-fmt98]')) setTimeout(atualizar, 0);
  });

  /* sem tema, não salva — e diz onde está o que falta */
  addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-ptok]');
    if(!b) return;
    const campo = document.getElementById('v260Tema'); if(!campo) return;
    atualizar();
    if(montar(campo.value)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    campo.classList.add('v260Erro'); campo.focus();
    if(typeof toast === 'function') toast('Falta o tema do card.');
  }, true);

  /* o formulário fechou: o próximo começa do zero */
  if(typeof renderLayer === 'function') renderLayer = (function(orig){
    return function(){
      try{ if(!S.modal){ aberto = null; temaVivo = null; } }catch(e){}
      const r = orig.apply(this, arguments);
      /* o redesenho devolve aos campos o valor de antes (outra camada guarda
         o que se digitou): o nome oculto voltaria com o TIPO velho, e a
         prévia diria uma coisa e o card gravaria outra. Remonta do estado. */
      try{ atualizar(); }catch(e){}
      try{
        const c = document.querySelector('#v260Tema[data-v260foco]');
        if(c && !c._focado){ c._focado = true; setTimeout(() => { try{ c.focus(); c.select(); }catch(e){} }, 70); }
      }catch(e){}
      return r;
    };
  })(renderLayer);

  window.MaestroNomeCard = { montar, temaDe, tipo, cliente };
})();
