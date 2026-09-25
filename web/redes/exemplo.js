/* =====================================================================
   v265 — NÚMEROS DE EXEMPLO DA ABA REDES.

   A aba só desenha depois de uma importação, e quem chega nela pela
   primeira vez (ou numa sessão de demonstração, sem banco) não via nada.
   Aqui nascem arquivos NO FORMATO de verdade do Meta Business Suite
   (Instagram e Facebook, 70 dias até ontem) e passam pelo MESMO caminho de
   uma importação — reconhecer, extrair, montar o pacote, aplicar —, só que
   em memória: nada vai para o banco, nada vai para o aparelho.

   Os números são fictícios e determinísticos (a mesma semente dá a mesma
   curva), para a tela não mudar a cada visita.
   ===================================================================== */
(function(G){
  'use strict';
  const M = () => G.MaestroRedesMotor, D = () => G.MaestroRedesDados;
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  /* gerador com semente: mulberry32 */
  function sorte(semente){
    let a = semente >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function dias(hoje, n){
    const fim = new Date(hoje + 'T12:00:00'); fim.setDate(fim.getDate() - 1);
    const out = [];
    for(let i = n - 1; i >= 0; i--){ const d = new Date(fim); d.setDate(d.getDate() - i); out.push(iso(d)); }
    return out;
  }
  /* uma curva com base, crescimento, dia de post (pico) e ruído */
  function curva(ds, semente, base, cresc, pico){
    const r = sorte(semente);
    return ds.map((d, i) => {
      const dow = new Date(d + 'T12:00:00').getDay();
      const post = dow === 2 || dow === 4 || (dow === 6 && r() < .5);
      const v = base * (1 + cresc * i / ds.length) * (.7 + r() * .6) * (post ? pico : 1);
      return Math.max(0, Math.round(v));
    });
  }
  const metaCsv = (titulo, ds, vs) => 'sep=,\r\n"' + titulo + '"\r\n"Data","Primary"\r\n'
    + ds.map((d, i) => `"${d}T00:00:00","${vs[i]}"`).join('\r\n') + '\r\n';
  const seguidoresIg = (ds, vs) => 'Data;Seguidores no Instagram\r\n' + ds.map((d, i) => `${d}T00:00:00;${vs[i]}`).join('\r\n') + '\r\n';
  const bytes = t => new TextEncoder().encode(t);

  function arquivos(hoje){
    const ds = dias(hoje, 70);
    const alcIg = curva(ds, 11, 420, .5, 2.6);
    const alcFb = curva(ds, 21, 160, .15, 1.8);
    return {
      instagram: [
        ['Alcance.csv', metaCsv('Alcance', ds, alcIg)],
        ['Visualizações.csv', metaCsv('Visualizações', ds, alcIg.map((v, i) => Math.round(v * (2.1 + (i % 5) * .08))))],
        ['Interações.csv', metaCsv('Interações com o conteúdo', ds, alcIg.map(v => Math.round(v * .085)))],
        ['Visitas.csv', metaCsv('Visitas ao perfil do Instagram', ds, curva(ds, 12, 22, .4, 2))],
        ['Cliques no link.csv', metaCsv('Cliques no link do Instagram', ds, curva(ds, 13, 3, .3, 2.2))],
        ['Seguidores.csv', seguidoresIg(ds, curva(ds, 14, 5, .6, 2.4))]
      ],
      facebook: [
        ['Visualizações.csv', metaCsv('Visualizações', ds, alcFb.map(v => Math.round(v * 1.7)))],
        ['Visualizadores.csv', metaCsv('Visualizadores', ds, alcFb)],
        ['Interações.csv', metaCsv('Interações com o conteúdo', ds, alcFb.map(v => Math.round(v * .04)))],
        ['Visitas.csv', metaCsv('Visitas ao Facebook', ds, curva(ds, 22, 6, .1, 1.5))],
        ['Cliques no link.csv', metaCsv('Cliques no link do Facebook', ds, curva(ds, 23, 1, .1, 2))],
        ['Seguidores.csv', metaCsv('Seguidores do Facebook', ds, curva(ds, 24, 1, .2, 2))]
      ]
    };
  }

  const pronto = {};
  /* porPlat no mesmo formato que MaestroRedesDados.lerCliente devolve */
  async function montar(cli, hoje, nomeConta){
    const chave = cli + '|' + hoje;
    if(pronto[chave]) return pronto[chave];
    const out = {}, arqs = arquivos(hoje);
    for(const [plat, lista] of Object.entries(arqs)){
      const leituras = [];
      for(const [nome, texto] of lista){
        const rs = await M().lerArquivo({ nome, bytes: bytes(texto) }, plat, {}, { hoje });
        rs.forEach(r => leituras.push(...(r.leituras || [])));
      }
      if(!leituras.length) continue;
      const pacote = M().montarPacote(leituras, { plat, hoje });
      const nome = plat === 'instagram' ? '@' + D().slugConta(nomeConta || 'exemplo') : (nomeConta || 'Exemplo');
      out[plat] = D().aplicar(null, pacote, { cli, conta: { id: D().slugConta(nome), nome }, em: hoje + 'T12:00:00', por: 'exemplo' }).dados;
    }
    return (pronto[chave] = out);
  }
  G.MaestroRedesExemplo = { montar, arquivos };
})(typeof window !== 'undefined' ? window : globalThis);
