/* Adapted from docs/javascripts/lerobot_ports.js: saved form, immutable
 * templates, code/inline replacement and Material document$ lifecycle.
 * AWS adaptation uses an explicit token allowlist; never infers CLI arguments. */
(() => {
  'use strict';
  const role = document.querySelector('meta[name="aws-guide-role"]')?.content;
  if (!['attendee', 'instructor', 'environment'].includes(role)) return;
  const storageKey = `lerobot.aws-guide.${role}.v1`;
  const atom = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;
  const path = value => value.length <= 512 && !/[\x00-\x1f\x7f]/.test(value) && !value.startsWith('~') && !value.includes('://') && /^(?:\/|\.\/|[A-Za-z0-9])/.test(value);
  const fields = {
    EVENT_ID: ['開催 ID', v => /^[a-z][a-z0-9-]{1,14}[a-z0-9]$/.test(v), '英小文字で始まる3〜16文字。英小文字・数字・ハイフン、末尾ハイフン不可'],
    ATTENDEE_ID: ['受講者 ID', v => /^[a-z][a-z0-9-]{1,30}$/.test(v) && v !== 'shared', '英小文字で始まる2〜31文字。英小文字・数字・ハイフン。sharedは予約語'],
    BUCKET: ['S3 バケット名', v => /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(v), '3〜63文字。英小文字・数字・ドット・ハイフン'],
    REGION: ['AWS リージョン', v => /^[a-z]{2}(?:-[a-z]+)+-\d+$/.test(v), 'リージョンの識別子を入力'],
    PROFILE: ['AWS プロファイル', v => /^\S+$/.test(v) && !/[\x00-\x1f\x7f]/.test(v), '空白を含まないプロファイル名。@や:も使えます'],
    CONFIG_DIR: ['開催設定ディレクトリ', path, '絶対パスまたは相対パス。~ は使わず、空白はそのまま入力'],
    DATASET_DIR: ['EC2 のデータセットディレクトリ', v => path(v) && v.startsWith('/'), 'EC2上の絶対パス。引用符を付けず入力'],
    DATASET_REPO_ID: ['データセット識別名', v => /^[A-Za-z0-9][A-Za-z0-9_./-]{0,191}$/.test(v), '講師指定の識別名。必要なら所有者/名前'],
    RELEASE: ['教材の版', v => atom.test(v) && v.length <= 64, '英数字で始まる64文字以内。公開済み版は上書きしない'],
    MANIFEST_SHA: ['教材 manifest SHA-256', v => /^[a-fA-F0-9]{64}$/.test(v), 'release buildが出力する64桁のハッシュ'],
    MATERIALS_DIR: ['公開する教材ディレクトリ', path, '絶対パスまたは相対パス。引用符を付けず入力'],
    ACCOUNT_ID: ['AWS アカウント ID', v => /^\d{12}$/.test(v), '対象アカウントの12桁の番号'],
    AMI_ID: ['使用する AMI ID', v => /^ami-(?:[a-f0-9]{8}|[a-f0-9]{17})$/.test(v), '通常の構築対象。元・新・削除対象AMIは各手順で別途指定'],
    INSTANCE_ID: ['対象 EC2 インスタンス ID', v => /^i-(?:[a-f0-9]{8}|[a-f0-9]{17})$/.test(v), '通常の確認対象。一時構築EC2は各手順で別途指定'],
    INSTANCE_TYPE: ['EC2 インスタンスタイプ', v => /^[a-z][a-z0-9-]*\.[a-z0-9]+$/.test(v), '管理者が選定したタイプ'],
  };
  const roleFields = {
    attendee: ['EVENT_ID','ATTENDEE_ID','BUCKET','REGION','DATASET_DIR','DATASET_REPO_ID'],
    instructor: ['EVENT_ID','ATTENDEE_ID','BUCKET','REGION','PROFILE','CONFIG_DIR','RELEASE','MANIFEST_SHA','MATERIALS_DIR'],
    environment: ['EVENT_ID','ATTENDEE_ID','BUCKET','REGION','PROFILE','CONFIG_DIR','ACCOUNT_ID','AMI_ID','INSTANCE_ID','INSTANCE_TYPE'],
  }[role];
  const allowed = new Set(roleFields);
  const originals = new WeakMap();
  const controls = new WeakMap();
  let state = {};
  let storageAvailable = true;
  const shellQuote = value => "'" + value.replaceAll("'", "'\"'\"'") + "'";
  function load() {
    state = {};
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      for (const key of roleFields) {
        if (typeof saved[key] === 'string' && fields[key][1](saved[key])) state[key] = saved[key];
      }
    } catch { storageAvailable = false; }
  }
  function save() {
    try {
      if (Object.keys(state).length) localStorage.setItem(storageKey, JSON.stringify(state));
      else localStorage.removeItem(storageKey);
    } catch { storageAvailable = false; }
  }
  function template(node) {
    if (!originals.has(node)) originals.set(node, node.textContent || '');
    return originals.get(node);
  }
  function render(text) {
    return text.replace(/\{\{([A-Z_]+?)(_SH|_YAML)?\}\}/g, (token, key, quote) => {
      if (!allowed.has(key)) return token;
      const value = state[key];
      if (!value) return `<未設定：${fields[key][0]}>`;
      return quote === '_YAML' ? JSON.stringify(value) : quote ? shellQuote(value) : value;
    });
  }
  function unresolved(text) {
    // Deliberate template syntax only; do not rewrite arbitrary CLI values.
    return /\{\{[A-Z_]+\}\}|<[^<>\n]+>/.test(text);
  }
  async function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); return; } catch { /* fallback */ }
    }
    const input = document.createElement('textarea');
    input.value = text; input.style.position = 'fixed'; input.style.opacity = '0';
    document.body.append(input); input.select();
    const ok = document.execCommand('copy'); input.remove();
    if (!ok) throw new Error('copy unavailable');
  }
  function refresh() {
    const article = document.querySelector('article');
    if (!article) return;
    for (const code of article.querySelectorAll('pre > code, :not(pre) > code')) {
      if (code.closest('.lerobot-port-panel, .aws-controls')) continue;
      const original = template(code);
      const rendered = render(original);
      if (code.textContent !== rendered) code.textContent = rendered;
      if (!code.closest('pre')) continue;
      let ui = controls.get(code);
      if (!ui) {
        const wrapper = document.createElement('div'); wrapper.className = 'aws-controls';
        const button = document.createElement('button'); button.type = 'button';
        button.className = 'lerobot-port-btn aws-copy'; button.textContent = 'コピー';
        button.setAttribute('aria-label', 'このコードをコピー');
        const status = document.createElement('span'); status.setAttribute('role', 'status');
        wrapper.append(button, status); code.closest('pre').after(wrapper);
        button.addEventListener('click', async () => {
          try { await copy(code.textContent); status.textContent = unresolved(code.textContent) ? 'コピーしました。未設定・手動指定の値を置き換えてから実行してください。' : 'コピーしました'; }
          catch { status.textContent = 'コピーできませんでした。コードを選択してコピーしてください。'; }
        });
        ui = {button,status}; controls.set(code,ui);
      }
      ui.status.textContent = unresolved(rendered) ? '未設定・手動置換の項目があります。値を確認してから実行してください。' : '';
    }
    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.parentElement.closest('code, pre, script, style, .lerobot-port-panel, .aws-controls')) nodes.push(node);
    }
    for (const node of nodes) {
      const original = template(node);
      if (original.includes('{{')) node.textContent = render(original);
    }
    for (const status of document.querySelectorAll('[data-aws-save-status]')) {
      status.textContent = storageAvailable
        ? '有効な値だけを、このブラウザのこの役割用に保存します。空欄の項目は未設定です。'
        : 'ブラウザの保存機能を使用できません。このページ内だけに反映します。';
    }
  }
  function panel(host) {
    if (host.dataset.initialized) return;
    host.dataset.initialized = 'true'; host.classList.add('lerobot-port-panel');
    const form = document.createElement('form'); form.className = 'lerobot-port-form';
    form.autocomplete = 'off'; form.addEventListener('submit', e => e.preventDefault());
    for (const key of roleFields) {
      const row = document.createElement('div'); row.className = 'lerobot-port-row';
      const label = document.createElement('label'); label.className = 'lerobot-port-label';
      label.htmlFor = `aws-${host.closest('dialog') ? 'modal' : 'page'}-${key}`; label.textContent = fields[key][0];
      const cell = document.createElement('div');
      const input = document.createElement('input'); input.id = label.htmlFor;
      input.className = 'lerobot-port-input'; input.value = state[key] || '';
      input.dataset.awsField = key; input.type = 'text'; input.spellcheck = false; input.autocomplete = 'off';
      const hint = document.createElement('small'); hint.id = `${input.id}-hint`;
      hint.textContent = fields[key][2]; input.setAttribute('aria-describedby',hint.id);
      const error = document.createElement('div'); error.className = 'aws-error'; error.setAttribute('aria-live','polite');
      input.addEventListener('input', () => {
        const value = input.value;
        const valid = value === '' || fields[key][1](value);
        input.setAttribute('aria-invalid', String(!valid));
        error.textContent = valid ? '' : '形式を確認してください。この値は保存・反映しません。';
        delete state[key]; if (value && valid) state[key] = value;
        save(); syncInputs(input); refresh();
      });
      cell.append(input,hint,error); row.append(label,cell); form.append(row);
    }
    const actions = document.createElement('div'); actions.className = 'lerobot-port-actions';
    const reset = document.createElement('button'); reset.type = 'button';
    reset.className = 'lerobot-port-btn'; reset.textContent = '入力と保存をリセット';
    reset.addEventListener('click', () => {
      state = {}; save();
      for (const input of form.querySelectorAll('input')) { input.value = ''; input.setAttribute('aria-invalid','false'); }
      for (const error of form.querySelectorAll('.aws-error')) error.textContent = '';
      syncInputs(); refresh();
    });
    actions.append(reset); form.append(actions);
    const status = document.createElement('p'); status.dataset.awsSaveStatus = ''; status.setAttribute('role','status');
    host.append(form,status);
  }
  function syncInputs(source) {
    for (const input of document.querySelectorAll('[data-aws-field]')) {
      if (input === source) continue;
      input.value = state[input.dataset.awsField] || '';
      input.setAttribute('aria-invalid', 'false');
      input.closest('.lerobot-port-row').querySelector('.aws-error').textContent = '';
    }
  }
  // The reference PoC guide provides a launch button + modal shared across pages.
  // Use a native dialog here for focus containment, Escape and inert background.
  function modal() {
    const header = document.querySelector('.md-header__inner');
    if (!header || document.querySelector('#aws-values-dialog')) return;
    const trigger = document.createElement('button');
    trigger.type = 'button'; trigger.className = 'aws-settings-trigger';
    trigger.textContent = '各種値の設定';
    trigger.setAttribute('aria-label', '各種値の設定を開く');
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', 'aws-values-dialog');
    const dialog = document.createElement('dialog');
    dialog.id = 'aws-values-dialog'; dialog.className = 'aws-values-dialog md-typeset';
    dialog.setAttribute('aria-label', '各種値の設定');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-describedby', 'aws-values-description');
    const top = document.createElement('div'); top.className = 'aws-dialog-heading';
    const title = document.createElement('h2'); title.id = 'aws-values-title'; title.textContent = '各種値の設定';
    const close = document.createElement('button'); close.type = 'button'; close.className = 'lerobot-port-btn';
    close.textContent = '閉じる'; close.setAttribute('aria-label', '設定を閉じる');
    close.addEventListener('click', () => dialog.close());
    top.append(title, close);
    const description = document.createElement('p'); description.id = 'aws-values-description';
    description.textContent = '入力すると、このページの本文とコマンドにすぐ反映されます。値はこの役割の設定ページと共通です。秘密情報や期限付きURLは入力しないでください。';
    const host = document.createElement('div'); host.dataset.awsValuesPanel = '';
    dialog.append(top,description,host); document.body.append(dialog);
    const search = header.querySelector('[data-md-component="search"]');
    header.insertBefore(trigger, search || null);
    let previousOverflow = '';
    trigger.addEventListener('click', () => {
      syncInputs(); refresh(); previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden'; dialog.showModal(); dialog.scrollTop = 0;
      dialog.querySelector('input')?.focus({preventScroll:true});
    });
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialog.querySelectorAll('button, input, select, textarea, a[href], [tabindex]'))
        .filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    dialog.addEventListener('close', () => {
      document.body.style.overflow = previousOverflow;
      trigger.focus({preventScroll:true});
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
  }
  function init() { load(); modal(); for (const host of document.querySelectorAll('[data-aws-values-panel]')) panel(host); syncInputs(); refresh(); }
  window.addEventListener('storage', event => { if (event.key === storageKey) { load(); location.reload(); } });
  if (window.document$?.subscribe) window.document$.subscribe(init);
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
