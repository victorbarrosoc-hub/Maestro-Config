/* =====================================================================
   v255 — A EQUIPE QUE SE ENTENDE.

   O founder (24/set): "a aba da equipe não está abrindo mais" e "precisa
   ser mais intuitiva, tá muito desorganizada".

   1. POR QUE NÃO ABRIA. Quem entra com uma conta que ainda não está na
      Equipe, numa agência que já tem dono, nasce com o papel "Equipe"
      (v219). Esse papel não existia na tabela PERMS, e a tela lia
      PERMS[papel].sim — TypeError, e a aba inteira morria. Agora todo
      papel que o app não conhece vira "Equipe", um papel de verdade,
      com o mínimo (pauta e Ensaio), e a tela pede para definir o papel.

   2. POR QUE ERA DIFÍCIL ORGANIZAR. A ficha da pessoa não oferecia
      "Administrador" na lista de papéis (a lista tirava justamente
      esse), e um papel desconhecido deixava a caixa marcada no primeiro
      da lista — salvar sem olhar mudava o papel. Agora Administrador
      aparece (só para quem é administrador), e papel desconhecido
      mostra "Escolha o papel", que salvar não aplica.

   3. A TELA. Uma lista de pessoas, separada em Administradores e
      Equipe; cada linha diz papel, e-mail, se libera o Check e se tem
      chave. Tocar abre a ficha, com TUDO da pessoa: foto, nome, e-mail,
      papel, revisor, permissões, chave e remover. "Como se entra" conta
      as três portas (login da agência → quem está entrando → chave), e
      "Papéis" mostra o que cada papel pode por padrão.
   ===================================================================== */
