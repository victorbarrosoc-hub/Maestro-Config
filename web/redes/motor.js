/* =====================================================================
   MAESTRO · REDES — o motor.

   Lê qualquer arquivo que as redes exportam e devolve LEITURAS: séries por
   dia, tabelas por conteúdo, totais do período, distribuições de público.
   Não sabe nada de tela nem de banco — roda igual no navegador e no Node
   (as provas em web/verificar leem os exports reais por aqui).

   Quem manda é o registro (adaptadores.js): o motor só tem LEITORES
   genéricos e as regras que valem para todos:

   · codificação: UTF-8 com ou sem BOM, UTF-16 com BOM (e sem, pelo padrão
     dos bytes); tudo vira texto comum aqui dentro;
   · "sep=," é instrução, não dado; o separador é o declarado ou o mais
     frequente FORA de aspas;
   · número, data e percentual chegam como texto (inclusive no Excel):
     conversão explícita, nunca pelo tipo da célula;
   · "undefined", "null", "N/A" e célula vazia são AUSÊNCIA — nunca 0;
   · arquivo só com cabeçalho é válido: categoria vazia, com aviso;
   · identificador longo (ID de vídeo de 19 dígitos) é texto, sempre;
   · meses e cabeçalhos em português ou inglês;
   · arquivo que não casa com nenhum adaptador: as primeiras linhas e
     "formato não reconhecido" — adivinhar é proibido.
   ===================================================================== */
