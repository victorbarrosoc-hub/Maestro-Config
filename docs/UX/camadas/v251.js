/* v251 — os textos que explicam a tela e que não têm classe própria:
   marcados pelo que DIZEM, depois de cada desenho. Frase de status (quantos
   clientes, quantos assentos) não entra — só a que ensina o que a tela é. */
(function(){
  const CARTOES = ['Ninguém começa em tela vazia', 'Uma regra acima de todas'];
  const SUBS = ['o pulso da operação inteira', 'de onde sai o que a equipe consegue entregar'];
  function marcar(){
    document.querySelectorAll('.card > h4').forEach(h => {
      if(CARTOES.includes(h.textContent.trim())) h.parentElement.classList.add('v251Some'); });
    document.querySelectorAll('.mtop p, .rtCab p, h1 + p, h2 + p').forEach(p => {
      if(SUBS.includes(p.textContent.replace(/\s+/g, ' ').trim())) p.classList.add('v251Some'); });
  }
  render = (function(orig){
    return function(){ const r = orig.apply(this, arguments); try{ marcar(); }catch(e){} return r; };
  })(render);
})();
