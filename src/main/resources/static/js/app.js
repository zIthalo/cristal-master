// Tela operacional do almoxarifado (Aula 07 + integração ponta a ponta da Aula 08).
// Fala com a API Spring Boot: GET /api/fifo/proximos, GET /api/lotes, GET /api/movimentacoes e POST /api/saidas.
// Aula 08: a tela se atualiza sozinha (polling), mostra "carregando", avisa em vermelho quando a API cai
// e reage às movimentações geradas pelo simulador (mock/simulador.ps1).
(() => {
  'use strict';

  // Servida pelo próprio Spring (porta 8080) => mesma origem (API = '').
  // Aberta pelo Live Server/Vite/arquivo local => aponta para a API na 8080 (precisa do CorsConfig no backend).
  const PORTAS_DEV = ['5500', '5173', '3000'];
  const API = (location.protocol === 'file:' || PORTAS_DEV.includes(location.port)) ? 'http://localhost:8080' : '';

  const INTERVALO_MS = 3000;   // de quanto em quanto tempo a tela consulta a API
  const LIMITE_MOVS = 15;      // quantas movimentações mostrar
  const TEMPO_LIMITE_MS = 5000; // requisição sem resposta depois disso conta como erro de rede

  const $ = (id) => document.getElementById(id);

  // Cria um elemento com classe e texto (textContent evita injetar HTML vindo do servidor).
  function el(tag, classe, texto) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined && texto !== null) e.textContent = texto;
    return e;
  }

  const pad = (n) => String(n).padStart(2, '0');
  const formatarData = (iso) => (iso ? iso.split('-').reverse().join('/') : '-');
  const horaAgora = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); };
  function hojeISO() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  // Chamada à API: devolve sempre {status, corpo}; só lança erro se o servidor estiver inacessível
  // (rede caída, API desligada, CORS bloqueado ou sem resposta em TEMPO_LIMITE_MS).
  async function chamar(caminho, opcoes = {}) {
    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
    try {
      const resp = await fetch(API + caminho, { ...opcoes, signal: controle.signal, cache: 'no-store' });
      let corpo = null;
      try { corpo = await resp.json(); } catch (e) { /* resposta sem JSON */ }
      return { status: resp.status, corpo };
    } finally {
      clearTimeout(timer);
    }
  }

  // ---------- Conexão e aviso de erro ----------
  function marcarConexao(online) {
    const c = $('conexao');
    c.className = 'conexao ' + (online ? 'on' : 'off');
    c.textContent = online ? 'Servidor online' : 'Servidor offline';
  }

  function mostrarErroApi(texto) {
    const a = $('aviso-erro');
    a.textContent = texto;
    a.hidden = false;
    document.body.classList.add('api-fora');
  }

  function esconderErroApi() {
    $('aviso-erro').hidden = true;
    document.body.classList.remove('api-fora');
  }

  // ---------- Avisos rápidos (toasts) para o que chega do simulador ----------
  function avisar(tipo, texto) {
    const area = $('avisos');
    const t = el('div', 'toast ' + tipo, texto);
    area.prepend(t);
    while (area.children.length > 4) area.lastChild.remove();
    setTimeout(() => t.classList.add('saindo'), 4500);
    setTimeout(() => t.remove(), 5000);
  }

  // ---------- Listas de lotes ----------
  let codigosConhecidos = null; // null = primeira carga (não destaca nada)

  function linhaLote(lote, opcoes) {
    const b = el('button', 'linha-lote');
    b.type = 'button';
    b.addEventListener('click', () => {
      $('codigo').value = lote.codigoQr;
      $('quantidade').focus();
    });
    const esq = el('div');
    if (opcoes.mostrarProduto) esq.appendChild(el('div', 'produto', lote.produto || 'Sem produto'));
    esq.appendChild(el('div', 'codigo', lote.codigoQr));
    b.appendChild(esq);
    b.appendChild(el('span', 'fita', lote.fileira || '-'));
    const meta = el('div', 'meta');
    if (!opcoes.mostrarProduto) meta.appendChild(el('span', null, lote.produto || 'Sem produto'));
    meta.appendChild(el('span', null, 'Saldo ' + (lote.qtdAtual ?? 0) + ' kg'));
    meta.appendChild(el('span', null, 'Validade ' + formatarData(lote.validade)));
    b.appendChild(meta);
    if (opcoes.selo) b.appendChild(el('span', 'selo ' + opcoes.selo.classe, opcoes.selo.texto));
    return b;
  }

  function desenharProximos(lotes) {
    const area = $('proximos');
    area.replaceChildren();
    if (!lotes.length) {
      area.appendChild(el('p', 'vazio', 'Nenhum lote disponível para saída.'));
      return;
    }
    lotes.forEach((l) => area.appendChild(linhaLote(l, { mostrarProduto: true })));
  }

  function desenharLista(lotes, codigosProximos) {
    const ul = $('lista');
    ul.replaceChildren();
    if (!lotes.length) {
      ul.appendChild(el('li', 'vazio', 'Nenhum lote cadastrado ainda.'));
      return;
    }
    const hoje = hojeISO();
    const novos = [];
    lotes.forEach((l) => {
      let selo = null;
      if ((l.qtdAtual ?? 0) <= 0) selo = { classe: 'esgotado', texto: 'Esgotado' };
      else if (l.validade && l.validade < hoje) selo = { classe: 'vencido', texto: 'Vencido' };
      else if (codigosProximos.has(l.codigoQr)) selo = { classe: 'proximo', texto: 'Próximo a sair' };
      const li = el('li');
      // Lote que não existia na consulta anterior = entrada nova (ex.: cadastrada pelo simulador).
      if (codigosConhecidos && !codigosConhecidos.has(l.codigoQr)) {
        li.className = 'novo';
        novos.push(l);
      }
      li.appendChild(linhaLote(l, { mostrarProduto: false, selo }));
      ul.appendChild(li);
    });
    novos.forEach((l) => avisar('info', 'Novo lote registrado: ' + l.codigoQr + ' (' + (l.produto || 'sem produto') + ', fileira ' + (l.fileira || '-') + ')'));
    codigosConhecidos = new Set(lotes.map((l) => l.codigoQr));
  }

  // ---------- Movimentações ao vivo ----------
  let ultimoIdMov = null; // null = primeira carga (não gera aviso)

  function linhaMov(m, nova) {
    const bloqueada = String(m.tipo).toUpperCase().includes('BLOQUEADA');
    const li = el('li', 'mov ' + (bloqueada ? 'bloqueada' : 'saida') + (nova ? ' novo' : ''));
    li.appendChild(el('span', 'mov-icone', bloqueada ? '✕' : '✓'));
    const corpo = el('div', 'mov-corpo');
    const titulo = (bloqueada ? 'Bloqueada' : 'Saída') + ' · ' + (m.codigoQr || '?') + (m.quantidade != null ? ' · ' + m.quantidade + ' kg' : '');
    corpo.appendChild(el('div', 'mov-titulo', titulo));
    if (m.motivo) corpo.appendChild(el('div', 'mov-motivo', m.motivo));
    li.appendChild(corpo);
    const hora = m.dataHora ? String(m.dataHora).replace(' ', 'T').slice(11, 19) : '';
    li.appendChild(el('span', 'mov-hora', hora));
    return li;
  }

  function desenharMovimentacoes(movs) {
    const ul = $('movimentacoes');
    ul.replaceChildren();
    if (!movs.length) {
      ul.appendChild(el('li', 'vazio', 'Nenhuma movimentação registrada ainda.'));
      return;
    }
    const idAnterior = ultimoIdMov;
    movs.forEach((m) => {
      const nova = idAnterior !== null && m.id > idAnterior;
      ul.appendChild(linhaMov(m, nova));
      if (nova) {
        const bloqueada = String(m.tipo).toUpperCase().includes('BLOQUEADA');
        avisar(bloqueada ? 'erro' : 'ok', (bloqueada ? 'Tentativa bloqueada: ' : 'Saída registrada: ') + m.codigoQr + (m.motivo ? ' (' + m.motivo + ')' : ''));
      }
    });
    ultimoIdMov = Math.max(idAnterior ?? 0, ...movs.map((m) => m.id || 0));
  }

  // ---------- Carga e atualização automática ----------
  let carregando = false;
  let primeiraCarga = true;

  function mostrarCarregando() {
    const msg = () => el('p', 'vazio carregando', 'Carregando...');
    $('proximos').replaceChildren(msg());
    $('lista').replaceChildren(el('li', 'vazio carregando', 'Carregando lotes...'));
    $('movimentacoes').replaceChildren(el('li', 'vazio carregando', 'Carregando movimentações...'));
  }

  async function carregar() {
    if (carregando) return;           // evita duas consultas ao mesmo tempo
    carregando = true;
    if (primeiraCarga) mostrarCarregando();
    $('atualizado').textContent = 'Atualizando...';
    $('atualizado').classList.add('pulsando');
    try {
      const [prox, todos, movs] = await Promise.all([
        chamar('/api/fifo/proximos'),
        chamar('/api/lotes'),
        chamar('/api/movimentacoes?limite=' + LIMITE_MOVS).catch(() => null),
      ]);
      if (prox.status !== 200 || todos.status !== 200) {
        throw Object.assign(new Error('http'), { http: prox.status !== 200 ? prox.status : todos.status });
      }
      marcarConexao(true);
      esconderErroApi();
      desenharProximos(prox.corpo);
      desenharLista(todos.corpo, new Set(prox.corpo.map((l) => l.codigoQr)));
      if (movs && movs.status === 200 && Array.isArray(movs.corpo)) {
        desenharMovimentacoes(movs.corpo);
      } else if (movs && movs.status === 404) {
        $('movimentacoes').replaceChildren(el('li', 'vazio', 'Rota GET /api/movimentacoes ainda não existe no backend.'));
      }
      primeiraCarga = false;
      $('atualizado').textContent = 'Atualizado às ' + horaAgora() + ' · automático a cada ' + INTERVALO_MS / 1000 + ' s';
    } catch (e) {
      marcarConexao(false);
      const motivo = e.http
        ? 'A API respondeu com erro ' + e.http + '.'
        : 'Sem comunicação com a API (servidor desligado, rede caída ou CORS bloqueado).';
      mostrarErroApi('⚠ ' + motivo + ' Tentando de novo a cada ' + INTERVALO_MS / 1000 + ' s. Última tentativa às ' + horaAgora() + '.');
      if (primeiraCarga) {
        $('proximos').replaceChildren(el('p', 'vazio', 'Não foi possível carregar os lotes.'));
        $('lista').replaceChildren();
        $('movimentacoes').replaceChildren();
      }
      // Depois da primeira carga, mantém os últimos dados na tela (esmaecidos pelo CSS) em vez de apagar tudo.
      $('atualizado').textContent = 'Falha às ' + horaAgora();
    } finally {
      $('atualizado').classList.remove('pulsando');
      carregando = false;
    }
  }

  // Polling: consulta a API a cada INTERVALO_MS. Pausa com a aba escondida para não gastar bateria/rede.
  function cicloAutomatico() {
    if (!document.hidden) carregar();
    setTimeout(cicloAutomatico, INTERVALO_MS);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) carregar(); });

  // ---------- Resultado da saída ----------
  function mostrarResultado(tipo, simbolo, titulo, detalhes, esperado) {
    const r = $('resultado');
    r.className = 'resultado ' + tipo;
    r.replaceChildren();
    r.appendChild(el('div', 'simbolo', simbolo));
    const corpo = el('div');
    corpo.appendChild(el('p', 'titulo', titulo));
    if (esperado) corpo.appendChild(el('p', 'esperado', esperado));
    (detalhes || []).forEach((d) => corpo.appendChild(el('p', 'detalhe', d)));
    r.appendChild(corpo);
    r.hidden = false;
    r.scrollIntoView({ block: 'nearest' });
  }

  // Traduz a resposta da API (200, 400, 404, 422...) em um cartão de estado.
  function exibirResposta(resp) {
    const { status, corpo } = resp;
    const msg = corpo && corpo.erro ? corpo.erro : '';
    if (status === 200) {
      mostrarResultado('ok', '✓', 'Lote correto: baixa autorizada',
        ['Lote ' + corpo.codigoQr + ': saíram ' + corpo.quantidadeRetirada + ' kg.', 'Saldo atual: ' + corpo.saldoAtual + ' kg.']);
    } else if (status === 400 && msg.startsWith('FIFO violado')) {
      const m = msg.match(/esperado é (\S+) \(fileira ([^)]+)\)/);
      mostrarResultado('bloqueio', '✕', 'Violação de FIFO',
        ['Este não é o lote que deve sair primeiro.', m ? 'Retire da fileira ' + m[2] + '.' : msg],
        m ? 'Lote esperado: ' + m[1] : null);
    } else if (status === 400 && msg.startsWith('Lote vencido')) {
      mostrarResultado('bloqueio', '✕', 'Lote vencido', [msg + '.', 'Separe o lote e avise o supervisor.']);
    } else if (status === 400) {
      mostrarResultado('alerta', '!', msg.startsWith('Quantidade acima') ? 'Quantidade acima do saldo' : 'Saída bloqueada', [msg]);
    } else if (status === 404) {
      mostrarResultado('alerta', '!', 'Lote não encontrado', [msg || 'Confira o código lido.']);
    } else if (status === 422) {
      const campos = corpo && corpo.campos ? Object.values(corpo.campos) : [msg || 'Confira os dados informados.'];
      mostrarResultado('alerta', '!', 'Dados inválidos', campos);
    } else {
      mostrarResultado('bloqueio', '✕', 'Erro no servidor', ['Tente novamente. Se continuar, avise o suporte.']);
    }
  }

  async function confirmarSaida() {
    const botao = $('btn-confirmar');
    if (botao.disabled) return;
    const codigo = $('codigo').value.trim();
    const qtdTexto = $('quantidade').value.trim();
    // Os campos são enviados como estão: quem valida é a API (422 para o que estiver fora do esquema).
    const payload = { codigoQr: codigo, quantidade: qtdTexto === '' ? null : Number(qtdTexto) };
    botao.disabled = true;
    botao.textContent = 'Enviando...';
    try {
      const resp = await chamar('/api/saidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      marcarConexao(true);
      esconderErroApi();
      exibirResposta(resp);
      if (resp.status === 200) {
        $('codigo').value = '';
        $('quantidade').value = '';
      }
      await carregar();
    } catch (e) {
      marcarConexao(false);
      mostrarResultado('alerta', '!', 'Sem conexão com o servidor', ['Nada foi gravado. Verifique a rede e tente de novo.']);
    } finally {
      botao.disabled = false;
      botao.textContent = 'Confirmar saída';
    }
  }

  // ---------- Leitura de QR Code pela câmera ----------
  // Usa BarcodeDetector (Chrome/Android). Exige HTTPS ou localhost; sem isso, digite o código.
  let fluxo = null;
  let lendo = false;

  function pararCamera() {
    lendo = false;
    if (fluxo) { fluxo.getTracks().forEach((t) => t.stop()); fluxo = null; }
    const dlg = $('dlg-qr');
    if (dlg.open) dlg.close();
  }

  async function lerQr() {
    if (!window.isSecureContext) {
      mostrarResultado('alerta', '!', 'Câmera indisponível', ['A câmera só funciona em HTTPS ou em localhost.', 'Digite o código do lote.']);
      return;
    }
    try {
      fluxo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    } catch (e) {
      mostrarResultado('alerta', '!', 'Sem acesso à câmera', ['Permita o uso da câmera ou digite o código do lote.']);
      return;
    }
    const video = $('video');
    video.srcObject = fluxo;
    $('dlg-qr').showModal();
    await video.play();
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    lendo = true;
    while (lendo) {
      try {
        const achados = await detector.detect(video);
        if (achados.length) {
          $('codigo').value = achados[0].rawValue.trim();
          pararCamera();
          $('quantidade').focus();
          return;
        }
      } catch (e) { /* quadro ainda não disponível */ }
      await new Promise((ok) => setTimeout(ok, 250));
    }
  }

  // ---------- Início ----------
  $('btn-confirmar').addEventListener('click', confirmarSaida);
  $('btn-atualizar').addEventListener('click', carregar);
  $('btn-cancelar-qr').addEventListener('click', pararCamera);
  $('dlg-qr').addEventListener('close', pararCamera);
  $('codigo').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('quantidade').focus(); });
  $('quantidade').addEventListener('keydown', (e) => { if (e.key === 'Enter') confirmarSaida(); });

  if ('BarcodeDetector' in window) {
    $('btn-qr').hidden = false;
    $('btn-qr').addEventListener('click', lerQr);
  }

  // PWA: o service worker só funciona em HTTPS ou localhost.
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* sem service worker a tela continua funcionando */ });
  }

  cicloAutomatico();
})();