(function(G){
  'use strict';

  const REG = () => G.MaestroRedesAdaptadores;

  /* ================================================================ */
  /* 1. texto                                                          */
  /* ================================================================ */
  const semAcento = t => String(t == null ? '' : t).normalize('NFD').replace(/[̀-ͯ]/g, '');
  /* comparar rótulos: sem acento, sem aspas, sem BOM, minúsculo */
  const norm = t => semAcento(t).replace(/﻿/g, '').replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/\s+/g, ' ').toLowerCase();
  const pad = n => String(n).padStart(2, '0');

  /* ================================================================ */
  /* 2. bytes → texto                                                  */
  /* ================================================================ */
  function decodificar(bytes){
    const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const dec = (cod, b) => new TextDecoder(cod).decode(b);
    if(u[0] === 0xFF && u[1] === 0xFE) return { texto: dec('utf-16le', u.subarray(2)), codificacao: 'UTF-16 com BOM' };
    if(u[0] === 0xFE && u[1] === 0xFF) return { texto: dec('utf-16be', u.subarray(2)), codificacao: 'UTF-16 BE com BOM' };
    if(u[0] === 0xEF && u[1] === 0xBB && u[2] === 0xBF) return { texto: dec('utf-8', u.subarray(3)), codificacao: 'UTF-8 com BOM' };
    /* UTF-16 sem BOM: um byte zero a cada dois, no começo do arquivo */
    const n = Math.min(u.length, 512);
    let zPar = 0, zImpar = 0;
    for(let i = 0; i < n; i++) if(u[i] === 0) (i % 2 ? zImpar++ : zPar++);
    if(n >= 8 && zImpar > n * 0.3 && zPar < n * 0.05) return { texto: dec('utf-16le', u), codificacao: 'UTF-16' };
    if(n >= 8 && zPar > n * 0.3 && zImpar < n * 0.05) return { texto: dec('utf-16be', u), codificacao: 'UTF-16 BE' };
    try{ return { texto: new TextDecoder('utf-8', { fatal: true }).decode(u), codificacao: 'UTF-8' }; }
    catch(e){
      try{ return { texto: dec('windows-1252', u), codificacao: 'Windows-1252' }; }
      catch(e2){ return { texto: dec('utf-8', u), codificacao: 'UTF-8 (com caracteres inválidos)' }; }
    }
  }

  /* ================================================================ */
  /* 3. CSV                                                            */
  /* ================================================================ */
  function detectarSeparador(texto){
    const cont = { ',': 0, ';': 0, '\t': 0 };
    let aspas = false, linhas = 0;
    for(let i = 0; i < texto.length && i < 8000; i++){
      const ch = texto[i];
      if(ch === '"') aspas = !aspas;
      else if(!aspas){
        if(cont[ch] !== undefined) cont[ch]++;
        else if(ch === '\n' && ++linhas >= 12) break;
      }
    }
    const melhor = Object.keys(cont).sort((a, b) => cont[b] - cont[a])[0];
    return cont[melhor] ? melhor : ',';
  }
  function lerCsv(texto){
    texto = String(texto).replace(/^﻿/, '');
    let sep = null, declarado = false;
    const m = texto.match(/^[ \t]*"?sep=(.)"?[ \t]*\r?\n/i);
    if(m){ sep = m[1]; declarado = true; texto = texto.slice(m[0].length); }
    if(!sep) sep = detectarSeparador(texto);
    const linhas = [];
    let campo = '', lin = [], aspas = false;
    const fecha = () => { lin.push(campo); campo = ''; if(lin.some(c => String(c).trim() !== '')) linhas.push(lin); lin = []; };
    for(let i = 0; i < texto.length; i++){
      const ch = texto[i];
      if(aspas){
        if(ch === '"' && texto[i + 1] === '"'){ campo += '"'; i++; }
        else if(ch === '"') aspas = false;
        else campo += ch;
      }
      else if(ch === '"' && campo.trim() === '') { aspas = true; campo = ''; }
      else if(ch === sep){ lin.push(campo); campo = ''; }
      else if(ch === '\n' || ch === '\r'){ if(ch === '\r' && texto[i + 1] === '\n') i++; fecha(); }
      else campo += ch;
    }
    if(campo !== '' || lin.length) fecha();
    /* aparar espaços de fora (as aspas já saíram) */
    return { linhas: linhas.map(l => l.map(c => String(c).replace(/^[ \t]+|[ \t]+$/g, ''))), sep, declarado };
  }

  /* ================================================================ */
  /* 4. ZIP (sem biblioteca: o navegador descompacta com                */
  /*    DecompressionStream; o Node 18+ também)                        */
  /* ================================================================ */
  async function inflar(dados){
    if(typeof DecompressionStream === 'undefined') throw erro('sem_zip', 'Este navegador não abre .zip. Descompacte e envie os arquivos de dentro.');
    const fluxo = new Blob([dados]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(fluxo).arrayBuffer());
  }
  function nomeZip(bytes, utf8){
    if(utf8) return new TextDecoder('utf-8').decode(bytes);
    try{ return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch(e){ try{ return new TextDecoder('windows-1252').decode(bytes); }catch(e2){ return new TextDecoder('utf-8').decode(bytes); } }
  }
  async function abrirZip(bytes){
    const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const dv = new DataView(u.buffer, u.byteOffset, u.byteLength);
    let fim = -1;
    for(let i = u.length - 22; i >= Math.max(0, u.length - 65557); i--){
      if(dv.getUint32(i, true) === 0x06054b50){ fim = i; break; }
    }
    if(fim < 0) throw erro('zip_invalido', 'O .zip está corrompido ou incompleto.');
    const total = dv.getUint16(fim + 10, true);
    let p = dv.getUint32(fim + 16, true);
    const saida = [];
    for(let k = 0; k < total; k++){
      if(dv.getUint32(p, true) !== 0x02014b50) throw erro('zip_invalido', 'O .zip está corrompido ou incompleto.');
      const flags = dv.getUint16(p + 8, true), metodo = dv.getUint16(p + 10, true);
      const tamC = dv.getUint32(p + 20, true);
      const nN = dv.getUint16(p + 28, true), nE = dv.getUint16(p + 30, true), nC = dv.getUint16(p + 32, true);
      const local = dv.getUint32(p + 42, true);
      const nome = nomeZip(u.subarray(p + 46, p + 46 + nN), !!(flags & 0x800));
      p += 46 + nN + nE + nC;
      if(/\/$/.test(nome) || /(^|\/)__MACOSX\//.test(nome) || /(^|\/)\.DS_Store$/.test(nome) || /(^|\/)\._/.test(nome)) continue;
      const lN = dv.getUint16(local + 26, true), lE = dv.getUint16(local + 28, true);
      const ini = local + 30 + lN + lE;
      const dados = u.subarray(ini, ini + tamC);
      let conteudo;
      if(metodo === 0) conteudo = dados.slice();
      else if(metodo === 8) conteudo = await inflar(dados);
      else throw erro('zip_metodo', 'O .zip usa uma compressão que o navegador não abre. Descompacte e envie os arquivos.');
      saida.push({ nome: nome.split('/').pop(), caminho: nome, bytes: conteudo });
    }
    return saida;
  }

  /* ================================================================ */
  /* 5. XLSX (é um zip de XML: as abas pelo NOME, cada célula como      */
  /*    texto — o LinkedIn guarda tudo como texto mesmo)               */
  /* ================================================================ */
  const entidade = s => String(s).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e) => {
    const k = e.toLowerCase();
    if(k === 'amp') return '&'; if(k === 'lt') return '<'; if(k === 'gt') return '>';
    if(k === 'quot') return '"'; if(k === 'apos') return "'";
    if(k[0] === '#') return String.fromCodePoint(k[1] === 'x' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10));
    return m;
  });
  const atributos = tag => { const o = {}; tag.replace(/([\w:]+)="([^"]*)"/g, (m, k, v) => { o[k] = entidade(v); return m; }); return o; };
  const colNum = ref => { let n = 0; for(const ch of ref.replace(/\d+$/, '')) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };
  async function abrirXlsx(bytes){
    const partes = await abrirZip(bytes);
    const txt = caminho => { const p = partes.find(x => x.caminho === caminho || x.caminho === caminho.replace(/^\//, ''));
      return p ? new TextDecoder('utf-8').decode(p.bytes) : null; };
    const wb = txt('xl/workbook.xml');
    if(!wb) throw erro('xlsx_invalido', 'O .xlsx não tem a estrutura de uma planilha.');
    const rels = {};
    (txt('xl/_rels/workbook.xml.rels') || '').replace(/<Relationship\b[^>]*>/g, t => { const a = atributos(t); rels[a.Id] = a.Target; return t; });
    const compartilhadas = [];
    (txt('xl/sharedStrings.xml') || '').replace(/<si>([\s\S]*?)<\/si>/g, (m, corpo) => {
      corpo = corpo.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
      let s = ''; corpo.replace(/<t\b[^>]*>([\s\S]*?)<\/t>/g, (m2, t) => { s += entidade(t); return m2; });
      compartilhadas.push(s); return m;
    });
    const abas = [];
    wb.replace(/<sheet\b[^>]*\/?>/g, tag => {
      const a = atributos(tag);
      let alvo = rels[a['r:id']] || '';
      alvo = alvo.replace(/^\/?(xl\/)?/, 'xl/');
      const xml = txt(alvo);
      const grade = [];
      if(xml) xml.replace(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, (m, attr, corpo) => {
        const at = atributos(attr); if(!at.r) return m;
        const lin = parseInt(at.r.replace(/^[A-Z]+/, ''), 10) - 1, col = colNum(at.r);
        let v = '';
        if(corpo){
          const vm = corpo.match(/<v>([\s\S]*?)<\/v>/);
          if(at.t === 's') v = vm ? (compartilhadas[+vm[1]] || '') : '';
          else if(at.t === 'inlineStr'){ let s = ''; corpo.replace(/<t\b[^>]*>([\s\S]*?)<\/t>/g, (m2, t) => { s += entidade(t); return m2; }); v = s; }
          else v = vm ? entidade(vm[1]) : '';
        }
        (grade[lin] = grade[lin] || [])[col] = v;
        return m;
      });
      for(let i = 0; i < grade.length; i++){ grade[i] = grade[i] || []; for(let j = 0; j < grade[i].length; j++) if(grade[i][j] === undefined) grade[i][j] = ''; }
      abas.push({ nome: a.name, grade });
      return tag;
    });
    return { abas };
  }

  /* ================================================================ */
  /* 6. valores                                                        */
  /* ================================================================ */
  const ausente = v => v == null || (REG().ausentes || ['', 'undefined', 'null', 'n/a', 'nan']).includes(norm(v));
  /* modo 'ponto': 18.11 é decimal (YouTube, TikTok); 'virgula': pt-BR;
     'auto': decide pelo formato (1.234 = milhar; 1,5 = decimal) */
  function numero(v, modo){
    if(ausente(v)) return null;
    let t = String(v).trim().replace(/[\s "']/g, '').replace(/%$/, '');
    if(!t || t === '-' ) return t === '-' ? NaN : null;
    if(/^[-+]?\d+$/.test(t)) return Number(t);
    if(modo === 'ponto') t = t.replace(/,/g, '');
    else if(modo === 'virgula') t = t.replace(/\./g, '').replace(',', '.');
    else {
      const p = t.lastIndexOf('.'), c = t.lastIndexOf(',');
      if(p >= 0 && c >= 0) t = c > p ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
      else if(c >= 0) t = /^[-+]?\d{1,3}(,\d{3})+$/.test(t) ? t.replace(/,/g, '') : t.replace(',', '.');
      else if(p >= 0 && /^[-+]?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    }
    const n = Number(t);
    return Number.isFinite(n) ? n : NaN;
  }
  /* "0:11:19" → 679 s; "11:19" → 679 s */
  function duracao(v){
    if(ausente(v)) return null;
    const m = String(v).trim().match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
    if(!m) { const n = numero(v, 'ponto'); return n; }
    return m[3] !== undefined ? (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) : (+m[1]) * 60 + (+m[2]);
  }

  const MESES = { jan: 1, janeiro: 1, january: 1, fev: 2, fevereiro: 2, feb: 2, february: 2, mar: 3, marco: 3, march: 3,
    abr: 4, abril: 4, apr: 4, april: 4, mai: 5, maio: 5, may: 5, jun: 6, junho: 6, june: 6, jul: 7, julho: 7, july: 7,
    ago: 8, agosto: 8, aug: 8, august: 8, set: 9, setembro: 9, sep: 9, sept: 9, september: 9, out: 10, outubro: 10,
    oct: 10, october: 10, nov: 11, novembro: 11, november: 11, dez: 12, dezembro: 12, dec: 12, december: 12 };
  const mesDe = t => { const k = norm(t).replace(/\./g, ''); return MESES[k] || null; };
  const valida = (a, m, d) => { const x = new Date(Date.UTC(a, m - 1, d)); return x.getUTCFullYear() === a && x.getUTCMonth() === m - 1 && x.getUTCDate() === d; };
  const iso = (a, m, d) => valida(a, m, d) ? `${a}-${pad(m)}-${pad(d)}` : null;
  /* devolve 'AAAA-MM-DD', ou { dia, mes } quando o texto não tem ano, ou null */
  function data(v, formato){
    if(ausente(v)) return null;
    const s = String(v).trim();
    let m;
    if((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|[T\s])/))) return iso(+m[1], +m[2], +m[3]);
    if((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) return formato === 'mm/dd/aaaa' ? iso(+m[3], +m[1], +m[2]) : iso(+m[3], +m[2], +m[1]);
    /* número de série do Excel (se alguém salvou a data como data) */
    if(/^\d{5}(\.\d+)?$/.test(s) && formato !== 'dia_mes'){
      const x = new Date(Date.UTC(1899, 11, 30) + Math.floor(+s) * 864e5);
      return iso(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate());
    }
    const t = norm(s).replace(/[,.]/g, ' ').replace(/\bde\b/g, ' ').replace(/\s+/g, ' ').trim();
    let dia, mes, ano;
    if((m = t.match(/^([a-z]+) (\d{1,2})(?: (\d{4}))?$/)) && mesDe(m[1])){ mes = mesDe(m[1]); dia = +m[2]; ano = m[3]; }
    else if((m = t.match(/^(\d{1,2}) ([a-z]+)(?: (\d{4}))?$/)) && mesDe(m[2])){ dia = +m[1]; mes = mesDe(m[2]); ano = m[3]; }
    else return null;
    if(ano) return iso(+ano, mes, dia);
    if(!valida(2024, mes, dia)) return null;           /* 2024 é bissexto: aceita 29/02 */
    return { dia, mes };
  }
  /* a ocorrência mais recente de dia/mês que não passa da âncora */
  function resolverAno(dia, mes, ancora){
    const [ay, am, ad] = ancora.split('-').map(Number);
    let y = (mes > am || (mes === am && dia > ad)) ? ay - 1 : ay;
    for(let k = 0; k < 8 && !valida(y, mes, dia); k++) y--;
    return iso(y, mes, dia);
  }
  /* lista cronológica, a última é a mais recente: resolve de trás para a
     frente, cada data valendo a ocorrência mais recente que não passe da
     seguinte — é assim que dezembro vira janeiro sem se perder */
  function resolverSequencia(lista, ancora){
    const out = new Array(lista.length);
    let ref = ancora;
    for(let i = lista.length - 1; i >= 0; i--){ out[i] = resolverAno(lista[i].dia, lista[i].mes, ref); ref = out[i] || ref; }
    return out;
  }
  function intervalo(txt){
    const m = String(txt || '').match(/(\d{1,2}\/\d{1,2}\/\d{4})\s*[-–a]+\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
    if(!m) return null;
    const a = data(m[1], 'dd/mm/aaaa'), b = data(m[2], 'dd/mm/aaaa');
    return a && b ? [a, b] : null;
  }
  const somarDias = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const diasEntre = (a, b) => Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 864e5);
  function* cadaDia(ini, fim){ for(let d = ini; d <= fim; d = somarDias(d, 1)) yield d; }
  const dataBR = d => d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '';
  const slug = t => norm(t).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  function erro(codigo, texto){ const e = new Error(texto); e.codigo = codigo; return e; }

  /* ================================================================ */
  /* 7. abrir um arquivo: zip vira várias peças, xlsx vira abas          */
  /* ================================================================ */
  const extensao = nome => (String(nome).toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || '';
  async function abrir(arquivo){
    const { nome } = arquivo;
    const bytes = arquivo.bytes instanceof Uint8Array ? arquivo.bytes : new Uint8Array(arquivo.bytes);
    const ext = extensao(nome);
    const zipado = bytes[0] === 0x50 && bytes[1] === 0x4B;
    try{
      if(ext === 'xlsx' || (zipado && ext !== 'zip' && ext !== 'csv')){
        const x = await abrirXlsx(bytes);
        return [{ nome, origem: arquivo.origem || null, tipo: 'xlsx', abas: x.abas, tamanho: bytes.length }];
      }
      if(ext === 'zip' || zipado){
        const itens = await abrirZip(bytes);
        const pecas = [];
        for(const it of itens){
          const sub = await abrir({ nome: it.nome, bytes: it.bytes, origem: nome });
          pecas.push(...sub);
        }
        if(!pecas.length) return [{ nome, origem: null, tipo: 'erro', erro: 'O .zip está vazio.' }];
        return pecas;
      }
      if(ext === 'xls') return [{ nome, origem: arquivo.origem || null, tipo: 'erro', erro: 'Arquivo .xls (Excel antigo) não é lido. Exporte de novo em .xlsx ou .csv.' }];
      if(['png', 'jpg', 'jpeg', 'pdf', 'gif', 'webp', 'mp4', 'mov', 'doc', 'docx'].includes(ext))
        return [{ nome, origem: arquivo.origem || null, tipo: 'erro', erro: `Arquivo .${ext} não é planilha. Envie o .csv, .xlsx ou .zip que a rede exporta.` }];
      const { texto, codificacao } = decodificar(bytes);
      const csv = lerCsv(texto);
      return [{ nome, origem: arquivo.origem || null, tipo: 'csv', csv, codificacao, tamanho: bytes.length,
        previa: texto.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim()).slice(0, 6) }];
    }catch(e){
      return [{ nome, origem: arquivo.origem || null, tipo: 'erro', erro: e.codigo ? e.message : `Não consegui abrir o arquivo (${e.message}).` }];
    }
  }

  /* ================================================================ */
  /* 8. reconhecer pelo conteúdo                                        */
  /* ================================================================ */
  const REDES = ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin'];
  /* "Cliques no link do Instagram" → base "cliques no link", citou instagram */
  function baseDoTitulo(t){
    let s = norm(t), citou = null;
    const m = s.match(new RegExp(`\\s+(?:d[oa]s?|n[oa]s?|a[os]?|ao|at|on|in)\\s+(${REDES.join('|')})$`));
    if(m){ citou = m[1]; s = s.slice(0, m.index); }
    else { const m2 = s.match(new RegExp(`\\b(${REDES.join('|')})\\b`)); if(m2) citou = m2[1]; }
    return { base: s.trim(), citou };
  }
  const achaCol = (cab, nomes) => {
    const lista = (Array.isArray(nomes) ? nomes : [nomes]).map(norm);
    for(const n of lista){ const i = cab.findIndex(c => norm(c) === n); if(i >= 0) return i; }
    return -1;
  };
  function casar(peca, forma){
    if(peca.tipo === 'xlsx'){
      if(!/^aba_/.test(forma.leitor)) return null;
      const aba = peca.abas.find(a => norm(a.nome) === norm(forma.aba));
      return aba ? { score: 30, aba } : null;
    }
    if(peca.tipo !== 'csv' || /^aba_/.test(forma.leitor)) return null;
    const L = peca.csv.linhas;
    if(forma.leitor === 'meta'){
      if(L.length < 2) return null;
      const celulas = (L[0] || []).filter(c => String(c).trim() !== '');
      if(celulas.length !== 1) return null;
      const cab = (L[1] || []).map(norm);
      if(!['data', 'date'].includes(cab[0]) || !cab.includes('primary')) return null;
      const { base, citou } = baseDoTitulo(celulas[0]);
      if(!forma.titulo.some(t => baseDoTitulo(t).base === base)) return null;
      return { score: 40, titulo: String(celulas[0]).trim(), citou, linhaCab: 1 };
    }
    const esperado = (forma.cabecalho || []).map(norm);
    for(let i = 0; i < Math.min(6, L.length); i++){
      const cab = L[i].map(norm);
      if(forma.colunas && cab.filter(Boolean).length !== forma.colunas) continue;
      if(esperado.length && esperado.every((e, k) => e === '*' ? !!cab[k] : cab[k] === e)){
        const cit = baseDoTitulo(L[i].join(' ')).citou;
        return { score: 10 + esperado.filter(e => e !== '*').length, linhaCab: i, citou: cit, generica: esperado.includes('*') };
      }
    }
    return null;
  }
  function categoriasDe(platId, extras){
    const p = REG().plataformas[platId];
    const cats = p ? p.categorias.slice() : [];
    const x = extras && extras[platId];
    if(x && Array.isArray(x.categorias)) cats.push(...x.categorias.map(c => Object.assign({ personalizada: true }, c)));
    return cats;
  }
  function reconhecer(peca, platId, extras){
    let melhor = null;
    for(const cat of categoriasDe(platId, extras)){
      for(const forma of cat.formas){
        const r = casar(peca, forma);
        if(r && (!melhor || r.score > melhor.score)) melhor = Object.assign({ plat: platId, cat, forma }, r);
      }
    }
    return melhor;
  }
  /* em que OUTRA rede o arquivo casaria — só para avisar, nunca para decidir.
     Formas genéricas ("Data,<qualquer métrica>") não contam como indício. */
  function reconhecerEmOutras(peca, platId, extras){
    const achou = [];
    for(const outra of Object.keys(REG().plataformas)){
      if(outra === platId) continue;
      const r = reconhecer(peca, outra, extras);
      if(r && !r.generica) achou.push(r);
    }
    return achou;
  }
  /* no xlsx cada aba é uma categoria: devolve todas as que casam */
  function reconhecerAbas(peca, platId, extras){
    const out = [];
    for(const cat of categoriasDe(platId, extras)){
      for(const forma of cat.formas){ const r = casar(peca, forma); if(r){ out.push(Object.assign({ plat: platId, cat, forma }, r)); break; } }
    }
    return out;
  }

  /* ================================================================ */
  /* 9. extrair                                                         */
  /* ================================================================ */
  function novaLeitura(peca, rec){
    return { arquivo: peca.nome, origem: peca.origem || null, plat: rec.plat, cat: rec.cat.id,
      catRotulo: rec.cat.rotulo, estrutura: rec.cat.estrutura, parte: !!rec.cat.parte, esparsa: rec.cat.esparsa || null,
      principal: !!rec.cat.principal, opcional: !!rec.cat.opcional, parcial: !!rec.cat.parcial,
      citou: rec.citou || null, vazio: false, periodo: null, linhas: 0, ausentes: 0, invalidos: 0,
      series: {}, avisos: [], dica: {} };
  }
  const aviso = (L, nivel, texto, id) => { L.avisos.push({ nivel, texto, id: id || null }); };
  const defMetrica = (m, extra) => ({ orig: m.orig, fam: m.fam || 'outras', nat: m.nat || 'fluxo', d: {}, ...(extra || {}) });
  function periodoDeSerie(d){ const k = Object.keys(d).sort(); return k.length ? [k[0], k[k.length - 1]] : null; }
  function juntaPeriodos(ps){ const v = ps.filter(Boolean); if(!v.length) return null;
    return [v.map(p => p[0]).sort()[0], v.map(p => p[1]).sort().slice(-1)[0]]; }

  function extrair(peca, rec, ctx){
    ctx = ctx || {};
    const plat = REG().plataformas[rec.plat] || {};
    const modo = plat.numeros || 'auto';
    const L = novaLeitura(peca, rec);
    const f = rec.forma, cat = rec.cat;
    if(cat.suposicao) aviso(L, 'info', `${cat.suposicao}.`, 'suposicao');

    /* ---------- meta: sep= · título · "Data","Primary" ---------- */
    if(f.leitor === 'meta'){
      const linhas = peca.csv.linhas.slice(rec.linhaCab + 1);
      const cab = peca.csv.linhas[rec.linhaCab];
      const iV = achaCol(cab, 'Primary'), iD = 0;
      const m = cat.metricas[0];
      const S = defMetrica(m, { orig: rec.titulo || m.orig });
      for(const r of linhas){
        const d = data(r[iD], 'iso');
        if(!d || typeof d !== 'string'){ L.invalidos++; continue; }
        const v = numero(r[iV], modo);
        if(v === null) L.ausentes++;
        else if(Number.isNaN(v)){ L.invalidos++; continue; }
        S.d[d] = v; L.linhas++;
      }
      L.series[m.canon] = S;
    }

    /* ---------- colunas: série diária larga ou longa (por conteúdo) ---------- */
    else if(f.leitor === 'colunas'){
      const cab = peca.csv.linhas[rec.linhaCab];
      const linhas = peca.csv.linhas.slice(rec.linhaCab + 1);
      const iD = achaCol(cab, f.data.col);
      const semAno = f.data.formato === 'dia_mes';
      /* as métricas: do registro, ou do cabeçalho (YouTube: "Data,<métrica>") */
      let metricas;
      if(f.metricaDoCabecalho){
        const nome = cab[cab.length - 1];
        const conhecida = (plat.metricasConhecidas || {})[String(nome).trim()] ||
          Object.entries(plat.metricasConhecidas || {}).find(([k]) => norm(k) === norm(nome))?.[1];
        metricas = [Object.assign({ canon: conhecida ? conhecida.canon : slug(nome), de: nome, orig: String(nome).trim() },
          conhecida || { fam: 'outras', nat: 'fluxo' })];
        if(!conhecida) aviso(L, 'info', `Métrica "${nome}" não está no registro: guardada com o nome original, tratada como soma por dia.`);
        L.metricaCabecalho = String(nome).trim();
      } else metricas = cat.metricas || [];
      const cols = metricas.map(m => ({ m, i: achaCol(cab, m.de) }));
      cols.filter(c => c.i < 0).forEach(c => aviso(L, 'aviso', `Coluna "${[].concat(c.m.de)[0]}" não encontrada.`));
      if(f.porConteudo){
        const iK = achaCol(cab, f.porConteudo.chave), iT = achaCol(cab, f.porConteudo.titulo);
        const m = metricas[0], iV = cols[0].i;
        const por = {};
        for(const r of linhas){
          const d = data(r[iD], 'iso'); if(!d || typeof d !== 'string'){ L.invalidos++; continue; }
          const id = String(r[iK] || '').trim(); if(!id){ L.invalidos++; continue; }
          const v = numero(r[iV], modo);
          if(v === null) L.ausentes++; else if(Number.isNaN(v)){ L.invalidos++; continue; }
          const alvo = por[id] = por[id] || { t: String(r[iT] || '').trim(), d: {} };
          alvo.d[d] = v; L.linhas++;
        }
        L.porConteudo = { [m.canon]: { orig: m.orig, fam: m.fam, nat: m.nat, conteudos: por, rotulo: cat.rotuloAnalise || '' } };
        L.periodo = juntaPeriodos(Object.values(por).map(x => periodoDeSerie(x.d)));
        L.nConteudos = Object.keys(por).length;
      } else {
        const series = {}; cols.forEach(c => { if(c.i >= 0) series[c.m.canon] = defMetrica(c.m); });
        const brutas = [];
        for(const r of linhas){
          const d = data(r[iD], f.data.formato);
          if(!d){ L.invalidos++; continue; }
          const vals = {};
          for(const c of cols){
            if(c.i < 0) continue;
            const v = numero(r[c.i], modo);
            if(v === null) L.ausentes++;
            else if(Number.isNaN(v)){ L.invalidos++; continue; }
            vals[c.m.canon] = v;
          }
          if(typeof d === 'string') for(const k in vals) series[k].d[d] = vals[k];
          else brutas.push({ dia: d.dia, mes: d.mes, vals });
          L.linhas++;
        }
        L.series = series;
        if(semAno){ L.semAno = { linhas: brutas }; }
      }
    }

    /* ---------- tabela: uma linha por conteúdo ---------- */
    else if(f.leitor === 'tabela'){
      const cab = peca.csv.linhas[rec.linhaCab];
      const linhas = peca.csv.linhas.slice(rec.linhaCab + 1);
      const iK = achaCol(cab, cat.chave.col);
      const iT = cat.titulo ? achaCol(cab, cat.titulo) : -1;
      const iP = cat.publicado ? achaCol(cab, cat.publicado.col) : -1;
      const iS = cat.snapshot ? achaCol(cab, cat.snapshot.col) : -1;
      const iL = cat.link ? achaCol(cab, cat.link) : -1;
      const mapa = [];
      const semRegistro = [];
      cab.forEach((nome, i) => {
        const def = Object.entries(cat.colunas || {}).find(([k]) => norm(k) === norm(nome));
        if(def) mapa.push({ i, orig: String(nome).trim(), ...def[1] });
        else if(![iK, iT, iP, iS, iL].includes(i) && String(nome).trim()) semRegistro.push(String(nome).trim());
      });
      if(semRegistro.length) aviso(L, 'info', `Colunas guardadas só com o nome original (fora do registro): ${semRegistro.join(', ')}.`);
      const conteudos = {}, brutasSnap = [];
      let total = null;
      for(const r of linhas){
        let id = String(r[iK] == null ? '' : r[iK]).trim();
        if(cat.chave.regex){ const mm = id.match(new RegExp(cat.chave.regex)); id = mm ? mm[1] : ''; }
        const vals = {};
        for(const c of mapa){
          const bruto = r[c.i];
          const v = c.tipo === 'hms' ? duracao(bruto) : numero(bruto, modo);
          if(v === null){ L.ausentes++; vals[c.canon] = null; }
          else if(Number.isNaN(v)){ L.invalidos++; vals[c.canon] = null; }
          else vals[c.canon] = v;
        }
        if(cat.linhaTotal && norm(r[achaCol(cab, cat.linhaTotal.col)]) === norm(cat.linhaTotal.valor)){ total = vals; continue; }
        if(!id){ L.invalidos++; continue; }
        const item = { id, t: iT >= 0 ? String(r[iT] || '').trim() : '', v: vals };
        if(iL >= 0) item.link = String(r[iL] || '').trim();
        if(iP >= 0){ const p = data(r[iP], cat.publicado.formato); if(typeof p === 'string') item.pub = p; else if(p) item.pubBruta = p; }
        if(iS >= 0){ const s = data(r[iS], cat.snapshot.formato); if(s && typeof s !== 'string') brutasSnap.push(s); else if(s) item.snap = s; }
        conteudos[id] = item; L.linhas++;
      }
      L.tabela = { conteudos, total, colunas: Object.fromEntries(mapa.map(c => [c.canon, { orig: c.orig, fam: c.fam, nat: c.nat }])) };
      if(brutasSnap.length) L.tabela.snapBruto = brutasSnap[0];
      L.nConteudos = Object.keys(conteudos).length;
      if(total) aviso(L, 'info', 'A linha "Total" é o total do canal no período — guardada como total, não como vídeo.');
    }

    /* ---------- distribuição de público (TikTok) ---------- */
    else if(f.leitor === 'distribuicao'){
      const cab = peca.csv.linhas[rec.linhaCab];
      const linhas = peca.csv.linhas.slice(rec.linhaCab + 1);
      const iG = achaCol(cab, f.campos.grupo), iS = f.campos.subgrupo ? achaCol(cab, f.campos.subgrupo) : -1, iV = achaCol(cab, f.campos.valor);
      const itens = [];
      for(const r of linhas){
        let g = String(r[iG] || '').trim();
        if(f.data && f.data.formato === 'dia_mes'){ const d = data(g, 'dia_mes'); g = d && typeof d !== 'string' ? d : (d || g); }
        const v = numero(r[iV], modo);
        if(v === null) L.ausentes++; else if(Number.isNaN(v)) { L.invalidos++; continue; }
        itens.push([g, iS >= 0 ? String(r[iS] || '').trim() : null, v]); L.linhas++;
      }
      L.distrib = { itens, parcial: !!cat.parcial, orig: String(cab[iV] || '').trim() };
    }

    /* ---------- abas do xlsx (LinkedIn) ---------- */
    else if(/^aba_/.test(f.leitor)){
      const g = rec.aba.grade;
      const cel = ref => { const c = colNum(ref), l = parseInt(ref.replace(/^[A-Z]+/, ''), 10) - 1; return ((g[l] || [])[c] || '').trim(); };
      const acharCab = (primeira) => g.findIndex(l => l && norm(l[0]) === norm(primeira));
      if(f.leitor === 'aba_chave_valor'){
        const per = f.periodo ? intervalo(cel(f.periodo.celula)) : null;
        L.periodo = per;
        if(!per) aviso(L, 'aviso', `Não achei o período na célula ${f.periodo && f.periodo.celula}.`);
        L.totais = {};
        for(const lin of g){
          if(!lin) continue;
          const def = Object.entries(cat.pares || {}).find(([k]) => norm(k) === norm(lin[0]));
          if(!def) continue;
          const v = numero(lin[1], modo);
          if(v === null) L.ausentes++; else if(Number.isNaN(v)) { L.invalidos++; continue; }
          L.totais[def[1].canon] = { v, orig: String(lin[0]).trim(), fam: def[1].fam, nat: def[1].nat, periodo: per };
          L.linhas++;
        }
      }
      else if(f.leitor === 'aba_colunas'){
        const h = acharCab(f.data.col);
        const cab = h >= 0 ? g[h] : [];
        const series = {};
        const cols = (cat.metricas || []).map(m => ({ m, i: achaCol(cab, m.de) }));
        cols.forEach(c => { if(c.i >= 0) series[c.m.canon] = defMetrica(c.m); });
        for(let i = h + 1; h >= 0 && i < g.length; i++){
          const lin = g[i]; if(!lin || !String(lin[0] || '').trim()) continue;
          const d = data(lin[0], f.data.formato);
          if(!d || typeof d !== 'string'){ L.invalidos++; continue; }
          for(const c of cols){
            if(c.i < 0) continue;
            const v = numero(lin[c.i], modo);
            if(v === null) L.ausentes++; else if(Number.isNaN(v)) { L.invalidos++; continue; }
            series[c.m.canon].d[d] = v;
          }
          L.linhas++;
        }
        if(f.estoque){
          const mm = cel(f.estoque.celula).match(new RegExp(f.estoque.regex));
          const v = numero(cel(f.estoque.valor), modo);
          if(mm && typeof v === 'number' && !Number.isNaN(v)){
            const d = data(mm[1], 'dd/mm/aaaa');
            series[f.estoque.canon] = { orig: f.estoque.orig, fam: f.estoque.fam, nat: f.estoque.nat, d: { [d]: v } };
            L.estoqueEm = d;
          }
        }
        L.series = series;
      }
      else if(f.leitor === 'aba_blocos'){
        /* cada bloco se acha pelo cabeçalho, em qualquer coluna */
        const rankings = {};
        for(const b of f.blocos){
          let h = -1, c0 = -1;
          for(let i = 0; i < Math.min(g.length, 10) && h < 0; i++){
            const lin = (g[i] || []).map(norm);
            for(let j = 0; j + b.cabecalho.length <= lin.length; j++){
              if(b.cabecalho.every((e, k) => lin[j + k] === norm(e))){ h = i; c0 = j; break; }
            }
          }
          const lista = [];
          if(h >= 0){
            for(let i = h + 1; i < g.length; i++){
              const lin = g[i] || [];
              const url = String(lin[c0] || '').trim();
              if(!url) continue;
              const d = data(lin[c0 + 1], 'dd/mm/aaaa');
              const v = numero(lin[c0 + 2], modo);
              lista.push({ url, pub: typeof d === 'string' ? d : null, v: typeof v === 'number' && !Number.isNaN(v) ? v : null });
              L.linhas++;
            }
          } else aviso(L, 'aviso', `Não achei a tabela "${b.orig}" na aba.`);
          rankings[b.ranking] = { orig: b.orig, lista };
        }
        L.ranking = rankings;
        L.nConteudos = new Set(Object.values(rankings).flatMap(r => r.lista.map(x => x.url))).size;
      }
      else if(f.leitor === 'aba_distribuicao'){
        const h = acharCab(f.campos.grupo);
        const cab = h >= 0 ? g[h] : [];
        const iS = achaCol(cab, f.campos.subgrupo), iV = achaCol(cab, f.campos.valor);
        const itens = [];
        for(let i = h + 1; h >= 0 && i < g.length; i++){
          const lin = g[i]; if(!lin || !String(lin[0] || '').trim()) continue;
          const v = numero(lin[iV], modo);
          if(v === null) L.ausentes++; else if(Number.isNaN(v)) { L.invalidos++; continue; }
          itens.push([String(lin[0]).trim(), String(lin[iS] || '').trim(), v]); L.linhas++;
        }
        L.distrib = { itens, parcial: !!cat.parcial, quem: cat.quem || '', orig: String(cab[iV] || '').trim() };
      }
    }

    /* ---------- o que vale para todos ---------- */
    if(!L.periodo) L.periodo = juntaPeriodos(Object.values(L.series).map(s => periodoDeSerie(s.d)));
    if(L.linhas === 0 && !(L.semAno && L.semAno.linhas.length)){
      L.vazio = true;
      aviso(L, 'info', cat.vazioNormal ? `Arquivo só com o cabeçalho: sem dados. ${cat.vazioNormal}` : 'Arquivo só com o cabeçalho: sem dados.');
    }
    if(L.invalidos) aviso(L, 'aviso', `${L.invalidos} ${L.invalidos === 1 ? 'valor não pôde ser lido e ficou' : 'valores não puderam ser lidos e ficaram'} de fora.`);
    if(L.ausentes) aviso(L, 'info', `${L.ausentes} ${L.ausentes === 1 ? 'célula sem dado' : 'células sem dado'} ("undefined", vazio…) — guardadas como ausência, não como zero.`);
    /* indícios pelo NOME do arquivo (nunca fonte única) */
    const nomeZipOuArq = peca.origem || peca.nome;
    if(plat.dicaZip){
      const mm = String(nomeZipOuArq).match(new RegExp(plat.dicaZip, 'i'));
      if(mm){
        if(rec.plat === 'youtube'){ L.dica = { inicio: mm[1], fim: mm[2], conta: mm[3].replace(/\s+_\s+/g, ' | ') }; }
        else { L.dica = { inicio: mm[1] || null, conta: mm[2] ? '@' + mm[2].replace(/^@/, '') : null }; }
      }
    }
    if(plat.dicaArquivo){
      const mm = String(peca.nome).match(new RegExp(plat.dicaArquivo, 'i'));
      if(mm) L.dica = { conta: mm[1], inicio: mm[2], fim: mm[3] };
    }
    return L;
  }

  /* abrir + reconhecer + extrair, para um arquivo e uma rede escolhida */
  async function lerArquivo(arquivo, platId, extras, ctx){
    const pecas = await abrir(arquivo);
    return pecas.map(p => analisarPeca(p, platId, extras, ctx));
  }
  function analisarPeca(peca, platId, extras, ctx){
    const r = { peca, nome: peca.origem ? `${peca.origem} › ${peca.nome}` : peca.nome, leituras: [], status: 'lido', msgs: [] };
    if(peca.tipo === 'erro'){ r.status = 'erro'; r.msgs.push({ nivel: 'erro', texto: peca.erro }); return r; }
    if(peca.tipo === 'xlsx'){
      const recs = reconhecerAbas(peca, platId, extras);
      if(!recs.length){
        const noutras = Object.keys(REG().plataformas).filter(o => o !== platId && reconhecerAbas(peca, o, extras).length);
        r.status = 'desconhecido';
        r.msgs.push({ nivel: 'erro', texto: noutras.length
          ? `Esta planilha parece de ${noutras.map(o => REG().plataformas[o].nome).join(' ou ')}, não de ${REG().plataformas[platId].nome}.`
          : `Formato não reconhecido. Abas: ${peca.abas.map(a => a.nome).join(', ') || '(nenhuma)'}.` });
        r.outras = noutras;
        return r;
      }
      r.leituras = recs.map(rec => extrair(peca, rec, ctx));
      /* o período do arquivo vem da Descoberta (B1) e vale para as abas sem data */
      const per = r.leituras.find(l => l.totais && l.periodo)?.periodo || juntaPeriodos(r.leituras.map(l => l.periodo));
      r.leituras.forEach(l => { if(!l.periodo) l.periodo = per; });
      r.periodo = per;
      r.status = r.leituras.every(l => l.vazio) ? 'vazio' : 'lido';
      return r;
    }
    const rec = reconhecer(peca, platId, extras);
    if(!rec){
      const outras = reconhecerEmOutras(peca, platId, extras);
      r.status = 'desconhecido';
      r.outras = outras.map(o => o.plat);
      r.previa = peca.previa || [];
      r.msgs.push({ nivel: 'erro', texto: outras.length
        ? `Este arquivo parece ${outras.map(o => `${REG().plataformas[o.plat].nome} · ${o.cat.rotulo}`).join(' ou ')} — não é de ${REG().plataformas[platId].nome}.`
        : 'Formato não reconhecido: nenhum adaptador casa com este arquivo. As primeiras linhas estão abaixo.' });
      return r;
    }
    const L = extrair(peca, rec, ctx);
    r.leituras = [L];
    r.periodo = L.periodo;
    r.status = L.vazio ? 'vazio' : 'lido';
    return r;
  }

  /* ================================================================ */
  /* 10. o pacote: tudo o que vai junto numa importação                 */
  /* ================================================================ */
  const NOME_MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const mesExtenso = m => `${NOME_MES[+m.slice(5, 7) - 1]} de ${m.slice(0, 4)}`;
  const diasNoMes = m => new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 0)).getUTCDate();

  function montarPacote(leituras, ctx){
    const reg = REG(), platId = ctx.plat, plat = reg.plataformas[platId] || {};
    const hoje = ctx.hoje || new Date().toISOString().slice(0, 10);
    const avisos = [];
    const add = (nivel, texto, id, extra) => avisos.push(Object.assign({ nivel, texto, id: id || null }, extra || {}));
    const Ls = leituras.filter(Boolean);

    /* ---- 1. datas sem ano (TikTok) ---- */
    const comAno = [];
    let ancoraFim = null;
    const ordem = Ls.slice().sort((a, b) => (b.cat === 'overview') - (a.cat === 'overview'));
    for(const L of ordem){
      if(L.semAno && L.semAno.linhas.length){
        const datas = resolverSequencia(L.semAno.linhas, hoje);
        L.semAno.linhas.forEach((b, i) => { const d = datas[i]; if(!d) return; for(const k in b.vals) if(L.series[k]) L.series[k].d[d] = b.vals[k]; });
        L.periodo = juntaPeriodos(Object.values(L.series).map(s => periodoDeSerie(s.d)));
        if(L.cat === 'overview' || !ancoraFim) ancoraFim = L.periodo ? L.periodo[1] : ancoraFim;
        comAno.push(L);
        delete L.semAno;
        if(L.dica && L.dica.inicio && L.periodo && L.periodo[0] !== L.dica.inicio)
          add('aviso', `${L.arquivo}: o nome do arquivo sugere início em ${dataBR(L.dica.inicio)}, mas as datas resolvidas começam em ${dataBR(L.periodo[0])}.`, 'dica_' + L.arquivo);
      }
    }
    for(const L of Ls){
      /* distribuição por data (FollowerActivity) */
      if(L.distrib && L.distrib.itens.some(it => it[0] && typeof it[0] === 'object')){
        const anc = ancoraFim || hoje;
        L.distrib.itens = L.distrib.itens.map(it => typeof it[0] === 'object' ? [resolverAno(it[0].dia, it[0].mes, anc), it[1], it[2]] : it);
        comAno.push(L);
      }
      /* tabela com datas sem ano: publicação e data do export */
      if(L.tabela){
        const anc = ancoraFim || hoje;
        let resolveu = false;
        for(const c of Object.values(L.tabela.conteudos)){
          if(c.pubBruta){ c.pub = resolverAno(c.pubBruta.dia, c.pubBruta.mes, anc); delete c.pubBruta; resolveu = true; }
        }
        if(L.tabela.snapBruto){ L.tabela.snap = resolverAno(L.tabela.snapBruto.dia, L.tabela.snapBruto.mes, hoje); delete L.tabela.snapBruto; resolveu = true; }
        if(resolveu) comAno.push(L);
      }
    }
    if(comAno.length){
      const per = juntaPeriodos(comAno.map(L => L.periodo));
      const snaps = [...new Set(comAno.map(L => L.tabela && L.tabela.snap).filter(Boolean))];
      add('confirmar', `As datas vêm sem ano. Entendi ${per ? `${dataBR(per[0])} a ${dataBR(per[1])}` : 'as datas'}` +
        (snaps.length ? ` (export dos vídeos em ${snaps.map(dataBR).join(', ')})` : '') + '. Confere?', 'anos', { periodo: per });
    }

    /* ---- 2. o período do pacote (séries densas mandam) ---- */
    const series = Ls.filter(L => Object.keys(L.series || {}).length && !L.vazio);
    const densas = series.filter(L => !L.esparsa);
    let periodo = juntaPeriodos((densas.length ? densas : series).map(L => L.periodo));
    if(!periodo) periodo = juntaPeriodos(Ls.map(L => L.periodo));
    /* a tabela do YouTube não tem data: vale o período do Total / gráfico / nome do zip */
    for(const L of Ls){
      /* export com "retrato" (TikTok Content): totais acumulados NA DATA do
         export — não é período, é um dia */
      if(L.tabela && L.tabela.snap){ L.periodo = [L.tabela.snap, L.tabela.snap]; continue; }
      if(L.tabela && !L.periodo){
        const irmas = Ls.filter(x => x !== L && x.origem && x.origem === L.origem && x.periodo);
        L.periodo = irmas.length ? juntaPeriodos(irmas.map(x => x.periodo)) :
          (L.dica && L.dica.inicio && L.dica.fim ? [L.dica.inicio, L.dica.fim] : periodo);
        if(!irmas.length && L.periodo) add('info', `${L.arquivo}: sem datas no arquivo — período ${dataBR(L.periodo[0])} a ${dataBR(L.periodo[1])} tirado ${L.dica && L.dica.inicio ? 'do nome do .zip' : 'dos outros arquivos'}.`);
      }
    }
    /* YouTube: o nome do zip termina num dia que pode não ter dado ainda */
    for(const L of Ls){
      if(L.dica && L.dica.fim && L.periodo && L.cat === 'total' && L.dica.fim !== L.periodo[1])
        add('info', `O nome do .zip vai até ${dataBR(L.dica.fim)}; os dados vão até ${dataBR(L.periodo[1])} (o último dia ainda não tinha dado).`, 'zipfim');
    }

    /* ---- 3. série esparsa: dia que não veio é zero, dentro do período ---- */
    for(const L of series.filter(L => L.esparsa === 'zero')){
      const temOutras = densas.some(x => x !== L);
      const [ini, fim] = temOutras ? periodo : (L.periodo || periodo || []);
      if(!ini) continue;
      let preenchidos = 0;
      for(const S of Object.values(L.series)){
        for(const d of cadaDia(ini, fim)) if(!(d in S.d)){ S.d[d] = 0; preenchidos++; }
      }
      L.periodo = [ini, fim];
      L.preenchidos = preenchidos;
      if(preenchidos) add('info', `${L.catRotulo}: ${preenchidos} ${preenchidos === 1 ? 'dia sem novo seguidor virou' : 'dias sem novo seguidor viraram'} 0, de ${dataBR(ini)} a ${dataBR(fim)}.`);
      if(!temOutras) add('aviso', `${L.catRotulo}: sem as outras categorias no mesmo envio, o preenchimento com zero ficou limitado às datas do próprio arquivo (${dataBR(ini)} a ${dataBR(fim)}).`, 'esparsa_limite');
    }

    /* ---- 4. vários arquivos da mesma categoria ---- */
    const porCat = {};
    Ls.forEach(L => { (porCat[L.cat] = porCat[L.cat] || []).push(L); });
    const sobrepostos = new Set();
    for(const [c, lista] of Object.entries(porCat)){
      if(lista.length < 2) continue;
      if(lista[0].tabela){
        /* TikTok Content: une por ID; conflito → export mais recente, e avisa */
        const uniao = {}, conflitos = [];
        const ord = lista.slice().sort((a, b) => ((a.tabela.snap || '') < (b.tabela.snap || '') ? -1 : 1) || (a.nConteudos - b.nConteudos));
        for(const L of ord){
          for(const [id, it] of Object.entries(L.tabela.conteudos)){
            if(uniao[id] && JSON.stringify(uniao[id].v) !== JSON.stringify(it.v)) conflitos.push(id);
            uniao[id] = it;
          }
        }
        const base = ord[ord.length - 1];
        base.tabela.conteudos = uniao; base.nConteudos = Object.keys(uniao).length;
        ord.slice(0, -1).forEach(L => { L.unidoEm = base.arquivo; L.tabela = null; L.duplicata = true; });
        add('info', `${lista.length} arquivos de ${lista[0].catRotulo}: unidos pelo ID do vídeo — ${base.nConteudos} vídeos diferentes.`);
        if(conflitos.length) add('aviso', `${conflitos.length} ${conflitos.length === 1 ? 'vídeo aparece' : 'vídeos aparecem'} com números diferentes em arquivos diferentes: ficou o do export mais recente.`);
      } else if(!lista[0].parte){
        lista.forEach(L => sobrepostos.add(`${L.arquivo} (${L.periodo ? `${dataBR(L.periodo[0])}–${dataBR(L.periodo[1])}` : '?'})`));
      }
    }
    if(sobrepostos.size) add('info', `Arquivos com períodos que se sobrepõem — ${[...sobrepostos].join(' · ')}: nas datas em comum vale o que termina mais tarde, sem somar.`, 'sobreposicao');

    /* ---- 5. o que falta ---- */
    const presentes = new Set(Ls.map(L => L.cat));
    const cats = (plat.categorias || []).filter(c => !c.personalizada);
    const faltam = cats.filter(c => !c.opcional && !presentes.has(c.id));
    const faltamOpc = cats.filter(c => c.opcional && !presentes.has(c.id));
    if(faltam.length) add('confirmar', `Faltam: ${faltam.map(c => c.rotulo).join(', ')}. Dá para importar sem ${faltam.length === 1 ? 'ela' : 'elas'}.`, 'faltas', { faltam: faltam.map(c => c.id) });
    if(faltamOpc.length && Ls.length) add('info', `Opcionais que não vieram: ${faltamOpc.map(c => c.rotulo).join(', ')}.`);

    /* ---- 6. períodos diferentes ENTRE CATEGORIAS (dois exports da mesma
       categoria — o anual e o semanal do LinkedIn — é sobreposição, não
       divergência: a seção 6 da spec cuida dela ao gravar) ---- */
    const perCat = {};
    densas.filter(L => L.periodo).forEach(L => { perCat[L.catRotulo] = juntaPeriodos([perCat[L.catRotulo], L.periodo]); });
    const assin = [...new Set(Object.values(perCat).map(p => p.join('~')))];
    if(assin.length > 1){
      add('confirmar', `Os arquivos cobrem períodos diferentes: ${Object.entries(perCat).map(([c, p]) => `${c} ${dataBR(p[0])}–${dataBR(p[1])}`).join(' · ')}. Tudo é guardado; a análise usa o que cobre o mês.`, 'periodos');
    }

    /* ---- 7. o mês de referência ---- */
    let cobertura = null;
    if(ctx.mesRef){
      const m = ctx.mesRef, ini = m + '-01', fim = m + '-' + pad(diasNoMes(m));
      const dias = new Set();
      for(const L of Ls){
        for(const S of Object.values(L.series || {})) for(const d of Object.keys(S.d)) if(d >= ini && d <= fim) dias.add(d);
        /* o retrato do TikTok Content (um dia) não é cobertura do mês */
        if((L.tabela || L.totais || L.ranking || L.porConteudo) && !(L.tabela && L.tabela.snap) && L.periodo && L.periodo[0] <= fim && L.periodo[1] >= ini){
          for(const d of cadaDia(L.periodo[0] > ini ? L.periodo[0] : ini, L.periodo[1] < fim ? L.periodo[1] : fim)) dias.add(d);
        }
      }
      const lista = [...dias].sort();
      cobertura = { mes: m, dias: lista.length, diasMes: diasNoMes(m), ini: lista[0] || null, fim: lista[lista.length - 1] || null };
      if(!lista.length && Ls.some(L => L.periodo)){
        add('bloqueio', `Nenhum arquivo cobre ${mesExtenso(m)}. Os arquivos vão de ${dataBR(periodo[0])} a ${dataBR(periodo[1])}.`, 'mes', { sugestao: periodo ? periodo[1].slice(0, 7) : null });
      } else if(lista.length && lista.length < cobertura.diasMes){
        add('info', `${mesExtenso(m)[0].toUpperCase() + mesExtenso(m).slice(1)} coberto de ${dataBR(lista[0]).slice(0, 5)} a ${dataBR(lista[lista.length - 1]).slice(0, 5)} (${lista.length} de ${cobertura.diasMes} dias).`, 'mes_parcial');
      }
    }

    /* ---- 8. série quase vazia ---- */
    const todasSeries = series.flatMap(L => Object.values(L.series));
    if(todasSeries.length && periodo && diasEntre(periodo[0], periodo[1]) >= 13){
      const naoZero = new Set();
      todasSeries.forEach(S => Object.entries(S.d).forEach(([d, v]) => { if(v) naoZero.add(d); }));
      if(naoZero.size <= 2) add('confirmar', 'A série está praticamente vazia. Confirme se o export é da página correta.', 'quase_vazia');
    }

    /* ---- 9. "seguidores" que só crescem podem ser o TOTAL ---- */
    for(const L of Ls){
      const cat = (plat.categorias || []).find(c => c.id === L.cat);
      if(!cat || !cat.vigiarEstoque) continue;
      for(const S of Object.values(L.series)){
        const v = Object.keys(S.d).sort().map(d => S.d[d]).filter(x => typeof x === 'number');
        const i0 = v.findIndex(x => x > 0);
        if(i0 < 0) continue;
        const depois = v.slice(i0);
        const naoCai = depois.every((x, i) => i === 0 || x >= depois[i - 1]);
        if(naoCai && new Set(depois).size >= 3)
          add('confirmar', `${L.catRotulo}: os valores só crescem e nunca voltam a zero — pode ser o TOTAL de seguidores (estoque), não novos por dia. Confirme antes de importar.`, 'estoque_' + L.cat);
      }
    }

    /* ---- 10. título que cita outra rede ---- */
    for(const L of Ls){
      if(L.citou && L.citou !== platId)
        add('confirmar', `${L.arquivo}: o título cita ${reg.plataformas[L.citou] ? reg.plataformas[L.citou].nome : L.citou}, mas a importação é de ${plat.nome}. Confirme que é deste perfil.`, 'cita_' + L.arquivo);
    }

    /* ---- 11. o que cada arquivo disse ---- */
    for(const L of Ls) for(const a of L.avisos) add(a.nivel, `${L.catRotulo}: ${a.texto}`, a.id, { arquivo: L.arquivo });

    return { plat: platId, periodo, cobertura, leituras: Ls.filter(L => !L.duplicata), avisos,
      bloqueado: avisos.some(a => a.nivel === 'bloqueio'),
      confirmar: avisos.filter(a => a.nivel === 'confirmar') };
  }

  G.MaestroRedesMotor = {
    versao: 1,
    norm, semAcento, slug, decodificar, lerCsv, detectarSeparador, abrirZip, abrirXlsx, abrir,
    ausente, numero, duracao, data, resolverAno, resolverSequencia, intervalo,
    somarDias, diasEntre, cadaDia, dataBR, mesExtenso, diasNoMes, NOME_MES,
    baseDoTitulo, reconhecer, reconhecerEmOutras, reconhecerAbas, extrair, analisarPeca, lerArquivo, montarPacote,
    juntaPeriodos, periodoDeSerie
  };
})(typeof window !== 'undefined' ? window : globalThis);
