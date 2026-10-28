// Tela operacional do almoxarifado (Aula 07).
// Fala com a API Spring Boot na mesma origem: GET /api/fifo/proximos, GET /api/lotes e POST /api/saidas.
// Se a tela for aberta de outro endereço (ex.: Live Server), troque API por 'http://localhost:8080'
// (e libere CORS no backend).
(() => {
  'use strict';

  const API = '';
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
  function hojeISO() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  // Chamada à API: devolve sempre {status, corpo}; só lança erro se o servidor estiver inacessível.
  async function chamar(caminho, opcoes) {
    const resp = await fetch(API + caminho, opcoes);
    let corpo = null;
    try { corpo = await resp.json(); } catch (e) { /* resposta sem JSON */ }
    return { status: resp.status, corpo };
  }

  // ---------- Conexão ----------
  function marcarConexao(online) {
    const c = $('conexao');
    c.className = 'conexao ' + (online ? 'on' : 'off');
    c.textContent = online ? 'Servidor online' : 'Servidor offline';
  }

  // ---------- Listas ----------
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
    lotes.forEach((l) => {
      let selo = null;
      if ((l.qtdAtual ?? 0) <= 0) selo = { classe: 'esgotado', texto: 'Esgotado' };
      else if (l.validade && l.validade < hoje) selo = { classe: 'vencido', texto: 'Vencido' };
      else if (codigosProximos.has(l.codigoQr)) selo = { classe: 'proximo', texto: 'Próximo a sair' };
      const li = el('li');
      li.appendChild(linhaLote(l, { mostrarProduto: false, selo }));
      ul.appendChild(li);
    });
  }

  async function carregar() {
    try {
      const [prox, todos] = await Promise.all([chamar('/api/fifo/proximos'), chamar('/api/lotes')]);
      if (prox.status !== 200 || todos.status !== 200) throw new Error('resposta inesperada');
      marcarConexao(true);
      desenharProximos(prox.corpo);
      desenharLista(todos.corpo, new Set(prox.corpo.map((l) => l.codigoQr)));
      const d = new Date();
      $('atualizado').textContent = 'Atualizado às ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    } catch (e) {
      marcarConexao(false);
      $('proximos').replaceChildren(el('p', 'vazio', 'Não foi possível carregar os lotes. Verifique a rede e toque em Atualizar.'));
      $('lista').replaceChildren();
    }
  }

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
      mostrarResultado('ok', '\u2713', 'Lote correto: baixa autorizada',
        ['Lote ' + corpo.codigoQr + ': saíram ' + corpo.quantidadeRetirada + ' kg.', 'Saldo atual: ' + corpo.saldoAtual + ' kg.']);
    } else if (status === 400 && msg.startsWith('FIFO violado')) {
      const m = msg.match(/esperado é (\S+) \(fileira ([^)]+)\)/);
      mostrarResultado('bloqueio', '\u2715', 'Violação de FIFO',
        ['Este não é o lote que deve sair primeiro.', m ? 'Retire da fileira ' + m[2] + '.' : msg],
        m ? 'Lote esperado: ' + m[1] : null);
    } else if (status === 400 && msg.startsWith('Lote vencido')) {
      mostrarResultado('bloqueio', '\u2715', 'Lote vencido', [msg + '.', 'Separe o lote e avise o supervisor.']);
    } else if (status === 400) {
      mostrarResultado('alerta', '!', msg.startsWith('Quantidade acima') ? 'Quantidade acima do saldo' : 'Saída bloqueada', [msg]);
    } else if (status === 404) {
      mostrarResultado('alerta', '!', 'Lote não encontrado', [msg || 'Confira o código lido.']);
    } else if (status === 422) {
      const campos = corpo && corpo.campos ? Object.values(corpo.campos) : [msg || 'Confira os dados informados.'];
      mostrarResultado('alerta', '!', 'Dados inválidos', campos);
    } else {
      mostrarResultado('bloqueio', '\u2715', 'Erro no servidor', ['Tente novamente. Se continuar, avise o suporte.']);
    }
  }

  async function confirmarSaida() {
    const botao = $('btn-confirmar');
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

  carregar();
})();
