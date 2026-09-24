/* v252 — a linha que resume as permissões de cada pessoa (só aparece no
   celular; no computador os chips continuam). Conta os chips que a v200
   já desenha certos — não recalcula permissão nenhuma. */
(function(){
  function resumir(){
    document.querySelectorAll('.permchips').forEach(c => {
      if(c.previousElementSibling && c.previousElementSibling.classList.contains('v252Perm')) return;
      const todos = [...c.children].filter(s => !/é do cliente/.test(s.textContent));
      const sim = todos.filter(s => !s.classList.contains('no')).length;
      const l = document.createElement('div'); l.className = 'v252Perm';
      const b = document.createElement('b'); b.textContent = sim + ' de ' + todos.length;
      l.append(b, document.createTextNode(sim === todos.length ? ' permissões · acesso completo' : ' permissões'));
      c.before(l);
    });
  }
  render = (function(orig){
    return function(){ const r = orig.apply(this, arguments); try{ resumir(); }catch(e){} return r; };
  })(render);
})();