(function(){
  if(typeof agEquipe !== 'function' || typeof PERMS === 'undefined') return;

  /* ---------- 1. o papel que faltava --------------------------------- */
  if(!PERMS.Equipe) PERMS.Equipe = { sim:['pauta e calendário','produção no Ensaio'],
    nao:['enviar lotes','equipe','faturamento','aprovar conteúdo'] };
  if(typeof PADRAO_PAPEL !== 'undefined' && !PADRAO_PAPEL.Equipe) PADRAO_PAPEL.Equipe = ['pauta','ensaio'];
  /* os papéis DE FÁBRICA, congelados agora: a rede abaixo põe na tabela
     papéis que ninguém escolheu, e eles não podem virar opção de lista */
  const DE_FABRICA = new Set(Object.keys(PERMS).filter(p => p !== 'Equipe'));
  const papelConhecido = p => !!(p && DE_FABRICA.has(p));
  /* qualquer papel fora da tabela (um nome antigo, um erro de digitação)
     ganha a mesma rede: a tela nunca mais morre por causa de um papel */
  function redes(){
    (S.equipe || []).forEach(m => {
      if(!m) return;
      if(!m.papel || !PERMS[m.papel]) PERMS[m.papel || 'Equipe'] = PERMS.Equipe;
      if(typeof PADRAO_PAPEL !== 'undefined' && m.papel && !PADRAO_PAPEL[m.papel]) PADRAO_PAPEL[m.papel] = PADRAO_PAPEL.Equipe;
    });
  }

  const nome1 = m => String((m && m.n) || '').split(' ')[0] || 'Esta pessoa';
  const ehAdm = m => !!(m && (m.dono || m.papel === 'Administrador'));
  const revisa = m => typeof podeMembro === 'function' && podeMembro(m, 'revisar');
  const chaveDe = m => typeof temChave === 'function' && temChave(m);
  const eu = () => (S.usuario && S.usuario.tipo === 'agencia') ? S.usuario.id : null;
  const loginAtual = () => { try{ const q = window.MaestroPorta && MaestroPorta.quem(); return q && (q.login || q.email); }catch(e){ return null; } };
  const admin = () => typeof ehAdmin === 'function' ? ehAdmin() : true;

  function linha(m, i){
    const papel = papelConhecido(m.papel) ? m.papel : null;
    const selos = [];
    if(m.dono) selos.push('<span class="v255Selo dono">Dono</span>');
    if(!papel && !m.dono) selos.push('<span class="v255Selo falta">Defina o papel</span>');
    if(revisa(m)) selos.push('<span class="v255Selo">Revisor</span>');
    const ch = chaveDe(m);
    return `<button type="button" class="v255Pessoa" data-editmembro="${i}">
      ${avMembro(m)}
      <span class="v255Txt"><b>${esc(m.n || 'Sem nome')}${membroId(m) === eu() ? ' <i>você</i>' : ''}</b>
        <span>${esc(papel || (m.dono ? 'Administrador' : 'Sem papel'))} · ${esc(m.mail || 'sem e-mail')}</span></span>
      <span class="v255Selos">${selos.join('')}
        <span class="v255Chave${ch ? ' tem' : ''}" title="${ch ? 'Tem chave de acesso' : 'Sem chave de acesso'}">${ic(ch ? 'lock' : 'unlock', 13)}</span></span>
      <span class="v255Chev">${ic('chevr', 14)}</span></button>`;
  }

  function abaPessoas(){
    const idx = (S.equipe || []).map((m, i) => [m, i]).filter(([m]) => m);
    const adms = idx.filter(([m]) => ehAdm(m)), resto = idx.filter(([m]) => !ehAdm(m));
    const grupo = (t, l) => l.length ? `<section class="v255Grupo"><h2>${t} <span>${l.length}</span></h2>
      <div class="v255Lista">${l.map(([m, i]) => linha(m, i)).join('')}</div></section>` : '';
    const semPapel = resto.filter(([m]) => !papelConhecido(m.papel)).length;
    return (semPapel ? `<div class="v255Aviso">${ic('warn', 15)}<span><b>${semPapel === 1 ? '1 pessoa está' : semPapel + ' pessoas estão'} sem papel.</b>
        Toque no nome e escolha o papel — até lá, só pauta e Ensaio.</span></div>` : '')
      + grupo('Administradores', adms) + grupo('Equipe', resto)
      + '<p class="v255Nota">Aprovar conteúdo — é do cliente. Ninguém da agência aprova, nem o dono.</p>';
  }

  function abaEntrar(){
    const lg = loginAtual();
    const semChave = (S.equipe || []).filter(m => m && !chaveDe(m));
    return `<ol class="v255Passos">
      <li><b>O login da agência</b><span>E-mail e senha de uma conta da agência. ${lg ? `Neste aparelho: <em>${esc(lg)}</em>.` : ''}
        A senha dessa conta se troca em <a href="#" data-r="conta">Conta</a>.</span></li>
      <li><b>Quem está entrando?</b><span>A lista com os nomes da equipe. Quem entra com o próprio e-mail já cai no próprio nome.</span></li>
      <li><b>A chave da pessoa</b><span>Se a pessoa tem chave, o app pede antes de entrar no nome dela. É o que separa uma pessoa da outra num login da agência.</span></li>
    </ol>
    <section class="v255Grupo"><h2>Chaves <span>${(S.equipe || []).length - semChave.length} de ${(S.equipe || []).length}</span></h2>
      <div class="v255Lista">${(S.equipe || []).map((m, i) => m ? `<div class="v255ChLinha">
        ${avMembro(m)}<span class="v255Txt"><b>${esc(m.n)}</b><span>${chaveDe(m) ? 'tem chave' : 'entra sem chave'}</span></span>
        ${admin() || membroId(m) === eu() ? `<button type="button" class="b gho sm" data-chaveabre="${i}">${chaveDe(m) ? 'Trocar' : 'Criar'}</button>` : ''}</div>` : '').join('')}</div></section>`;
  }

  function abaPapeis(){
    if(typeof CAPACIDADES === 'undefined' || typeof PADRAO_PAPEL === 'undefined') return '';
    const papeis = Object.keys(PERMS).filter(p => papelConhecido(p));
    const cols = `grid-template-columns:150px repeat(${CAPACIDADES.length}, minmax(86px, 1fr));min-width:${150 + CAPACIDADES.length * 92}px`;
    return `<div class="v255Tabela" role="table">
      <div class="v255TLin cab" role="row" style="${cols}"><span></span>${CAPACIDADES.map(([, n]) => `<span role="columnheader">${esc(n)}</span>`).join('')}</div>
      ${papeis.map(p => `<div class="v255TLin" role="row" style="${cols}"><b>${esc(p)}</b>${CAPACIDADES.map(([k]) => {
        const s = (PADRAO_PAPEL[p] || []).includes(k);
        return `<span class="${s ? 'sim' : 'nao'}" aria-label="${s ? 'pode' : 'não pode'}">${s ? '✓' : '–'}</span>`; }).join('')}</div>`).join('')}
    </div>
    <p class="v255Nota">É o ponto de partida. Na ficha de cada pessoa dá para abrir ou fechar uma permissão só para ela.
      Aprovar conteúdo é sempre do cliente.</p>`;
  }

  agEquipe = function(){
    redes();
    const aba = ['pessoas', 'entrar', 'papeis'].includes(S.eqAba) ? S.eqAba : 'pessoas';
    const usados = assentosUsados(), lim = (plano() || {}).assentos || usados;
    const corpo = aba === 'entrar' ? abaEntrar() : aba === 'papeis' ? abaPapeis() : abaPessoas();
    return agShell(`<div class="v255">
      <div class="mtop"><div><h1>Equipe</h1><p>${usados} ${usados === 1 ? 'pessoa' : 'pessoas'} · ${usados} de ${lim} assentos</p></div>
        ${admin() ? `<button class="b pri sm" data-invite="1">${ic('users')} Convidar</button>` : ''}</div>
      <div class="v255Abas" role="tablist">${[['pessoas', 'Pessoas'], ['entrar', 'Como se entra'], ['papeis', 'Papéis']].map(([k, n]) =>
        `<button type="button" role="tab" aria-selected="${aba === k}" class="${aba === k ? 'on' : ''}" data-eqaba="${k}">${n}</button>`).join('')}</div>
      ${corpo}
      ${usados >= lim ? `<div class="v255Aviso">${ic('warn', 15)}<span><b>Assentos esgotados (${usados}/${lim}).</b>
        Convidar mais alguém pede um plano maior. <a href="#" data-r="planos">Ver planos</a></span></div>` : ''}
    </div>`);
  };

  addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-eqaba]');
    if(!t) return;
    e.preventDefault(); S.eqAba = t.dataset.eqaba; render();
  });

  /* ---------- 2. a ficha: tudo da pessoa, num lugar só ---------------- */
  modalMembro = (function(orig){
    return function(i){
      redes();
      let html = orig.apply(this, arguments);
      const m = membroPorIndice(i);
      if(!html || !m) return html;
      html = html.replace('<div class="modalbox" role="dialog" aria-modal="true">',
        `<div class="modalbox v255Ficha" role="dialog" aria-modal="true" data-v255ficha="${+i}">`);
      html = html.replace(/<h3>Editar ([^<]*)<\/h3>/, (t, n) => `<h3>${n}</h3>`);
      /* o papel: Administrador entra (para quem é administrador), e um
         papel desconhecido não fica marcado no primeiro da lista */
      html = html.replace(/<select id="mb-p">([\s\S]*?)<\/select>/, (t, ops) => {
        let o = ops.replace(/<option( selected)?>([^<]*)<\/option>/g, (t, sel, n) => papelConhecido(n) ? t : '');
        if(admin() && !/>Administrador</.test(o)) o += `<option ${m.papel === 'Administrador' ? 'selected' : ''}>Administrador</option>`;
        if(!papelConhecido(m.papel)) o = '<option value="" selected>Escolha o papel</option>' + o.replace(/ selected/g, '');
        return `<select id="mb-p">${o}</select>`;
      });
      if(!admin()) html = html.replace(/<div class="fld"><label for="mb-p">Papel<\/label><select id="mb-p">[\s\S]*?<\/select><\/div>/,
        `<p class="v255Nota">Papel: <b>${esc(papelConhecido(m.papel) ? m.papel : 'sem papel')}</b> — quem define é o administrador.</p>`);
      /* revisor: a chave que o founder foi procurar, agora na ficha */
      const on = revisa(m);
      const rv = `<div class="rvMarca v255Rv"><span class="rvTxt"><b>Revisor · libera o Check</b>
          <span>${m.dono ? 'Dono da conta: libera sempre.' : on ? `${esc(nome1(m))} libera o card do Check para o cliente.` : `${esc(nome1(m))} vê o Check, mas não libera.`}</span></span>
        <button type="button" class="rvChave${on ? ' on' : ''}${m.dono ? ' trav' : ''}" ${m.dono ? 'disabled' : `data-rvmarca="${+i}"`}
          aria-pressed="${on}" aria-label="Revisor: ${esc(m.n)}"></button></div>`;
      const sair = m.dono ? '<p class="v255Nota">O dono da conta não pode ser removido.</p>'
        : admin() ? `<button type="button" class="v255Sair" data-rmmembro="${+i}">Remover ${esc(nome1(m))} da equipe</button>` : '';
      const idx = html.lastIndexOf('<div class="modalrow"><button class="b gho" data-modalno="1">Cancelar</button>');
      if(idx >= 0) html = html.slice(0, idx) + rv + html.slice(idx);
      return html.replace(/<\/div><\/div>\s*$/, sair + '</div></div>');
    };
  })(modalMembro);

  /* o toque no revisor redesenha a TELA (v200); com a ficha aberta, ela
     também precisa mudar — sem perder o que já se digitou nela */
  let rvNaFicha = null;
  addEventListener('pointerdown', e => {
    const t = e.target.closest && e.target.closest('.v255Ficha [data-rvmarca]');
    rvNaFicha = t ? +t.dataset.rvmarca : null;
  }, true);
  addEventListener('keydown', e => {
    const t = e.target.closest && e.target.closest('.v255Ficha [data-rvmarca]');
    if(t && (e.key === 'Enter' || e.key === ' ')) rvNaFicha = +t.dataset.rvmarca;
  }, true);
  render = (function(orig){
    return function(){
      const r = orig.apply(this, arguments);
      if(rvNaFicha !== null && S.modal && String(S.modal).includes(`data-v255ficha="${rvNaFicha}"`)){
        const vals = ['mb-n', 'mb-m', 'mb-p'].map(id => document.getElementById(id)?.value);
        const i = rvNaFicha; rvNaFicha = null;
        S.modal = modalMembro(i); renderLayer();
        ['mb-n', 'mb-m', 'mb-p'].forEach((id, k) => { const el = document.getElementById(id); if(el && vals[k] !== undefined) el.value = vals[k]; });
      }
      return r;
    };
  })(render);

  /* salvar com "Escolha o papel": não aplica papel nenhum, e diz */
  addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-savemembro]');
    if(!t) return;
    const m = membroPorIndice(t.dataset.savemembro);
    const p = document.getElementById('mb-p');
    if(m && !m.dono && p && p.value === '' && !papelConhecido(m.papel))
      setTimeout(() => toast(`${nome1(m)} continua sem papel — escolha um na ficha.`), 0);
  }, true);

  window.MaestroEquipe = { papelConhecido, redes };
})();
