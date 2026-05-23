import './style.css';
const PROFILE = {"day":"Day090","title":"Worry Parking Lot","display_name_ja":"ぐるぐる考え駐車場","one_sentence":"寝る前の考えすぎを、今できること・明日置くこと・手放すことに停めるツール","purpose_line_ja":"寝る前の考えすぎを、今できること・明日置くこと・手放すことに停めるツールです。","use_case_line_ja":"寝る前、頭の中で心配が回り続けて眠りに入りにくい時に使います。","how_it_works_line_ja":"今夜扱う1台と明日置く枠を見る。","core_action":"emotional_parking","family":"worry_loop_parking","mechanic":"parking_lot_place","input_style":"free_note_cards","output_style":"parking_map","output_label":"今夜はこの一手です","audience_promise":"寝る前に扱う心配を一つに絞れる。","publish_hook":"心配ごと、今できる小さな行動、期限、相手を入れると、今夜の1台だけが出口に出て残りは駐車枠に置ける。","engine":"brief_driven","interaction_archetype":"parking_lot_place","page_archetype":"parking_lot","ui_variant":"worry-parking","intro_variant":"worry_parking_lot","interaction_model":"editable_worry_cards_to_parking_lot","primary_layout":"worry_note_editor_with_parking_map","result_presentation_style":"tonight_action_and_parked_worries","palette_motif":"心配駐車場ナイト","main_cta":"寝る前の心配で試す","input_panel_title":"心配と小さな一手を足す","sample_panel_title":"寝る前の頭の中で試す","guide_panel_title":"駐車場の見どころ","hero_panel_label":"今夜扱う一台","output_shape":"parking_lot","state_model":"parking_lot_place_state","core_loop":"free_note_cards -> parking_lot_place -> parking_map","component_pack":"parking_lot+parking_map","scaffold_id":"brief_canvas","single_shot_text_generator":false};
const byId = (id) => document.getElementById(id);
const state = {
  tokens: ['買う', '待つ', '比べる', '今週中'],
  lock: false,
  history: [],
  wizardStep: 0,
  wizardAnswers: {},
  matrix: { HH: [], HL: [], LH: [], LL: [] },
  options: [],
  slots: { morning: [], afternoon: [], evening: [] },
  board: { todo: [], doing: [], done: [] },
  missions: ['5分で試す', '2案比較する', '短文で説明する'],
  score: 0,
  round: 0,
  helpers: {}
};

boot();

function boot() {
  switch (PROFILE.scaffold_id) {
    case 'brief_canvas': setupBriefCanvas(); break;
    case 'card_deck_board': setupCardDeck(); break;
    case 'wizard_stepper': setupWizard(); break;
    case 'matrix_mapper': setupMatrix(); break;
    case 'weighted_calculator': setupWeightedCalc(); break;
    case 'slot_checklist_planner': setupSlotPlanner(); break;
    case 'flow_board': setupFlowBoard(); break;
    case 'roulette_game': setupRoulette(); break;
    default: setupFallback(); break;
  }
  setupCommonUi();
}

function setupCommonUi() {
  const btn = byId('sampleFillBtn');
  if (btn) {
    btn.addEventListener('click', runSample);
  }
  updateCaptureReady();
}

function runSample() {
  switch (PROFILE.scaffold_id) {
    case 'brief_canvas':
      state.helpers.runBriefSample?.();
      break;
    case 'card_deck_board':
      state.tokens = ['買う', '待つ', '比べる', '今週中'];
      renderTokenPool(byId('tokenList'));
      byId('drawBtn')?.click();
      break;
    case 'wizard_stepper':
      state.wizardAnswers = { speed: '速度', risk: '中くらい', ownership: '自分' };
      state.wizardStep = 2;
      state.helpers.renderStep?.();
      break;
    case 'matrix_mapper':
      state.matrix = {
        HH: ['請求トラブル'],
        HL: ['FAQ更新'],
        LH: ['通知チェック'],
        LL: ['色の微調整']
      };
      renderMatrix();
      break;
    case 'weighted_calculator':
      state.options = [
        { name: 'A案', speed: 5, quality: 3, cost: 4 },
        { name: 'B案', speed: 3, quality: 5, cost: 2 }
      ];
      state.helpers.recalc?.();
      break;
    case 'slot_checklist_planner':
      state.slots = {
        morning: [{ text: '請求APIを直す', done: false }],
        afternoon: [{ text: '動作確認をする', done: false }],
        evening: [{ text: '共有メモを書く', done: false }]
      };
      renderSlots();
      break;
    case 'flow_board':
      state.board = {
        todo: [{ id: 1, title: '仕様を確認する' }],
        doing: [{ id: 2, title: '画面を直す' }],
        done: [{ id: 3, title: '不具合を再現した' }]
      };
      renderBoard();
      break;
    case 'roulette_game':
      state.missions = ['5分だけ片づける', '今の案を1つ比べる', '短く言い換える'];
      state.helpers.renderPool?.();
      byId('spinBtn')?.click();
      break;
    default:
      state.helpers.runBriefSample?.();
      break;
  }
  window.setTimeout(() => updateCaptureReady(), 120);
}

function ensureCaptureMarker() {
  let marker = byId('captureReadyMarker');
  if (!marker) {
    marker = document.createElement('div');
    marker.id = 'captureReadyMarker';
    marker.hidden = true;
    document.body.appendChild(marker);
  }
  return marker;
}

function detectResultVisible() {
  const resultZone = byId('briefResultZone')
    || byId('cardStack')
    || byId('wizardSummary')
    || byId('scoreTable')
    || byId('slotMorning')
    || byId('laneTodo')
    || byId('wheelFace');
  if (!resultZone) return false;
  const text = (resultZone.innerText || '').replace(/\s+/g, ' ').trim();
  if (!text) return false;
  return !text.includes('まだ結果がありません');
}

function updateCaptureReady(extra = {}) {
  const readyState = {
    title: Boolean(document.querySelector('[data-ready-role="title"]')),
    primaryCta: Boolean(document.querySelector('[data-ready-role="primary-cta"]')),
    identityBlock: Boolean(document.querySelector('[data-ready-role="identity-block"]')),
    startBlock: Boolean(document.querySelector('[data-ready-role="start-block"]')),
    outputPreview: Boolean(document.querySelector('[data-ready-role="output-preview"]')),
    resultVisible: detectResultVisible(),
    ...extra
  };
  readyState.screenshotReady = readyState.title
    && readyState.primaryCta
    && readyState.identityBlock
    && readyState.startBlock
    && readyState.outputPreview
    && readyState.resultVisible;
  const marker = ensureCaptureMarker();
  Object.entries(readyState).forEach(([key, value]) => {
    marker.dataset[key] = String(Boolean(value));
  });
  marker.textContent = JSON.stringify(readyState);
  window.__CAPTURE_READY__ = readyState;
}

function setupCardDeck() {
  const tokenInput = byId('tokenInput');
  const tokenList = byId('tokenList');
  const cardStack = byId('cardStack');
  const historyList = byId('historyList');
  byId('addTokenBtn').addEventListener('click', () => {
    const v = (tokenInput.value || '').trim();
    if (!v) return;
    state.tokens.push(v);
    tokenInput.value = '';
    renderTokenPool(tokenList);
  });
  byId('drawBtn').addEventListener('click', () => {
    if (state.lock) return;
    const picks = shuffle([...state.tokens]).slice(0, Math.min(3, state.tokens.length));
    cardStack.innerHTML = picks.map((x) => `<div class="card">${escapeHtml(x)}</div>`).join('');
    state.history.unshift(picks.join(' × '));
    state.history = state.history.slice(0, 12);
    historyList.innerHTML = state.history.map((x) => `<li>${escapeHtml(x)}</li>`).join('');
  });
  byId('lockBtn').addEventListener('click', () => { state.lock = !state.lock; });
  renderTokenPool(tokenList);
}

function renderTokenPool(el) {
  el.innerHTML = state.tokens.map((x) => `<span class="chip">${escapeHtml(x)}</span>`).join('');
}

function setupWizard() {
  const questions = [
    { key: 'speed', q: '最優先はどれ?', c: ['速度', '品質', 'コスト'] },
    { key: 'risk', q: '許容できるリスクは?', c: ['低い', '中くらい', '高い'] },
    { key: 'ownership', q: '主導者は?', c: ['自分', 'チーム', '外部'] }
  ];
  const stepBadge = byId('stepBadge');
  const questionText = byId('questionText');
  const choiceGroup = byId('choiceGroup');
  const summary = byId('wizardSummary');
  byId('prevStepBtn').addEventListener('click', () => { state.wizardStep = Math.max(0, state.wizardStep - 1); renderStep(); });
  byId('nextStepBtn').addEventListener('click', () => {
    const cur = questions[state.wizardStep];
    const selected = document.querySelector('input[name="wizardChoice"]:checked');
    if (selected) state.wizardAnswers[cur.key] = selected.value;
    state.wizardStep = Math.min(questions.length - 1, state.wizardStep + 1);
    renderStep();
  });
  function renderStep() {
    const cur = questions[state.wizardStep];
    stepBadge.textContent = `Step ${state.wizardStep + 1}/${questions.length}`;
    questionText.textContent = cur.q;
    choiceGroup.innerHTML = cur.c.map((x) => `<label class="choice"><input type="radio" name="wizardChoice" value="${escapeHtml(x)}" ${state.wizardAnswers[cur.key]===x?'checked':''}>${escapeHtml(x)}</label>`).join('');
    summary.textContent = Object.entries(state.wizardAnswers).map(([k,v]) => `${k}: ${v}`).join('\n') || 'まだ回答がありません';
  }
  state.helpers.renderStep = renderStep;
  renderStep();
}

function setupMatrix() {
  const inputName = byId('matrixItemName');
  const impact = byId('impactRange');
  const urgency = byId('urgencyRange');
  byId('addMatrixItemBtn').addEventListener('click', () => {
    const name = (inputName.value || '').trim();
    if (!name) return;
    const i = Number(impact.value);
    const u = Number(urgency.value);
    const key = i >= 3 && u >= 3 ? 'HH' : i >= 3 ? 'HL' : u >= 3 ? 'LH' : 'LL';
    state.matrix[key].push(name);
    inputName.value = '';
    renderMatrix();
  });
  renderMatrix();
}

function renderMatrix() {
  byId('qHH').innerHTML = state.matrix.HH.length ? state.matrix.HH.map((x) => `<li>${escapeHtml(x)}</li>`).join('') : '<li class="empty-state">まだ項目がありません</li>';
  byId('qHL').innerHTML = state.matrix.HL.length ? state.matrix.HL.map((x) => `<li>${escapeHtml(x)}</li>`).join('') : '<li class="empty-state">まだ項目がありません</li>';
  byId('qLH').innerHTML = state.matrix.LH.length ? state.matrix.LH.map((x) => `<li>${escapeHtml(x)}</li>`).join('') : '<li class="empty-state">まだ項目がありません</li>';
  byId('qLL').innerHTML = state.matrix.LL.length ? state.matrix.LL.map((x) => `<li>${escapeHtml(x)}</li>`).join('') : '<li class="empty-state">まだ項目がありません</li>';
}

function setupWeightedCalc() {
  const meter = byId('weightMeter');
  const scoreTable = byId('scoreTable');
  const recalc = () => {
    const ws = Number(byId('wSpeed').value), wq = Number(byId('wQuality').value), wc = Number(byId('wCost').value);
    const sum = ws + wq + wc || 1;
    meter.textContent = `重みの比率 => 速さ:${ws} 品質:${wq} コスト:${wc}`;
    const rows = state.options.map((o) => {
      const score = (o.speed * ws + o.quality * wq + (6 - o.cost) * wc) / sum;
      return { name: o.name, score: score.toFixed(2) };
    }).sort((a,b) => Number(b.score) - Number(a.score));
    scoreTable.innerHTML = rows.length
      ? rows.map((r) => `<tr><td>${escapeHtml(r.name)}</td><td>${r.score}</td></tr>`).join('')
      : '<tr><td colspan="2" class="empty-state">まだ候補がありません。サンプルで試せます。</td></tr>';
  };
  ['wSpeed','wQuality','wCost'].forEach((id) => byId(id).addEventListener('input', recalc));
  byId('addOptionBtn').addEventListener('click', () => {
    const name = (byId('optionName').value || '').trim();
    const speed = Number(byId('optionSpeed').value || 0);
    const quality = Number(byId('optionQuality').value || 0);
    const cost = Number(byId('optionCost').value || 0);
    if (!name || !speed || !quality || !cost) return;
    state.options.push({ name, speed, quality, cost });
    byId('optionName').value = '';
    byId('optionSpeed').value = '';
    byId('optionQuality').value = '';
    byId('optionCost').value = '';
    recalc();
  });
  byId('recalcBtn').addEventListener('click', recalc);
  state.helpers.recalc = recalc;
  recalc();
}

function setupSlotPlanner() {
  byId('addTaskBtn').addEventListener('click', () => {
    const task = (byId('taskInput').value || '').trim();
    const slot = byId('slotSelect').value;
    if (!task) return;
    state.slots[slot].push({ text: task, done: false });
    byId('taskInput').value = '';
    renderSlots();
  });
  byId('carryBtn').addEventListener('click', () => {
    carry('morning', 'afternoon');
    carry('afternoon', 'evening');
    renderSlots();
  });
  renderSlots();
}

function carry(from, to) {
  const stay = [];
  state.slots[from].forEach((t) => {
    if (t.done) stay.push(t);
    else state.slots[to].push({ text: t.text, done: false });
  });
  state.slots[from] = stay;
}

function renderSlots() {
  renderSlot('morning', byId('slotMorning'));
  renderSlot('afternoon', byId('slotAfternoon'));
  renderSlot('evening', byId('slotEvening'));
}

function renderSlot(key, el) {
  el.innerHTML = state.slots[key].length
    ? state.slots[key].map((t, i) => `<label class="task"><input type="checkbox" ${t.done?'checked':''} data-slot="${key}" data-idx="${i}">${escapeHtml(t.text)}</label>`).join('')
    : '<div class="empty-state">まだ予定がありません。サンプルで試せます。</div>';
  el.querySelectorAll('input[type="checkbox"]').forEach((box) => {
    box.addEventListener('change', (e) => {
      const slot = e.target.dataset.slot;
      const idx = Number(e.target.dataset.idx);
      state.slots[slot][idx].done = e.target.checked;
    });
  });
}

function setupFlowBoard() {
  byId('addFlowCardBtn').addEventListener('click', () => {
    const title = (byId('cardTitleInput').value || '').trim();
    if (!title) return;
    state.board.todo.push({ id: Date.now(), title });
    byId('cardTitleInput').value = '';
    renderBoard();
  });
  renderBoard();
}

function renderBoard() {
  renderLane('todo', byId('laneTodo'), 'doing');
  renderLane('doing', byId('laneDoing'), 'done');
  renderLane('done', byId('laneDone'), null);
}

function renderLane(key, el, next) {
  const laneLabel = (name) => ({ doing: '進行中へ', done: '終わりへ' }[name] || name);
  el.innerHTML = state.board[key].length
    ? state.board[key].map((c, i) => `<div class="card"><div>${escapeHtml(c.title)}</div>${next ? `<button data-lane="${key}" data-idx="${i}" data-next="${next}">→ ${laneLabel(next)}</button>` : ''}</div>`).join('')
    : '<div class="empty-state">まだカードがありません。サンプルで試せます。</div>';
  el.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lane = btn.dataset.lane;
      const idx = Number(btn.dataset.idx);
      const to = btn.dataset.next;
      const [card] = state.board[lane].splice(idx, 1);
      state.board[to].push(card);
      renderBoard();
    });
  });
}

function setupRoulette() {
  const wheel = byId('wheelFace');
  const score = byId('scoreValue');
  const round = byId('roundValue');
  const missionPool = byId('missionPool');
  const history = byId('roundHistory');

  byId('addMissionBtn').addEventListener('click', () => {
    const m = (byId('missionInput').value || '').trim();
    if (!m) return;
    state.missions.push(m);
    byId('missionInput').value = '';
    renderPool();
  });
  byId('spinBtn').addEventListener('click', () => {
    if (state.missions.length === 0) return;
    const picked = state.missions[Math.floor(Math.random() * state.missions.length)];
    wheel.textContent = picked;
    state.round += 1;
    state.score += 10;
    state.history.unshift(`R${state.round}: ${picked}`);
    state.history = state.history.slice(0, 12);
    round.textContent = String(state.round);
    score.textContent = String(state.score);
    history.innerHTML = state.history.map((x) => `<li>${escapeHtml(x)}</li>`).join('');
  });
  byId('clearRoundBtn').addEventListener('click', () => {
    state.round = 0; state.score = 0; state.history = []; wheel.textContent = 'まだ回していません';
    round.textContent = '0'; score.textContent = '0'; history.innerHTML = '<li>まだ履歴がありません</li>';
  });
  function renderPool() {
    missionPool.innerHTML = state.missions.length
      ? state.missions.map((x) => `<li>${escapeHtml(x)}</li>`).join('')
      : '<li class="empty-state">まだお題がありません。サンプルで試せます。</li>';
  }
  state.helpers.renderPool = renderPool;
  renderPool();
}

function setupBriefCanvas() {
  const root = byId('briefCanvas');
  if (!root) return;
  const key = PROFILE.interaction_archetype;
  const shellClass = escapeHtml(PROFILE.ui_variant || 'generic');
  const inputTitle = escapeHtml(PROFILE.input_panel_title || 'まず入れるもの');
  const sampleTitle = escapeHtml(PROFILE.sample_panel_title || 'サンプルで試す');
  const tipsTitle = escapeHtml(PROFILE.guide_panel_title || '使い方のコツ');
  const stageLabel = escapeHtml(PROFILE.hero_panel_label || '結果の見どころ');
  const resultTitle = escapeHtml(PROFILE.output_label || 'ここを見ればOKです');
  const introChip = `<div class="tool-chip">${escapeHtml(PROFILE.display_name_ja || PROFILE.title || '')}</div>`;
  const heroHead = `
    <div class="hero-head">
      <div>
        <div class="tool-chip tool-chip--soft">${stageLabel}</div>
        <h2>${resultTitle}</h2>
        <p id="resultLead">${escapeHtml(PROFILE.use_case_line_ja || '変化した結果がここに出ます。')}</p>
      </div>
      <div class="hero-kpi"><span>いまの主役</span><strong id="heroStatValue">準備前</strong></div>
    </div>
  `;
  const sampleBlock = `
    <section class="sample-card">
      <h2>${sampleTitle}</h2>
      <p class="mini-note">サンプルを入れると、そのままスクショ向きの状態まで見られます。</p>
      <div class="pill-row" id="samplePresetRow"></div>
    </section>
  `;
  const guideBlock = `
    <section class="legend-card">
      <h2>${tipsTitle}</h2>
      <p id="resultHint" class="mini-note"></p>
    </section>
  `;

  if (key === 'route_trace') {
    root.innerHTML = `
      <div class="brief-shell brief-shell--${shellClass}">
        <section class="brief-card">
          ${introChip}
          <h2>${inputTitle}</h2>
          <p class="helper-note">${escapeHtml(PROFILE.how_it_works_line_ja || 'サンプルで状態を作り、1操作で変化を見ます。')}</p>
          <div id="briefInputZone" class="brief-form"></div>
        </section>
        <section class="result-card">
          ${heroHead}
          <div class="status-strip" id="statusStrip"></div>
          <div id="briefResultZone"></div>
        </section>
      </div>
      <div class="detail-row detail-row--${shellClass}">
        ${sampleBlock}
        ${guideBlock}
      </div>
    `;
  } else if (key === 'filter_toggle') {
    root.innerHTML = `
      <section class="result-card">
        ${heroHead}
        <div id="briefInputZone" class="brief-form"></div>
        <div class="status-strip" id="statusStrip"></div>
        <div id="briefResultZone"></div>
      </section>
      <div class="detail-row detail-row--${shellClass}">
        ${sampleBlock}
        ${guideBlock}
      </div>
    `;
  } else if (key === 'stock_scan') {
    root.innerHTML = `
      <section class="brief-card">
        ${introChip}
        <h2>${inputTitle}</h2>
        <p class="helper-note">${escapeHtml(PROFILE.how_it_works_line_ja || 'サンプルで状態を作り、1操作で変化を見ます。')}</p>
        <div id="briefInputZone" class="brief-form"></div>
      </section>
      <section class="result-card">
        ${heroHead}
        <div class="status-strip" id="statusStrip"></div>
        <div id="briefResultZone"></div>
      </section>
      <div class="detail-row detail-row--${shellClass}">
        ${sampleBlock}
        ${guideBlock}
      </div>
    `;
  } else {
    root.innerHTML = `
      <div class="brief-shell brief-shell--${shellClass}">
        <section class="brief-card">
          ${introChip}
          <h2>${inputTitle}</h2>
          <p class="helper-note">${escapeHtml(PROFILE.how_it_works_line_ja || 'サンプルで状態を作り、1操作で変化を見ます。')}</p>
          <div id="briefInputZone" class="brief-form"></div>
        </section>
        <section class="result-card">
          ${heroHead}
          <div class="status-strip" id="statusStrip"></div>
          <div id="briefResultZone"></div>
        </section>
      </div>
      <div class="detail-row detail-row--${shellClass}">
        ${sampleBlock}
        ${guideBlock}
      </div>
    `;
  }
  if (key === 'drag_fit' && PROFILE.page_archetype === 'suitcase_grid') {
    setupSuitcaseFit(root);
    return;
  }
  if (setupBatch065BriefTool(root)) {
    return;
  }
  if (key === 'stock_scan') {
    setupPantryRestock(root);
    return;
  }
  if (key === 'drag_assign') {
    setupReceiptSplit(root);
    return;
  }
  if (key === 'seat_arrange') {
    setupSeatBalance(root);
    return;
  }
  if (key === 'budget_trim') {
    setupCartTrim(root);
    return;
  }
  if (key === 'filter_toggle') {
    setupHomeFilter(root);
    return;
  }
  if (key === 'route_trace') {
    setupIntroRoute(root);
    return;
  }
  if (key === 'block_fill') {
    setupRequestFrame(root);
    return;
  }
  if (key === 'step_replay') {
    setupMorningReplay(root);
    return;
  }
  if (key === 'compartment_fit') {
    setupBentoFit(root);
    return;
  }
  if (key === 'sort_baskets') {
    setupLaundryLoad(root);
    return;
  }
  if (key === 'flow_pick') {
    setupFridgeDinner(root);
    return;
  }
  if (key === 'plug_match') {
    setupCableMatch(root);
    return;
  }
  if (key === 'rack_place') {
    setupDryRack(root);
    return;
  }
  if (key === 'deadline_pack') {
    setupReturnBox(root);
    return;
  }
  if (key === 'prune_sort') {
    setupPhotoPurge(root);
    return;
  }
  if (key === 'trash_lane_sort') {
    setupTrashDay(root);
    return;
  }
  if (key === 'tray_sort') {
    setupDeskCheckout(root);
    return;
  }
  if (key === 'swap_compare') {
    setupToneBalance(root);
    return;
  }
  if (key === 'combo_filter') {
    setupFridgeRescue(root);
    return;
  }
  if (key === 'diff_grid') {
    setupQuoteWatcher(root);
    return;
  }
  if (key === 'tone_slider') {
    setupReminderTone(root);
    return;
  }
  if (key === 'fit_pack') {
    setupGapChore(root);
    return;
  }
  if (key === 'coverage_assign') {
    setupGiftOverlap(root);
    return;
  }
  if (key === 'balance_timeline') {
    setupCashfloor(root);
    return;
  }
  if (key === 'layout_fit') {
    setupTempSpace(root);
    return;
  }

  root.querySelector('#briefInputZone').innerHTML = `
    <textarea id="toolInput" class="text-input" rows="5" placeholder="ここに入力します"></textarea>
    <div class="action-row"><button id="actionBtn" class="primary-btn">まず見てみる</button></div>
  `;
  root.querySelector('#briefResultZone').innerHTML = '<div class="empty-state">まだ結果がありません。サンプルで試せます。</div>';
  root.querySelector('#resultHint').textContent = 'サンプルで埋めてから、主ボタンを押すと結果が変わります。';
  byId('actionBtn')?.addEventListener('click', () => {
    const input = (byId('toolInput').value || '').trim();
    root.querySelector('#briefResultZone').innerHTML = `<div class="route-step"><strong>${escapeHtml(input || 'サンプル入力')}</strong><small>${escapeHtml(PROFILE.capture_hook || '')}</small></div>`;
    setHeroStat('変化済み');
    setStatusCards([{ label: '状態', value: '変化あり' }, { label: '用途', value: '確認済み' }, { label: '次', value: 'スクショOK' }]);
  });
  mountPresetButtons([{ label: 'サンプル入力', action: () => { byId('toolInput').value = 'サンプル入力'; byId('actionBtn')?.click(); } }]);
  state.helpers.runBriefSample = () => { byId('toolInput').value = 'サンプル入力'; byId('actionBtn')?.click(); };
}

function setupBatch065BriefTool(root) {
  const name = PROFILE.display_name_ja || '';
  const configs = {
    '洗濯逃げ窓コンパス': {
      addLabel: '洗濯物を追加する',
      sampleLabel: '外出前の洗濯で試す',
      fields: [
        { key: 'item', label: '洗濯物', placeholder: 'タオル' },
        { key: 'dry', label: '乾きやすさ', placeholder: '早い / 普通 / 遅い' },
        { key: 'returnAt', label: '帰宅予定', placeholder: '18:30' }
      ],
      sample: [
        { item: 'バスタオル', dry: '遅い', returnAt: '19:00' },
        { item: 'シャツ', dry: '普通', returnAt: '19:00' },
        { item: '靴下', dry: '早い', returnAt: '19:00' }
      ],
      stat: (rows) => `${rows.filter((row) => /遅/.test(row.dry || '')).length}件注意`,
      status: (rows) => [
        { label: '外干し候補', value: `${rows.length}点` },
        { label: '早めに切替', value: `${rows.filter((row) => /遅/.test(row.dry || '')).length}点` },
        { label: '帰宅', value: rows[0]?.returnAt || '未入力' }
      ],
      render: (rows) => `<div class="shelf-board">
        ${rows.map((row) => {
          const slow = /遅/.test(row.dry || '');
          const width = slow ? 44 : /早/.test(row.dry || '') ? 88 : 66;
          return `<div class="shelf-row ${slow ? 'low' : ''}">
            <div><strong>${escapeHtml(row.item || '洗濯物')}</strong><div class="subline">${escapeHtml(row.dry || '普通')} / 帰宅 ${escapeHtml(row.returnAt || '未入力')}</div></div>
            <div class="shelf-bar"><span style="width:${width}%"></span></div>
            <div><strong>${slow ? '部屋干しへ逃がす' : '外干しで様子見'}</strong></div>
          </div>`;
        }).join('')}
      </div>`
    },
    '返信約束抜け棚': {
      addLabel: '約束を追加する',
      sampleLabel: '終業前チェックで試す',
      fields: [
        { key: 'person', label: '相手', placeholder: '佐藤さん' },
        { key: 'promise', label: '約束したこと', placeholder: '見積もりを返す' },
        { key: 'state', label: '状態', placeholder: '未返信 / 添付待ち / 確認中' }
      ],
      sample: [
        { person: '佐藤さん', promise: '見積もりを返す', state: '未返信' },
        { person: '田中さん', promise: 'PDFを添付する', state: '添付待ち' },
        { person: '山本さん', promise: '日程を確認する', state: '確認中' }
      ],
      stat: (rows) => `${rows.filter((row) => /未|待/.test(row.state || '')).length}件`,
      status: (rows) => [
        { label: '今日返す', value: `${rows.filter((row) => /未/.test(row.state || '')).length}件` },
        { label: '添付待ち', value: `${rows.filter((row) => /添付/.test(row.state || '')).length}件` },
        { label: '相手', value: `${new Set(rows.map((row) => row.person).filter(Boolean)).size}人` }
      ],
      render: (rows) => `<div class="listing-grid">
        ${rows.map((row) => {
          const urgent = /未|添付|待/.test(row.state || '');
          return `<div class="listing-card ${urgent ? 'item-card cut' : 'item-card keep'}">
            <div class="badge hit">${escapeHtml(row.state || '状態')}</div>
            <div class="listing-title">${escapeHtml(row.person || '相手')}</div>
            <p>${escapeHtml(row.promise || '約束したこと')}</p>
            <strong>${urgent ? '終業前に拾う' : '明日確認でOK'}</strong>
          </div>`;
        }).join('')}
      </div>`
    },
    '修理買い替え境界線': {
      addLabel: '候補を追加する',
      sampleLabel: '壊れた家電で試す',
      fields: [
        { key: 'item', label: '壊れた物', placeholder: '掃除機' },
        { key: 'repair', label: '修理額', placeholder: '9000' },
        { key: 'replace', label: '買い替え額', placeholder: '24000' }
      ],
      sample: [
        { item: '掃除機', repair: '9000', replace: '24000' },
        { item: '炊飯器', repair: '18000', replace: '32000' },
        { item: 'デスクライト', repair: '5000', replace: '6500' }
      ],
      stat: (rows) => `${rows.filter((row) => Number(row.repair || 0) < Number(row.replace || 0) * 0.55).length}修理`,
      status: (rows) => [
        { label: '修理寄り', value: `${rows.filter((row) => Number(row.repair || 0) < Number(row.replace || 0) * 0.55).length}件` },
        { label: '買替寄り', value: `${rows.filter((row) => Number(row.repair || 0) >= Number(row.replace || 0) * 0.75).length}件` },
        { label: '確認', value: `${rows.filter((row) => Number(row.repair || 0) >= Number(row.replace || 0) * 0.55 && Number(row.repair || 0) < Number(row.replace || 0) * 0.75).length}件` }
      ],
      render: (rows) => `<div class="assignment-grid">
        ${rows.map((row) => {
          const repair = Number(row.repair || 0);
          const replace = Number(row.replace || 1);
          const pct = Math.min(100, Math.round((repair / replace) * 100));
          const buy = pct >= 75;
          const check = pct >= 55 && pct < 75;
          return `<div class="listing-card ${buy ? 'item-card cut' : 'item-card keep'}">
            <div class="badge hit">${pct}%</div>
            <div class="listing-title">${escapeHtml(row.item || '壊れた物')}</div>
            <p>修理 ${repair.toLocaleString()}円 / 買い替え ${replace.toLocaleString()}円</p>
            <div class="bar"><span style="width:${Math.max(8, pct)}%"></span></div>
            <strong>${buy ? '買い替え側に寄る' : check ? '待ち日数を確認' : '修理を先に見る'}</strong>
          </div>`;
        }).join('')}
      </div>`
    },
    'フリマ発送厚みゲージ': {
      addLabel: '品物を追加する',
      sampleLabel: 'フリマ発送で試す',
      fields: [
        { key: 'item', label: '品物', placeholder: 'Tシャツ' },
        { key: 'thickness', label: '梱包後の厚みcm', placeholder: '2.5' },
        { key: 'method', label: '候補レーン', placeholder: '3cmレーン' }
      ],
      sample: [
        { item: 'Tシャツ', thickness: '2.4', method: '3cmレーン' },
        { item: '文庫本', thickness: '2.8', method: '3cmレーン' },
        { item: 'ニット', thickness: '4.2', method: '5cmレーン' }
      ],
      stat: (rows) => `${rows.filter((row) => Number(row.thickness || 0) <= Number((row.method || '').match(/\d+(\.\d+)?/)?.[0] || 3)).length}通過`,
      status: (rows) => [
        { label: '通過', value: `${rows.filter((row) => Number(row.thickness || 0) <= Number((row.method || '').match(/\d+(\.\d+)?/)?.[0] || 3)).length}点` },
        { label: '超過注意', value: `${rows.filter((row) => Number(row.thickness || 0) > Number((row.method || '').match(/\d+(\.\d+)?/)?.[0] || 3)).length}点` },
        { label: '品物', value: `${rows.length}点` }
      ],
      render: (rows) => `<div class="shelf-board">
        ${rows.map((row) => {
          const limit = Number((row.method || '').match(/\d+(\.\d+)?/)?.[0] || 3);
          const thickness = Number(row.thickness || 0);
          const over = thickness > limit;
          const width = Math.min(100, Math.round((thickness / Math.max(1, limit)) * 100));
          return `<div class="shelf-row ${over ? 'low' : ''}">
            <div><strong>${escapeHtml(row.item || '品物')}</strong><div class="subline">${thickness}cm / ${escapeHtml(row.method || `${limit}cmレーン`)}</div></div>
            <div class="shelf-bar"><span style="width:${Math.max(8, width)}%"></span></div>
            <div><strong>${over ? '超過注意' : '通れそう'}</strong></div>
          </div>`;
        }).join('')}
      </div>`
    },
    'ぐるぐる考え駐車場': {
      addLabel: '心配を追加する',
      sampleLabel: '寝る前の頭の中で試す',
      fields: [
        { key: 'worry', label: '心配', placeholder: '明日の連絡が不安' },
        { key: 'action', label: '今できる一手', placeholder: 'メモだけ作る' },
        { key: 'park', label: '置き場', placeholder: '今夜 / 明日 / 手放す' }
      ],
      sample: [
        { worry: '明日の連絡が不安', action: '要点を3つメモする', park: '今夜' },
        { worry: '週末の予定が未定', action: '明日の昼に確認', park: '明日' },
        { worry: '相手の反応が読めない', action: '今は決めない', park: '手放す' }
      ],
      stat: (rows) => rows.find((row) => /今夜/.test(row.park || ''))?.action || '一手',
      status: (rows) => [
        { label: '今夜', value: `${rows.filter((row) => /今夜/.test(row.park || '')).length}台` },
        { label: '明日', value: `${rows.filter((row) => /明日/.test(row.park || '')).length}台` },
        { label: '手放す', value: `${rows.filter((row) => /手放/.test(row.park || '')).length}台` }
      ],
      render: (rows) => `<div class="listing-grid">
        ${rows.map((row) => {
          const tonight = /今夜/.test(row.park || '');
          return `<div class="listing-card ${tonight ? 'item-card keep' : ''}">
            <div class="badge hit">${escapeHtml(row.park || '置き場')}</div>
            <div class="listing-title">${escapeHtml(row.worry || '心配')}</div>
            <p>${escapeHtml(row.action || '小さな一手')}</p>
            <strong>${tonight ? '出口に置く' : '駐車枠に停める'}</strong>
          </div>`;
        }).join('')}
      </div>`
    },
    '小さな勝ちトロフィー': {
      addLabel: '勝ちを追加する',
      sampleLabel: '小さな達成で試す',
      fields: [
        { key: 'win', label: '今日やったこと', placeholder: '洗濯物を畳んだ' },
        { key: 'hard', label: '地味に大変だった点', placeholder: '後回しにしなかった' },
        { key: 'to', label: '見せたい相手', placeholder: '家族' }
      ],
      sample: [
        { win: '洗濯物を畳んだ', hard: '後回しにしなかった', to: '家族' },
        { win: '返信を3件返した', hard: '眠い時間に終えた', to: '友人' }
      ],
      stat: (rows) => `${rows.length}冠`,
      status: (rows) => [
        { label: 'トロフィー', value: `${rows.length}枚` },
        { label: '送る相手', value: rows[0]?.to || '未入力' },
        { label: '称号', value: rows[0]?.win ? '今日の一勝' : '準備中' }
      ],
      render: (rows) => `<div class="listing-grid">
        ${rows.map((row) => `<div class="listing-card item-card keep">
          <div class="badge hit">今日の一勝</div>
          <div class="listing-title">${escapeHtml(row.win || '小さな勝ち')}</div>
          <h2>小さな勝ちトロフィー</h2>
          <p>${escapeHtml(row.hard || '地味に大変だった点')}</p>
          <div class="subline">${escapeHtml(row.to || '見せたい相手')}に送れる一枚</div>
        </div>`).join('')}
      </div>`
    },
    '部屋シーン調合器': {
      addLabel: '材料を追加する',
      sampleLabel: '夜の部屋で試す',
      fields: [
        { key: 'purpose', label: '目的', placeholder: '読書' },
        { key: 'resource', label: '使える物', placeholder: '小さな照明' },
        { key: 'move', label: '3分の一手', placeholder: '机の上だけ空ける' }
      ],
      sample: [
        { purpose: '読書', resource: '小さな照明', move: '机の上だけ空ける' },
        { purpose: '映画', resource: '低めの音量', move: '飲み物を置く場所を作る' },
        { purpose: '作業', resource: '白い照明', move: '通知を伏せる' }
      ],
      stat: (rows) => `${rows.length}配合`,
      status: (rows) => [
        { label: '目的', value: rows[0]?.purpose || '未入力' },
        { label: '材料', value: `${rows.length}つ` },
        { label: '時間', value: '3分' }
      ],
      render: (rows) => `<div class="path-list">
        ${rows.map((row, idx) => `<div class="route-step">
          <div class="route-name">${idx + 1}. ${escapeHtml(row.purpose || '目的')}</div>
          <small>${escapeHtml(row.resource || '使える物')} / ${escapeHtml(row.move || '3分の一手')}</small>
        </div>`).join('')}
        <div class="warning-card item-card keep">
          <div class="item-title">今夜のシーンレシピ</div>
          <p>${escapeHtml(rows.map((row) => row.resource).filter(Boolean).join(' + ') || '材料を入れる')}</p>
        </div>
      </div>`
    },
    '保証書ポケット': {
      addLabel: '保証を追加する',
      sampleLabel: 'ドライヤー購入で試す',
      fields: [
        { key: 'item', label: '買った物', placeholder: 'ドライヤー' },
        { key: 'place', label: '置き場所', placeholder: 'リビング棚の青いファイル' },
        { key: 'due', label: '保証期限', placeholder: '2027-05' }
      ],
      sample: [
        { item: 'ドライヤー', place: '洗面所の白いファイル', due: '2027-05' },
        { item: 'Bluetoothイヤホン', place: '外箱の中', due: '2026-12' },
        { item: '炊飯器', place: '説明書ケース', due: '2028-03' }
      ],
      stat: (rows) => `${rows.length}件`,
      status: (rows) => [
        { label: '保管済み', value: `${rows.filter((r) => r.place).length}件` },
        { label: '期限メモ', value: `${rows.filter((r) => r.due).length}件` },
        { label: '次に見る', value: rows[0]?.item || '未入力' }
      ],
      render: (rows) => `
        <div class="row-stack">
          ${rows.map((row) => `<div class="row-card">
            <div class="item-title">${escapeHtml(row.item || '買った物')}</div>
            <div class="subline">置き場所: ${escapeHtml(row.place || '未設定')}</div>
            <div class="subline">保証期限: ${escapeHtml(row.due || 'あとで入力')}</div>
          </div>`).join('')}
        </div>`
    },
    'なくし物さがし順路': {
      addLabel: '場所を追加する',
      sampleLabel: '鍵探しで試す',
      fields: [
        { key: 'place', label: '場所', placeholder: '玄関' },
        { key: 'clue', label: '手がかり', placeholder: '帰宅後に通った' },
        { key: 'checked', label: '確認', placeholder: '未確認 / 見た' }
      ],
      sample: [
        { place: '玄関トレー', clue: '最後に鍵を置きがち', checked: '未確認' },
        { place: '洗面所', clue: '帰宅後に手を洗った', checked: '見た' },
        { place: 'バッグ内ポケット', clue: '昨日の外出で使った', checked: '未確認' },
        { place: 'リビング机', clue: '郵便を置いた', checked: '未確認' }
      ],
      stat: (rows) => `${rows.filter((r) => !/見た|済/.test(r.checked || '')).length}箇所`,
      status: (rows) => [
        { label: '未確認', value: `${rows.filter((r) => !/見た|済/.test(r.checked || '')).length}箇所` },
        { label: '確認済み', value: `${rows.filter((r) => /見た|済/.test(r.checked || '')).length}箇所` },
        { label: '次に見る', value: rows.find((r) => !/見た|済/.test(r.checked || ''))?.place || 'なし' }
      ],
      render: (rows) => {
        const unchecked = rows.filter((r) => !/見た|済/.test(r.checked || ''));
        return `<div class="route-board">
          <div class="path-list">
            ${unchecked.map((row, idx) => `<div class="route-step">
              <div class="route-name">${idx + 1}. ${escapeHtml(row.place || '場所')}</div>
              <small>${escapeHtml(row.clue || '手がかりなし')}</small>
            </div>`).join('') || '<div class="empty-state">未確認の場所はありません。</div>'}
          </div>
          <div class="row-stack">
            ${rows.map((row) => `<div class="row-card ${/見た|済/.test(row.checked || '') ? 'item-card cut' : 'item-card keep'}">
              <strong>${escapeHtml(row.place || '場所')}</strong>
              <div class="subline">${escapeHtml(row.checked || '未確認')}</div>
            </div>`).join('')}
          </div>
        </div>`;
      }
    },
    '包み紙たりる表': {
      addLabel: '贈り物を追加する',
      sampleLabel: '訪問前の包装で試す',
      fields: [
        { key: 'gift', label: '贈り物', placeholder: '焼き菓子箱' },
        { key: 'need', label: '必要な包装', placeholder: '中袋 1 / 紙 40cm' },
        { key: 'stock', label: '手元の残り', placeholder: '紙 35cm' }
      ],
      sample: [
        { gift: '焼き菓子箱', need: '包装紙 40cm', stock: '包装紙 35cm' },
        { gift: '文庫本', need: '小袋 1枚', stock: '小袋 2枚' },
        { gift: '花瓶', need: '厚紙袋 1枚', stock: '厚紙袋 0枚' }
      ],
      stat: (rows) => `${rows.filter((r) => /0|35/.test(r.stock || '')).length}件注意`,
      status: (rows) => [
        { label: '包める', value: `${rows.filter((r) => !/0|35/.test(r.stock || '')).length}件` },
        { label: '不足かも', value: `${rows.filter((r) => /0|35/.test(r.stock || '')).length}件` },
        { label: '最初に確認', value: rows.find((r) => /0|35/.test(r.stock || ''))?.gift || 'なし' }
      ],
      render: (rows) => `<div class="assignment-grid">
        ${rows.map((row) => {
          const warning = /0|35/.test(row.stock || '');
          return `<div class="warning-card ${warning ? 'item-card cut' : 'item-card keep'}">
            <div class="item-title">${escapeHtml(row.gift || '贈り物')}</div>
            <div class="subline">必要: ${escapeHtml(row.need || '未入力')}</div>
            <div class="subline">手元: ${escapeHtml(row.stock || '未入力')}</div>
            <strong>${warning ? '先に買い足し確認' : 'このまま包めそう'}</strong>
          </div>`;
        }).join('')}
      </div>`
    },
    '家族写真ひと言レール': {
      addLabel: '写真を追加する',
      sampleLabel: '旅行写真で試す',
      fields: [
        { key: 'scene', label: '写真 / 場面', placeholder: '駅前で集合' },
        { key: 'caption', label: '残す一言', placeholder: '出発前だけ元気' },
        { key: 'keep', label: '見返す相手', placeholder: '家族LINE' }
      ],
      sample: [
        { scene: '駅前で集合', caption: '出発前だけ全員しゃきっとしていた', keep: '家族LINE' },
        { scene: '海沿いの昼ごはん', caption: '風で紙ナプキンが飛んだ', keep: 'アルバム' },
        { scene: '帰りの車内', caption: '寝落ち直前の静けさ', keep: '自分用' }
      ],
      stat: (rows) => `${rows.length}枚`,
      status: (rows) => [
        { label: '写真', value: `${rows.length}枚` },
        { label: '一言あり', value: `${rows.filter((r) => r.caption).length}枚` },
        { label: '見返す先', value: rows[0]?.keep || '未設定' }
      ],
      render: (rows) => `<div class="listing-grid">
        ${rows.map((row, idx) => `<div class="listing-card">
          <div class="badge hit">PHOTO ${idx + 1}</div>
          <div class="listing-title">${escapeHtml(row.scene || '写真')}</div>
          <p>${escapeHtml(row.caption || '一言を入れる')}</p>
          <div class="subline">残す先: ${escapeHtml(row.keep || '未設定')}</div>
        </div>`).join('')}
      </div>`
    },
    'おやつ投票レシート': {
      addLabel: '候補を追加する',
      sampleLabel: '会議前のおやつで試す',
      fields: [
        { key: 'snack', label: '候補', placeholder: 'チョコ' },
        { key: 'votes', label: '票', placeholder: '4' },
        { key: 'note', label: 'ひとこと', placeholder: '手が汚れにくい' }
      ],
      sample: [
        { snack: 'チョコ', votes: '4', note: '甘いもの派が多い' },
        { snack: 'せんべい', votes: '2', note: 'しょっぱい枠' },
        { snack: 'グミ', votes: '3', note: '配りやすい' }
      ],
      stat: (rows) => rows.slice().sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0))[0]?.snack || '未投票',
      status: (rows) => [
        { label: '候補', value: `${rows.length}件` },
        { label: '合計票', value: `${rows.reduce((s, r) => s + Number(r.votes || 0), 0)}票` },
        { label: '買うもの', value: rows.slice().sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0))[0]?.snack || '未定' }
      ],
      render: (rows) => {
        const sorted = rows.slice().sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
        return `<div class="receipt-board">
          <div class="receipt-items">
            ${sorted.map((row, idx) => `<div class="receipt-item">
              <div class="item-title">${idx + 1}. ${escapeHtml(row.snack || '候補')}</div>
              <div class="subline">${Number(row.votes || 0)}票 / ${escapeHtml(row.note || 'メモなし')}</div>
            </div>`).join('')}
          </div>
          <div class="person-ledger">
            <div class="person-card"><strong>RECEIPT</strong><span>買うもの: ${escapeHtml(sorted[0]?.snack || '未定')}</span></div>
            <div class="person-card"><strong>惜しかった</strong><span>${escapeHtml(sorted[1]?.snack || 'なし')}</span></div>
          </div>
        </div>`;
      }
    },
    '保存容器つめ順': {
      addLabel: '残り物を追加する',
      sampleLabel: '夕飯後の残り物で試す',
      fields: [
        { key: 'food', label: '残り物', placeholder: 'カレー' },
        { key: 'amount', label: '量', placeholder: '大' },
        { key: 'container', label: '容器候補', placeholder: '丸い大容器' }
      ],
      sample: [
        { food: 'カレー', amount: '大', container: '深い大容器' },
        { food: 'サラダ', amount: '中', container: '浅い中容器' },
        { food: '煮物', amount: '小', container: '四角い小容器' }
      ],
      stat: (rows) => `${rows.length}段`,
      status: (rows) => [
        { label: 'しまう物', value: `${rows.length}品` },
        { label: '大きい容器', value: `${rows.filter((r) => /大/.test(r.amount || r.container || '')).length}個` },
        { label: '先に入れる', value: rows.find((r) => /大/.test(r.amount || ''))?.food || rows[0]?.food || '未定' }
      ],
      render: (rows) => `<div class="suitcase-layout">
        <div class="suitcase-box">
          <div class="suitcase-grid">
            ${rows.map((row, idx) => `<div class="pack-slot">
              <strong>${idx + 1}段目</strong>
              <span>${escapeHtml(row.food || '残り物')}</span>
              <span>${escapeHtml(row.container || '容器未定')}</span>
            </div>`).join('')}
          </div>
        </div>
        <div class="overflow-list">
          ${rows.map((row) => `<div class="overflow-pill"><strong>${escapeHtml(row.food || '残り物')}</strong><div class="subline">量: ${escapeHtml(row.amount || '未入力')}</div></div>`).join('')}
        </div>
      </div>`
    },
    '小さな勝ち賞状': {
      addLabel: 'できたことを追加する',
      sampleLabel: '今日の小さな勝ちで試す',
      fields: [
        { key: 'win', label: 'できたこと', placeholder: '洗濯物を畳んだ' },
        { key: 'award', label: '賞の名前', placeholder: '生活が前に進んだ賞' },
        { key: 'name', label: '宛名', placeholder: '今日の自分' }
      ],
      sample: [
        { win: '洗濯物を畳んだ', award: '生活が前に進んだ賞', name: '今日の自分' },
        { win: '返信を1通送った', award: '後回しに勝った賞', name: '夜の自分' }
      ],
      stat: (rows) => `${rows.length}枚`,
      status: (rows) => [
        { label: '賞状', value: `${rows.length}枚` },
        { label: '宛名', value: rows[0]?.name || '未入力' },
        { label: '今日の賞', value: rows[0]?.award || '未定' }
      ],
      render: (rows) => `<div class="listing-grid">
        ${rows.map((row) => `<div class="listing-card" style="background:linear-gradient(180deg,#fffdf2,#fff7ca);border-color:#e8c766">
          <div class="badge hit">CERTIFICATE</div>
          <h2>${escapeHtml(row.award || '小さな勝ち賞')}</h2>
          <p><strong>${escapeHtml(row.name || '今日の自分')}</strong> は、${escapeHtml(row.win || 'できたこと')} をちゃんと終えました。</p>
          <div class="subline">大げさではないけれど、残してよい勝ちです。</div>
        </div>`).join('')}
      </div>`
    },
    '旅先コンセント地図': {
      addLabel: '機器を追加する',
      sampleLabel: '旅行前夜の充電セットで試す',
      fields: [
        { key: 'device', label: '機器', placeholder: 'スマホ' },
        { key: 'ports', label: '必要口数', placeholder: '1' },
        { key: 'cable', label: 'ケーブル / 充電器', placeholder: 'USB-C' }
      ],
      sample: [
        { device: 'スマホ', ports: '1', cable: 'USB-C' },
        { device: 'カメラ', ports: '1', cable: 'USB-C充電器' },
        { device: 'イヤホン', ports: '0.5', cable: 'USB-C' },
        { device: 'ノートPC', ports: '1', cable: '65W USB-C' }
      ],
      stat: (rows) => {
        const total = rows.reduce((sum, row) => sum + Number(row.ports || 0), 0);
        return total > 3 ? `${(total - 3).toFixed(1)}口不足` : `${total.toFixed(1)}口`;
      },
      status: (rows) => {
        const total = rows.reduce((sum, row) => sum + Number(row.ports || 0), 0);
        const cables = new Set(rows.map((row) => row.cable).filter(Boolean));
        return [
          { label: '機器', value: `${rows.length}個` },
          { label: '必要口数', value: `${total.toFixed(1)}口` },
          { label: '持つ束', value: `${cables.size}種類` }
        ];
      },
      render: (rows) => {
        const total = rows.reduce((sum, row) => sum + Number(row.ports || 0), 0);
        const shortage = Math.max(0, total - 3);
        const cables = [...new Set(rows.map((row) => row.cable).filter(Boolean))];
        return `<div class="assignment-grid">
          <div class="warning-card ${shortage ? 'item-card cut' : 'item-card keep'}">
            <div class="item-title">${shortage ? `あと${shortage.toFixed(1)}口ほしいです` : '3口タップで足ります'}</div>
            <div class="subline">宿のコンセントを3口想定で確認</div>
            <strong>${shortage ? '小型タップを追加' : 'この束で出発OK'}</strong>
          </div>
          <div class="row-stack">
            ${rows.map((row, idx) => `<div class="route-step">
              <div class="route-name">口 ${idx + 1}: ${escapeHtml(row.device || '機器')}</div>
              <small>${escapeHtml(row.ports || '1')}口 / ${escapeHtml(row.cable || 'ケーブル未定')}</small>
            </div>`).join('')}
          </div>
          <div class="listing-card">
            <div class="badge hit">PACK</div>
            <div class="listing-title">持っていく充電の束</div>
            <p>${escapeHtml(cables.join(' / ') || 'ケーブルを入力')}</p>
          </div>
        </div>`;
      }
    },
    '買い物袋かたより直し': {
      addLabel: '品物を追加する',
      sampleLabel: '帰り道の買い物で試す',
      fields: [
        { key: 'item', label: '品物', placeholder: '牛乳' },
        { key: 'weight', label: '重さg', placeholder: '900' },
        { key: 'fragile', label: '注意', placeholder: '割れやすい / 冷たい' }
      ],
      sample: [
        { item: '牛乳', weight: '900', fragile: '冷たい重い' },
        { item: '卵', weight: '300', fragile: '割れやすい' },
        { item: 'パン', weight: '180', fragile: '潰れやすい' },
        { item: '冷凍食品', weight: '500', fragile: '冷たい' }
      ],
      stat: (rows) => {
        const total = rows.reduce((sum, row) => sum + Number(row.weight || 0), 0);
        return `${Math.round(total / 1000 * 10) / 10}kg`;
      },
      status: (rows) => {
        const total = rows.reduce((sum, row) => sum + Number(row.weight || 0), 0);
        return [
          { label: '品物', value: `${rows.length}点` },
          { label: '合計', value: `${Math.round(total)}g` },
          { label: '上に置く', value: rows.find((row) => /割れ|潰/.test(row.fragile || ''))?.item || 'なし' }
        ];
      },
      render: (rows) => {
        const bags = [{ name: '袋A', items: [], total: 0 }, { name: '袋B', items: [], total: 0 }];
        rows.slice().sort((a, b) => Number(b.weight || 0) - Number(a.weight || 0)).forEach((row) => {
          const bag = bags[0].total <= bags[1].total ? bags[0] : bags[1];
          bag.items.push(row);
          bag.total += Number(row.weight || 0);
        });
        const max = Math.max(1, ...bags.map((bag) => bag.total));
        return `<div class="assignment-grid">
          ${bags.map((bag) => `<div class="listing-card">
            <div class="badge hit">${escapeHtml(bag.name)}</div>
            <div class="listing-title">${Math.round(bag.total)}g</div>
            <div class="bar"><span style="width:${Math.min(100, Math.round(bag.total / max * 100))}%"></span></div>
            ${bag.items.map((row) => `<div class="receipt-item">
              <strong>${escapeHtml(row.item || '品物')}</strong>
              <span>${escapeHtml(row.weight || '0')}g / ${escapeHtml(row.fragile || '通常')}</span>
            </div>`).join('')}
          </div>`).join('')}
          <div class="warning-card item-card keep">
            <div class="item-title">上に逃がすもの</div>
            <p>${escapeHtml(rows.filter((row) => /割れ|潰/.test(row.fragile || '')).map((row) => row.item).join(' / ') || 'なし')}</p>
          </div>
        </div>`;
      }
    },
    '留守番ごはん番': {
      addLabel: '世話を追加する',
      sampleLabel: '半日外出の世話で試す',
      fields: [
        { key: 'care', label: '世話', placeholder: '朝ごはん' },
        { key: 'time', label: '時間', placeholder: '8:00' },
        { key: 'person', label: '担当', placeholder: '未担当 / 母' }
      ],
      sample: [
        { care: '朝ごはん', time: '8:00', person: '母' },
        { care: '水交換', time: '12:00', person: '未担当' },
        { care: '薬', time: '18:00', person: '父' },
        { care: 'トイレ確認', time: '21:00', person: '未担当' }
      ],
      stat: (rows) => `${rows.filter((row) => /未|空|なし/.test(row.person || '')).length}件空き`,
      status: (rows) => [
        { label: '世話', value: `${rows.length}件` },
        { label: '担当あり', value: `${rows.filter((row) => !/未|空|なし/.test(row.person || '')).length}件` },
        { label: '未担当', value: `${rows.filter((row) => /未|空|なし/.test(row.person || '')).length}件` }
      ],
      render: (rows) => `<div class="route-board">
        <div class="path-list">
          ${rows.map((row) => {
            const open = /未|空|なし/.test(row.person || '');
            return `<div class="route-step ${open ? 'item-card cut' : 'item-card keep'}">
              <div class="route-name">${escapeHtml(row.time || '時間')} ${escapeHtml(row.care || '世話')}</div>
              <small>${open ? '未担当です' : `担当: ${escapeHtml(row.person || '')}`}</small>
            </div>`;
          }).join('')}
        </div>
        <div class="warning-card ${rows.some((row) => /未|空|なし/.test(row.person || '')) ? 'item-card cut' : 'item-card keep'}">
          <div class="item-title">ここを埋めればOKです</div>
          <p>${escapeHtml(rows.filter((row) => /未|空|なし/.test(row.person || '')).map((row) => `${row.time} ${row.care}`).join(' / ') || '全部埋まっています')}</p>
        </div>
      </div>`
    },
    '係バッジ混ぜ': {
      addLabel: '人と係を追加する',
      sampleLabel: '集まり前の係分けで試す',
      fields: [
        { key: 'person', label: '人', placeholder: '佐藤' },
        { key: 'role', label: '係', placeholder: '写真係' },
        { key: 'weight', label: '重さ', placeholder: '軽い / 普通 / 重い' }
      ],
      sample: [
        { person: '佐藤', role: '写真係', weight: '軽い' },
        { person: '鈴木', role: '飲み物補充', weight: '重い' },
        { person: '山田', role: '片づけ声かけ', weight: '普通' },
        { person: '伊藤', role: '受付', weight: '普通' }
      ],
      stat: (rows) => `${rows.length}枚`,
      status: (rows) => [
        { label: 'バッジ', value: `${rows.length}枚` },
        { label: '重い係', value: `${rows.filter((row) => /重/.test(row.weight || '')).length}件` },
        { label: '見直す人', value: rows.find((row) => /重/.test(row.weight || ''))?.person || 'なし' }
      ],
      render: (rows) => `<div class="listing-grid">
        ${rows.map((row) => {
          const heavy = /重/.test(row.weight || '');
          return `<div class="listing-card ${heavy ? 'item-card cut' : 'item-card keep'}">
            <div class="badge hit">${escapeHtml(row.weight || '普通')}</div>
            <div class="listing-title">${escapeHtml(row.person || '名前')}</div>
            <h2>${escapeHtml(row.role || '係')}</h2>
            <p>${heavy ? '重い係なので、補助を1人つけると安心です。' : 'このまま配りやすい軽さです。'}</p>
          </div>`;
        }).join('')}
      </div>`
    },
    '初対面ひと言札': {
      addLabel: '相手を追加する',
      sampleLabel: '初対面の前で試す',
      fields: [
        { key: 'person', label: '相手', placeholder: '田中さん' },
        { key: 'context', label: '分かっていること', placeholder: '登山と写真が好き' },
        { key: 'avoid', label: '避けたい話題', placeholder: '年齢の話' }
      ],
      sample: [
        { person: '田中さん', context: '登山と写真が好き', avoid: '仕事の愚痴' },
        { person: '山本さん', context: '共通の知人がいる', avoid: '年齢の話' }
      ],
      stat: (rows) => `${rows.length}札`,
      status: (rows) => [
        { label: '相手', value: `${rows.length}人` },
        { label: '避ける話題', value: `${rows.filter((row) => row.avoid).length}件` },
        { label: '最初の札', value: rows[0]?.person || '未入力' }
      ],
      render: (rows) => `<div class="listing-grid">
        ${rows.map((row) => `<div class="listing-card">
          <div class="badge hit">${escapeHtml(row.person || '相手')}</div>
          <div class="listing-title">最初の一言札</div>
          <p>「${escapeHtml(row.context || '最近のこと')}、少し聞いてもいいですか？」</p>
          <div class="subline">橋渡し: 自分も一つ短い話を添える</div>
          <div class="subline">避ける: ${escapeHtml(row.avoid || '特になし')}</div>
        </div>`).join('')}
      </div>`
    },
    '型サイズ換算カード': {
      addLabel: 'レシピを追加する',
      sampleLabel: '手元の型で試す',
      fields: [
        { key: 'recipe', label: 'レシピ', placeholder: 'チーズケーキ' },
        { key: 'original', label: '元の型', placeholder: '18cm丸型' },
        { key: 'target', label: '手元の型', placeholder: '15cm丸型' }
      ],
      sample: [
        { recipe: 'チーズケーキ', original: '18cm丸型', target: '15cm丸型' },
        { recipe: 'パウンドケーキ', original: '20cm型', target: '18cm型' }
      ],
      stat: (rows) => {
        const first = rows[0] || {};
        const original = Number((first.original || '').match(/\d+(\.\d+)?/)?.[0] || 0);
        const target = Number((first.target || '').match(/\d+(\.\d+)?/)?.[0] || 0);
        return original && target ? `${Math.round((target / original) ** 2 * 100)}%` : '未計算';
      },
      status: (rows) => [
        { label: 'レシピ', value: `${rows.length}件` },
        { label: '倍率表示', value: '面積比' },
        { label: '注意', value: '焼き時間は確認' }
      ],
      render: (rows) => `<div class="assignment-grid">
        ${rows.map((row) => {
          const original = Number((row.original || '').match(/\d+(\.\d+)?/)?.[0] || 0);
          const target = Number((row.target || '').match(/\d+(\.\d+)?/)?.[0] || 0);
          const ratio = original && target ? (target / original) ** 2 : 1;
          const pct = Math.round(ratio * 100);
          const warn = pct < 75 || pct > 130;
          return `<div class="listing-card ${warn ? 'item-card cut' : 'item-card keep'}">
            <div class="badge hit">${pct}%</div>
            <div class="listing-title">${escapeHtml(row.recipe || 'レシピ')}</div>
            <p>${escapeHtml(row.original || '元の型')} → ${escapeHtml(row.target || '手元の型')}</p>
            <div class="subline">式: (${target || '?'} ÷ ${original || '?'})² = ${pct}%</div>
            <div class="bar"><span style="width:${Math.min(100, Math.max(8, pct))}%"></span></div>
            <strong>${warn ? '焼き時間を短めに見始める' : '分量をこの倍率で調整'}</strong>
          </div>`;
        }).join('')}
      </div>`
    },
    '謝り方なおし段': {
      addLabel: '行動を追加する',
      sampleLabel: '返信遅れで試す',
      fields: [
        { key: 'incident', label: '出来事', placeholder: '返信が遅れた' },
        { key: 'action', label: '先にする行動', placeholder: '状況を伝える' },
        { key: 'line', label: '添える一言', placeholder: '確認が遅れてすみません' }
      ],
      sample: [
        { incident: '返信が遅れた', action: 'まず状況を伝える', line: '確認が遅れてすみません' },
        { incident: '資料の共有漏れ', action: '修正版を送る', line: '今から差し替え版を送ります' },
        { incident: '相手の時間を奪った', action: '次回の進め方を提案する', line: '次は先に要点を共有します' }
      ],
      stat: (rows) => `${rows.length}段`,
      status: (rows) => [
        { label: '出来事', value: `${rows.length}件` },
        { label: '行動あり', value: `${rows.filter((row) => row.action).length}件` },
        { label: '一言', value: rows[0]?.line || '未入力' }
      ],
      render: (rows) => `<div class="path-list">
        ${rows.map((row, idx) => `<div class="route-step">
          <div class="route-name">${idx + 1}段目: ${escapeHtml(row.action || '先にする行動')}</div>
          <small>${escapeHtml(row.incident || '出来事')} / 「${escapeHtml(row.line || '添える一言')}」</small>
        </div>`).join('')}
        <div class="warning-card item-card keep">
          <div class="item-title">最後に添える短い一言</div>
          <p>${escapeHtml(rows[rows.length - 1]?.line || '一言を入力')}</p>
        </div>
      </div>`
    }
  };
  const config = configs[name];
  if (!config) return false;

  let rows = clone(config.sample);
  root.querySelector('#briefInputZone').innerHTML = `
    <div class="mini-note">サンプルは書き換え用です。項目は追加・編集・削除できます。</div>
    <div class="row-stack" id="briefRowEditor"></div>
    <button id="briefAddRowBtn" class="primary-btn" type="button">${escapeHtml(config.addLabel)}</button>
  `;
  root.querySelector('#briefResultZone').innerHTML = '<div class="empty-state">まだ結果がありません。サンプルで試せます。</div>';
  setResultHint(PROFILE.how_it_works_line_ja || '入力を変えると、結果カードも変わります。');

  function render() {
    const editor = byId('briefRowEditor');
    editor.innerHTML = rows.map((row, idx) => `
      <div class="row-card">
        <div class="mini-grid">
          ${config.fields.map((field) => `<label>${escapeHtml(field.label)}<input class="mini-input" data-row="${idx}" data-key="${escapeHtml(field.key)}" value="${escapeAttr(row[field.key] || '')}" placeholder="${escapeAttr(field.placeholder || '')}"></label>`).join('')}
        </div>
        <div class="mini-actions"><button class="tiny-btn" data-delete-row="${idx}" type="button">削除</button></div>
      </div>
    `).join('');
    editor.querySelectorAll('[data-row]').forEach((input) => {
      input.addEventListener('input', () => {
        const idx = Number(input.dataset.row);
        rows[idx][input.dataset.key] = input.value;
        renderResult();
      });
    });
    editor.querySelectorAll('[data-delete-row]').forEach((btn) => {
      btn.addEventListener('click', () => {
        rows.splice(Number(btn.dataset.deleteRow), 1);
        render();
      });
    });
    renderResult();
  }

  function renderResult() {
    byId('briefResultZone').innerHTML = rows.length ? config.render(rows) : '<div class="empty-state">項目を追加すると、ここに結果カードが出ます。</div>';
    setHeroStat(rows.length ? config.stat(rows) : '未入力');
    setStatusCards(rows.length ? config.status(rows) : [
      { label: '入力', value: '0件' },
      { label: '状態', value: '未入力' },
      { label: '次', value: '追加する' }
    ]);
    setResultLead(rows.length ? (PROFILE.publish_hook || PROFILE.use_case_line_ja || '入力に合わせて結果が変わります。') : 'サンプルまたは自分の項目を入れると結果が変わります。');
    updateCaptureReady();
  }

  byId('briefAddRowBtn')?.addEventListener('click', () => {
    const next = {};
    config.fields.forEach((field) => { next[field.key] = ''; });
    rows.push(next);
    render();
  });
  mountPresetButtons([{ label: config.sampleLabel, action: () => { rows = clone(config.sample); render(); } }]);
  state.helpers.runBriefSample = () => { rows = clone(config.sample); render(); };
  render();
  return true;
}

function setHeroStat(value) {
  const node = byId('heroStatValue');
  if (node) node.textContent = value;
}

function setResultLead(value) {
  const node = byId('resultLead');
  if (node) node.textContent = value;
}

function setResultHint(value) {
  const node = byId('resultHint');
  if (node) node.textContent = value;
}

function setStatusCards(items) {
  const strip = byId('statusStrip');
  if (!strip) return;
  strip.innerHTML = items.map((item) => `
    <div class="status-chip">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
    </div>
  `).join('');
}

function mountPresetButtons(presets) {
  const row = byId('samplePresetRow');
  if (!row) return;
  row.innerHTML = '';
  presets.forEach((preset) => {
    const btn = document.createElement('button');
    btn.className = 'ghost-pill';
    btn.type = 'button';
    btn.textContent = preset.label;
    btn.addEventListener('click', preset.action);
    row.appendChild(btn);
  });
}

function setupSuitcaseFit(root) {
  const data = {
    presets: {
      '1泊出張': [
        { name: 'シャツ', size: 'M', weight: 10, packed: true, slot: '左上' },
        { name: '充電器', size: 'S', weight: 5, packed: true, slot: '右上' },
        { name: 'PC', size: 'L', weight: 18, packed: true, slot: '左下' },
        { name: '折りたたみ傘', size: 'M', weight: 9, packed: false, reason: '雨予報だが今回は現地貸出あり' },
        { name: '替えの靴', size: 'L', weight: 16, packed: false, reason: '今回は歩き回らない' }
      ],
      '週末旅行': [
        { name: 'ワンピース', size: 'L', weight: 14, packed: true, slot: '左上' },
        { name: '洗面セット', size: 'S', weight: 6, packed: true, slot: '右上' },
        { name: '羽織り', size: 'M', weight: 11, packed: true, slot: '左下' },
        { name: '本', size: 'M', weight: 8, packed: false, reason: '電子版に置き換え' },
        { name: 'ヘアアイロン', size: 'M', weight: 10, packed: false, reason: '宿に備え付けあり' }
      ]
    }
  };
  let current = [];

  root.querySelector('#briefInputZone').innerHTML = `
    <div class="mini-note">持ち物カードを切り替えると、入る物と外す物がすぐ変わります。</div>
    <div class="item-grid" id="packControlList"></div>
  `;
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="suitcase-layout">
      <div class="suitcase-box"><div class="suitcase-grid" id="suitcaseGrid"></div></div>
      <div class="overflow-list" id="overflowList"></div>
    </div>
  `;
  setResultHint('カードを押すと、スーツケース側と外す候補側が入れ替わります。');

  function render() {
    const controls = byId('packControlList');
    controls.innerHTML = current.map((item, idx) => `
      <div class="item-card ${item.packed ? 'keep' : 'cut'}">
        <div>
          <div class="item-title">${escapeHtml(item.name)}</div>
          <div class="subline">大きさ ${escapeHtml(item.size)} / 重さ ${item.weight}</div>
        </div>
        <div class="mini-actions">
          <button class="assign-btn" data-pack-idx="${idx}">${item.packed ? '外す候補へ' : '入れる'}</button>
        </div>
      </div>
    `).join('');
    controls.querySelectorAll('[data-pack-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.packIdx);
        current[idx].packed = !current[idx].packed;
        render();
      });
    });

    const packed = current.filter((item) => item.packed).slice(0, 4);
    const cut = current.filter((item) => !item.packed);
    byId('suitcaseGrid').innerHTML = ['左上', '右上', '左下', '右下'].map((slot, idx) => {
      const item = packed[idx];
      return item
        ? `<div class="pack-slot"><strong>${escapeHtml(slot)}</strong><span>${escapeHtml(item.name)}</span><span>${item.size} / ${item.weight}</span></div>`
        : `<div class="pack-slot"><strong>${escapeHtml(slot)}</strong><span>まだ空いています</span></div>`;
    }).join('');
    byId('overflowList').innerHTML = cut.length
      ? cut.map((item) => `<div class="overflow-pill"><strong>${escapeHtml(item.name)}</strong><div class="subline">${escapeHtml(item.reason || '今回は見送り')}</div></div>`).join('')
      : '<div class="empty-state">外す候補はありません。今の構成で収まっています。</div>';

    setHeroStat(`${packed.length} / 4`);
    setStatusCards([
      { label: '入る物', value: `${packed.length}点` },
      { label: '外す候補', value: `${cut.length}点` },
      { label: '余白', value: `${Math.max(0, 4 - packed.length)}枠` }
    ]);
    setResultLead(cut.length ? '外す候補まで見えるので、旅行前に減らしやすくなります。' : '今の荷物ならそのまま持っていけます。');
  }

  function applyPreset(name) {
    current = clone(data.presets[name]);
    render();
  }

  mountPresetButtons(Object.keys(data.presets).map((name) => ({ label: name, action: () => applyPreset(name) })));
  state.helpers.runBriefSample = () => applyPreset('1泊出張');
  applyPreset('1泊出張');
}

function setupPantryRestock(root) {
  const presets = {
    '買い物前': [
      { name: '米', stock: 18, unit: '%', action: '今日買う' },
      { name: '卵', stock: 8, unit: '%', action: '今日買う' },
      { name: '洗剤', stock: 42, unit: '%', action: '今週見る' },
      { name: 'コーヒー', stock: 72, unit: '%', action: 'まだ大丈夫' }
    ]
  };
  let rows = [];

  root.querySelector('#briefInputZone').innerHTML = '<div class="shelf-board" id="shelfControlList"></div>';
  root.querySelector('#briefResultZone').innerHTML = '<div class="shelf-board" id="shelfBoard"></div>';
  setResultHint('プラスとマイナスで残量を動かすと、今日買う棚だけが前に出ます。');

  function render() {
    const control = byId('shelfControlList');
    control.innerHTML = rows.map((row, idx) => `
      <div class="shelf-row ${row.stock <= 25 ? 'low' : ''}">
        <div><strong>${escapeHtml(row.name)}</strong><div class="subline">${row.stock}${row.unit}</div></div>
        <div class="action-row">
          <button class="tiny-btn" data-shelf="${idx}" data-delta="-12">-12</button>
          <button class="tiny-btn" data-shelf="${idx}" data-delta="12">+12</button>
        </div>
        <div class="subline">${escapeHtml(row.stock <= 25 ? '今日買う' : row.stock <= 50 ? '今週見る' : 'まだ大丈夫')}</div>
      </div>
    `).join('');
    control.querySelectorAll('[data-shelf]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.shelf);
        const delta = Number(btn.dataset.delta);
        rows[idx].stock = Math.max(0, Math.min(100, rows[idx].stock + delta));
        render();
      });
    });

    byId('shelfBoard').innerHTML = rows.map((row) => `
      <div class="shelf-row ${row.stock <= 25 ? 'low' : ''}">
        <div><strong>${escapeHtml(row.name)}</strong><div class="subline">${row.stock}${row.unit}</div></div>
        <div class="shelf-bar"><span style="width:${row.stock}%"></span></div>
        <div><strong>${escapeHtml(row.stock <= 25 ? '今日買う' : row.stock <= 50 ? '今週見る' : 'まだ大丈夫')}</strong></div>
      </div>
    `).join('');

    const urgent = rows.filter((row) => row.stock <= 25).length;
    setHeroStat(`${urgent}段`);
    setStatusCards([
      { label: '今日買う', value: `${urgent}つ` },
      { label: '今週見る', value: `${rows.filter((row) => row.stock > 25 && row.stock <= 50).length}つ` },
      { label: '余裕あり', value: `${rows.filter((row) => row.stock > 50).length}つ` }
    ]);
    setResultLead('残量の低い棚だけが前に出るので、買う物リストより一瞬で分かります。');
  }

  function applyPreset(name) {
    rows = clone(presets[name]);
    render();
  }

  mountPresetButtons([{ label: '買い物前の棚', action: () => applyPreset('買い物前') }]);
  state.helpers.runBriefSample = () => applyPreset('買い物前');
  applyPreset('買い物前');
}

function setupReceiptSplit(root) {
  const presets = {
    '3人で食事': {
      items: [
        { name: 'パスタ', price: 980, owner: 'Aさん' },
        { name: 'サラダ', price: 720, owner: '共有' },
        { name: 'ワイン', price: 1600, owner: 'Bさん' },
        { name: 'デザート', price: 650, owner: 'Cさん' }
      ],
      people: ['Aさん', 'Bさん', 'Cさん', '共有']
    }
  };
  let model = clone(presets['3人で食事']);

  root.querySelector('#briefInputZone').innerHTML = '<div class="receipt-items" id="receiptItemControls"></div>';
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="receipt-board">
      <div class="receipt-items" id="receiptItemBoard"></div>
      <div class="person-ledger" id="personLedger"></div>
    </div>
  `;
  setResultHint('各品目の行先を押すたびに、誰がいくら払うかがその場で変わります。');

  function render() {
    const owners = model.people;
    const totals = Object.fromEntries(owners.map((name) => [name, 0]));
    model.items.forEach((item) => {
      totals[item.owner] += item.price;
    });

    const control = byId('receiptItemControls');
    const board = byId('receiptItemBoard');
    const makeItemCard = (item, idx) => `
      <div class="receipt-item">
        <div>
          <div class="item-title">${escapeHtml(item.name)}</div>
          <div class="subline">¥${item.price.toLocaleString()} / 今は ${escapeHtml(item.owner)}</div>
        </div>
        <div class="pill-row">
          ${owners.map((owner) => `<button class="assign-btn" data-receipt-idx="${idx}" data-owner="${escapeHtml(owner)}">${escapeHtml(owner)}</button>`).join('')}
        </div>
      </div>
    `;
    control.innerHTML = model.items.map(makeItemCard).join('');
    board.innerHTML = model.items.map(makeItemCard).join('');
    root.querySelectorAll('[data-receipt-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.receiptIdx);
        model.items[idx].owner = btn.dataset.owner;
        render();
      });
    });

    byId('personLedger').innerHTML = owners.map((owner) => `
      <div class="person-card">
        <strong>${escapeHtml(owner)}</strong>
        <span>¥${totals[owner].toLocaleString()}</span>
      </div>
    `).join('');
    const ordered = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    setHeroStat(`¥${ordered[0][1].toLocaleString()}`);
    setStatusCards([
      { label: 'いちばん多い人', value: ordered[0][0] },
      { label: '共有品目', value: `${model.items.filter((item) => item.owner === '共有').length}件` },
      { label: '精算差', value: `¥${(ordered[0][1] - ordered[ordered.length - 1][1]).toLocaleString()}` }
    ]);
    setResultLead('レシート品目の行先が見えるので、精算額が一瞬でまとまります。');
  }

  mountPresetButtons([{ label: '3人で食事', action: () => { model = clone(presets['3人で食事']); render(); } }]);
  state.helpers.runBriefSample = () => { model = clone(presets['3人で食事']); render(); };
  render();
}

function setupSeatBalance(root) {
  const presets = {
    '6人の会食': [
      { name: '司会', mood: 'bridge', seat: 0 },
      { name: '初参加A', mood: 'quiet', seat: 1 },
      { name: '営業', mood: 'bridge', seat: 2 },
      { name: '初参加B', mood: 'quiet', seat: 3 },
      { name: '開発', mood: 'deep', seat: 4 },
      { name: '広報', mood: 'bridge', seat: 5 }
    ]
  };
  const seatPos = [
    { left: '42%', top: '6%' },
    { left: '71%', top: '22%' },
    { left: '71%', top: '58%' },
    { left: '42%', top: '76%' },
    { left: '11%', top: '58%' },
    { left: '11%', top: '22%' }
  ];
  let guests = clone(presets['6人の会食']);

  root.querySelector('#briefInputZone').innerHTML = '<div class="guest-bench" id="guestBench"></div>';
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="table-layout">
      <div class="table-ring" id="tableRing"></div>
      <div class="guest-bench" id="seatSummary"></div>
    </div>
  `;
  setResultHint('ゲストの席を1人分ずらすだけで、孤立と固まりがすぐ変わります。');

  function scoreSeat(index) {
    const guest = guests.find((item) => item.seat === index);
    if (!guest) return { cls: '', note: '空席' };
    const neighbors = [((index + 5) % 6), ((index + 1) % 6)].map((seat) => guests.find((item) => item.seat === seat)).filter(Boolean);
    const quietAround = neighbors.filter((item) => item.mood === 'quiet').length;
    if (guest.mood === 'quiet' && quietAround >= 1) return { cls: 'bad', note: '静かな人が固まり気味' };
    if (guest.mood === 'bridge') return { cls: 'good', note: 'つなぎ役になりやすい席' };
    return { cls: '', note: 'この席でも大丈夫' };
  }

  function render() {
    const bench = byId('guestBench');
    bench.innerHTML = guests.map((guest, idx) => `
      <div class="guest-row">
        <div><strong>${escapeHtml(guest.name)}</strong><div class="subline">今は ${guest.seat + 1}番席</div></div>
        <div class="mini-actions">
          <button class="assign-btn" data-seat-shift="${idx}" data-dir="-1">←</button>
          <button class="assign-btn" data-seat-shift="${idx}" data-dir="1">→</button>
        </div>
      </div>
    `).join('');
    bench.querySelectorAll('[data-seat-shift]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.seatShift);
        const dir = Number(btn.dataset.dir);
        const targetSeat = (guests[idx].seat + dir + 6) % 6;
        const swapIdx = guests.findIndex((item) => item.seat === targetSeat);
        if (swapIdx >= 0) {
          const temp = guests[idx].seat;
          guests[idx].seat = guests[swapIdx].seat;
          guests[swapIdx].seat = temp;
        }
        render();
      });
    });

    const ring = byId('tableRing');
    ring.innerHTML = guests.map((guest) => {
      const seatMeta = seatPos[guest.seat];
      const score = scoreSeat(guest.seat);
      return `<div class="seat-node ${score.cls}" style="left:${seatMeta.left};top:${seatMeta.top}">
        <strong>${escapeHtml(guest.name)}</strong>
        <div class="subline">${escapeHtml(score.note)}</div>
      </div>`;
    }).join('');

    const summary = byId('seatSummary');
    summary.innerHTML = guests.map((guest) => {
      const score = scoreSeat(guest.seat);
      return `<div class="guest-row"><div><strong>${escapeHtml(guest.name)}</strong><div class="subline">${guest.seat + 1}番席 / ${escapeHtml(score.note)}</div></div></div>`;
    }).join('');

    const bad = guests.filter((guest) => scoreSeat(guest.seat).cls === 'bad').length;
    setHeroStat(bad === 0 ? '安定' : `${bad}席注意`);
    setStatusCards([
      { label: '固まり注意', value: `${bad}席` },
      { label: 'つなぎ役', value: `${guests.filter((guest) => guest.mood === 'bridge').length}人` },
      { label: '空席', value: '0席' }
    ]);
    setResultLead(bad === 0 ? '今の席順なら初参加が孤立しにくい並びです。' : '静かな人が固まりやすい席が見えるので、1人分ずらすと落ち着きます。');
  }

  mountPresetButtons([{ label: '6人の会食', action: () => { guests = clone(presets['6人の会食']); render(); } }]);
  state.helpers.runBriefSample = () => { guests = clone(presets['6人の会食']); render(); };
  render();
}

function setupCartTrim(root) {
  const presets = {
    '予算4,000円': {
      budget: 4000,
      items: [
        { name: '牛乳', price: 220, keep: true, alt: 'そのまま' },
        { name: '洗剤', price: 680, keep: true, alt: '来週でもOK' },
        { name: 'お菓子', price: 350, keep: false, alt: '今回は見送り' },
        { name: 'パスタソース', price: 420, keep: true, alt: 'そのまま' },
        { name: '冷凍食品', price: 980, keep: true, alt: 'そのまま' },
        { name: '炭酸水', price: 540, keep: false, alt: '家の在庫を使う' },
        { name: 'ヨーグルト', price: 260, keep: true, alt: 'そのまま' }
      ]
    }
  };
  let model = clone(presets['予算4,000円']);

  root.querySelector('#briefInputZone').innerHTML = `
    <div class="mini-note">残す / 外すを切り替えると、超過額と外す候補がその場で変わります。</div>
    <div class="cart-items" id="cartControlList"></div>
  `;
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="cut-board">
      <div class="cart-items" id="cartList"></div>
      <div class="overflow-list" id="cutSuggestions"></div>
    </div>
  `;
  setResultHint('外す候補が右にまとまるので、予算内へ戻す順番をそのまま使えます。');

  function render() {
    const total = model.items.filter((item) => item.keep).reduce((sum, item) => sum + item.price, 0);
    const over = Math.max(0, total - model.budget);
    const controlHtml = model.items.map((item, idx) => `
      <div class="cart-item ${item.keep ? '' : 'cut'}">
        <div><strong>${escapeHtml(item.name)}</strong><div class="subline">¥${item.price.toLocaleString()}</div></div>
        <button class="assign-btn" data-cart-idx="${idx}">${item.keep ? '外す候補へ' : '残す'}</button>
      </div>
    `).join('');
    byId('cartControlList').innerHTML = controlHtml;
    byId('cartList').innerHTML = `
      <div class="status-chip"><span>合計</span><strong>¥${total.toLocaleString()}</strong></div>
      <div class="meter"><span style="width:${Math.min(100, (total / model.budget) * 100)}%"></span></div>
      ${controlHtml}
    `;
    root.querySelectorAll('[data-cart-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.cartIdx);
        model.items[idx].keep = !model.items[idx].keep;
        render();
      });
    });
    const cuts = model.items.filter((item) => !item.keep);
    byId('cutSuggestions').innerHTML = cuts.length
      ? cuts.map((item) => `<div class="overflow-pill"><strong>${escapeHtml(item.name)}</strong><div class="subline">${escapeHtml(item.alt)}</div></div>`).join('')
      : '<div class="empty-state">外す候補はありません。今の合計で予算内です。</div>';
    setHeroStat(over > 0 ? `+¥${over.toLocaleString()}` : '予算内');
    setStatusCards([
      { label: '予算', value: `¥${model.budget.toLocaleString()}` },
      { label: '合計', value: `¥${total.toLocaleString()}` },
      { label: '外す候補', value: `${cuts.length}件` }
    ]);
    setResultLead(over > 0 ? 'まず外す候補が右に残るので、予算オーバーをすぐ戻せます。' : '今のカゴならそのまま予算内で会計できます。');
  }

  mountPresetButtons([{ label: '予算4,000円', action: () => { model = clone(presets['予算4,000円']); render(); } }]);
  state.helpers.runBriefSample = () => { model = clone(presets['予算4,000円']); render(); };
  render();
}

function setupHomeFilter(root) {
  const presets = {
    '部屋探し': {
      filters: [
        { key: '駅近', active: true },
        { key: '2階以上', active: true },
        { key: 'ペット可', active: false },
        { key: '独立洗面台', active: false }
      ],
      listings: [
        { name: 'Aマンション', tags: ['駅近', '2階以上', '独立洗面台'], note: '通勤に強い' },
        { name: 'Bレジデンス', tags: ['駅近', 'ペット可'], note: '犬と住みやすい' },
        { name: 'Cハイツ', tags: ['2階以上', '独立洗面台'], note: '静かさ重視' },
        { name: 'Dコーポ', tags: ['駅近', '2階以上', 'ペット可'], note: '条件のバランスが良い' }
      ]
    }
  };
  let model = clone(presets['部屋探し']);

  root.querySelector('#briefInputZone').innerHTML = `
    <div class="filter-toolbar" id="filterToolbar"></div>
    <div class="mini-note">条件を切り替えると、残る候補だけが前に出ます。</div>
  `;
  root.querySelector('#briefResultZone').innerHTML = '<div class="filter-board"><div class="listing-grid" id="listingGrid"></div></div>';
  setResultHint('条件を1つ変えるだけで、残る候補が減るので決め手が見えます。');

  function render() {
    const active = model.filters.filter((item) => item.active).map((item) => item.key);
    byId('filterToolbar').innerHTML = model.filters.map((filter, idx) => `
      <button class="tag-btn ${filter.active ? 'active' : ''}" data-filter-idx="${idx}">${escapeHtml(filter.key)}</button>
    `).join('');
    byId('filterToolbar').querySelectorAll('[data-filter-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.filterIdx);
        model.filters[idx].active = !model.filters[idx].active;
        render();
      });
    });
    const survivors = model.listings.filter((listing) => active.every((tag) => listing.tags.includes(tag)));
    byId('listingGrid').innerHTML = model.listings.map((listing) => {
      const alive = survivors.includes(listing);
      return `<div class="listing-card ${alive ? '' : 'dead'}">
        <div class="listing-title">${escapeHtml(listing.name)}</div>
        <div class="subline">${escapeHtml(alive ? listing.note : 'いまは条件から外れます')}</div>
        <div class="listing-badges">${listing.tags.map((tag) => `<span class="badge ${active.includes(tag) ? 'hit' : ''}">${escapeHtml(tag)}</span>`).join('')}</div>
      </div>`;
    }).join('');
    setHeroStat(`${survivors.length}件`);
    setStatusCards([
      { label: '有効条件', value: `${active.length}つ` },
      { label: '残る候補', value: `${survivors.length}件` },
      { label: '外れた候補', value: `${model.listings.length - survivors.length}件` }
    ]);
    setResultLead(survivors.length ? '残る候補だけが前に残るので、比較表より早く絞れます。' : '条件が厳しすぎるので、1つ外すと候補が戻ります。');
  }

  mountPresetButtons([{ label: '部屋探し', action: () => { model = clone(presets['部屋探し']); render(); } }]);
  state.helpers.runBriefSample = () => { model = clone(presets['部屋探し']); render(); };
  render();
}

function setupIntroRoute(root) {
  const presets = {
    '採用担当へ紹介': {
      nodes: [
        { name: '自分', type: 'start', x: 10, y: 44 },
        { name: '先輩', type: 'path', x: 34, y: 18 },
        { name: '元同僚', type: 'path', x: 36, y: 66 },
        { name: '採用担当', type: 'target', x: 72, y: 42 }
      ],
      edges: [
        ['自分', '先輩', '最近やり取りあり'],
        ['先輩', '採用担当', '同じ勉強会で接点あり'],
        ['自分', '元同僚', '半年ぶり'],
        ['元同僚', '採用担当', '面識あり']
      ],
      bestPath: ['自分', '先輩', '採用担当']
    }
  };
  let model = clone(presets['採用担当へ紹介']);

  root.querySelector('#briefInputZone').innerHTML = `
    <div class="mini-note">順路を切り替えると、一番頼みやすいルートだけが強く見えます。</div>
    <div class="action-row">
      <button id="routePrimaryBtn" class="primary-btn">頼みやすい順で見る</button>
      <button id="routeAltBtn" class="secondary-btn">別ルートを試す</button>
    </div>
  `;
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="route-board">
      <div class="network-canvas" id="networkCanvas"></div>
      <div class="path-list" id="pathList"></div>
    </div>
  `;
  setResultHint('別ルートを試すと、頼みやすい順がすぐ入れ替わります。');

  function render() {
    const canvas = byId('networkCanvas');
    const nodeByName = Object.fromEntries(model.nodes.map((node) => [node.name, node]));
    const edgeLines = model.edges.map(([from, to]) => {
      const a = nodeByName[from];
      const b = nodeByName[to];
      const inPath = model.bestPath.includes(from) && model.bestPath.includes(to) && Math.abs(model.bestPath.indexOf(from) - model.bestPath.indexOf(to)) === 1;
      return `<line x1="${a.x + 8}" y1="${a.y + 8}" x2="${b.x + 8}" y2="${b.y + 8}" stroke="${inPath ? '#5dd6ff' : 'rgba(255,255,255,.22)'}" stroke-width="${inPath ? '4' : '2'}"></line>`;
    }).join('');
    canvas.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${edgeLines}</svg>` + model.nodes.map((node) => `
      <div class="network-node ${node.type} ${model.bestPath.includes(node.name) ? 'path' : ''}" style="left:${node.x}%;top:${node.y}%">
        <strong>${escapeHtml(node.name)}</strong>
      </div>
    `).join('');
    byId('pathList').innerHTML = model.bestPath.map((name, idx) => {
      const next = model.bestPath[idx + 1];
      const edge = next ? model.edges.find((item) => item[0] === name && item[1] === next) : null;
      return `<div class="route-step"><div class="route-name">${idx + 1}. ${escapeHtml(name)}</div><small>${escapeHtml(edge ? edge[2] : 'ここで紹介完了')}</small></div>`;
    }).join('');
    setHeroStat(`${model.bestPath.length - 1} hops`);
    setStatusCards([
      { label: '最初に頼む', value: model.bestPath[1] || 'なし' },
      { label: '経由人数', value: `${Math.max(0, model.bestPath.length - 2)}人` },
      { label: '終点', value: model.bestPath[model.bestPath.length - 1] }
    ]);
    setResultLead('一本の頼み順だけを強く見せるので、巨大グラフを読まなくて済みます。');
  }

  byId('routePrimaryBtn').addEventListener('click', () => {
    model.bestPath = ['自分', '先輩', '採用担当'];
    render();
  });
  byId('routeAltBtn').addEventListener('click', () => {
    model.bestPath = ['自分', '元同僚', '採用担当'];
    render();
  });

  mountPresetButtons([{ label: '採用担当へ紹介', action: () => { model = clone(presets['採用担当へ紹介']); render(); } }]);
  state.helpers.runBriefSample = () => { model = clone(presets['採用担当へ紹介']); render(); };
  render();
}

function setupRequestFrame(root) {
  const presets = {
    'レビュー依頼': [
      { label: '背景', value: '明日午前までにLPの文言確認が必要です', filled: true },
      { label: '頼みたいこと', value: '見出し3本のうち一番伝わる案を選んでほしい', filled: true },
      { label: '締切', value: '今日18時', filled: true },
      { label: '受け渡し形', value: '', filled: false }
    ]
  };
  let cards = clone(presets['レビュー依頼']);
  root.querySelector('#briefInputZone').innerHTML = '<div class="request-cards" id="requestControls"></div>';
  root.querySelector('#briefResultZone').innerHTML = '<div class="request-cards" id="requestCards"></div>';
  setResultHint('空いているカードを埋めると、お願い文の抜けが減ります。');

  function render() {
    const html = cards.map((card, idx) => `
      <div class="request-card ${card.filled ? '' : 'missing'}">
        <strong>${escapeHtml(card.label)}</strong>
        <div class="subline">${escapeHtml(card.value || 'まだ空いています')}</div>
        <div class="mini-actions"><button class="assign-btn" data-request-idx="${idx}">${card.filled ? '空に戻す' : '埋める'}</button></div>
      </div>
    `).join('');
    byId('requestControls').innerHTML = html;
    byId('requestCards').innerHTML = html;
    root.querySelectorAll('[data-request-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.requestIdx);
        cards[idx].filled = !cards[idx].filled;
        if (!cards[idx].filled) cards[idx].value = '';
        else if (!cards[idx].value) cards[idx].value = 'サンプルで埋めました';
        render();
      });
    });
    const filled = cards.filter((card) => card.filled).length;
    setHeroStat(`${filled}/4`);
    setStatusCards([
      { label: '埋まった要素', value: `${filled}枚` },
      { label: '残り', value: `${cards.length - filled}枚` },
      { label: '送れる状態', value: filled === cards.length ? 'はい' : 'あと少し' }
    ]);
    setResultLead('抜けカードが残るので、送る前に足りない所だけ見直せます。');
  }

  mountPresetButtons([{ label: 'レビュー依頼', action: () => { cards = clone(presets['レビュー依頼']); render(); } }]);
  state.helpers.runBriefSample = () => { cards = clone(presets['レビュー依頼']); render(); };
  render();
}

function setupMorningReplay(root) {
  const presets = {
    '朝の支度': [
      { step: '起きる', delay: 0 },
      { step: 'スマホを見る', delay: 12 },
      { step: '着替える', delay: 6 },
      { step: '朝食', delay: 4 },
      { step: '出発', delay: 0 }
    ]
  };
  let steps = clone(presets['朝の支度']);
  root.querySelector('#briefInputZone').innerHTML = '<div class="action-row"><button id="delayStepBtn" class="primary-btn">1段ずつ進める</button></div>';
  root.querySelector('#briefResultZone').innerHTML = '<div class="delay-list" id="delayList"></div>';
  setResultHint('進めるたびに、遅れが大きい段だけが赤く残ります。');

  function render() {
    byId('delayList').innerHTML = steps.map((item, idx) => `
      <div class="delay-card ${item.delay >= 10 ? 'bad' : item.delay === 0 ? 'good' : ''}">
        <strong>${idx + 1}. ${escapeHtml(item.step)}</strong>
        <div class="subline">${item.delay > 0 ? `${item.delay}分の遅れ` : '遅れなし'}</div>
      </div>
    `).join('');
    const worst = steps.reduce((max, item) => Math.max(max, item.delay), 0);
    setHeroStat(`${worst}分`);
    setStatusCards([
      { label: '最大の遅れ', value: `${worst}分` },
      { label: '注意段', value: `${steps.filter((item) => item.delay >= 10).length}段` },
      { label: '安定段', value: `${steps.filter((item) => item.delay === 0).length}段` }
    ]);
    setResultLead('いちばん遅れを広げる段だけが浮くので、直す場所がすぐ見えます。');
  }

  byId('delayStepBtn').addEventListener('click', () => {
    steps = steps.map((item, idx) => idx === 1 ? { ...item, delay: Math.max(0, item.delay - 4) } : item);
    render();
  });
  mountPresetButtons([{ label: '朝の支度', action: () => { steps = clone(presets['朝の支度']); render(); } }]);
  state.helpers.runBriefSample = () => { steps = clone(presets['朝の支度']); render(); };
  render();
}

function setupBentoFit(root) {
  const presets = {
    'お弁当': [
      { name: 'ごはん', box: '大きい仕切り', packed: true },
      { name: '卵焼き', box: '左上', packed: true },
      { name: '唐揚げ', box: '右上', packed: true },
      { name: 'ブロッコリー', box: '', packed: false },
      { name: 'トマト', box: '', packed: false }
    ]
  };
  let items = clone(presets['お弁当']);
  root.querySelector('#briefInputZone').innerHTML = '<div class="item-grid" id="bentoControls"></div>';
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="compartment-grid">
      <div class="compartment" id="bentoA"><strong>大きい仕切り</strong></div>
      <div class="compartment" id="bentoB"><strong>左上</strong></div>
      <div class="compartment" id="bentoC"><strong>右上</strong></div>
    </div>
    <div class="overflow-list" id="bentoOverflow"></div>
  `;
  setResultHint('おかずを切り替えると、仕切りに入る物と余る物がすぐ変わります。');

  function render() {
    byId('bentoControls').innerHTML = items.map((item, idx) => `
      <div class="item-card ${item.packed ? 'keep' : 'cut'}">
        <div class="item-title">${escapeHtml(item.name)}</div>
        <button class="assign-btn" data-bento-idx="${idx}">${item.packed ? '余りへ' : '入れる'}</button>
      </div>
    `).join('');
    root.querySelectorAll('[data-bento-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.bentoIdx);
        items[idx].packed = !items[idx].packed;
        render();
      });
    });
    const packed = items.filter((item) => item.packed);
    byId('bentoA').innerHTML = '<strong>大きい仕切り</strong>' + packed.filter((item) => item.box === '大きい仕切り').map((item) => `<div>${escapeHtml(item.name)}</div>`).join('');
    byId('bentoB').innerHTML = '<strong>左上</strong>' + packed.filter((item) => item.box === '左上').map((item) => `<div>${escapeHtml(item.name)}</div>`).join('');
    byId('bentoC').innerHTML = '<strong>右上</strong>' + packed.filter((item) => item.box === '右上').map((item) => `<div>${escapeHtml(item.name)}</div>`).join('');
    const overflow = items.filter((item) => !item.packed);
    byId('bentoOverflow').innerHTML = overflow.length ? overflow.map((item) => `<div class="overflow-pill">${escapeHtml(item.name)}</div>`).join('') : '<div class="empty-state">今の構成で全部収まっています。</div>';
    setHeroStat(`${packed.length}品`);
    setStatusCards([
      { label: '入る物', value: `${packed.length}品` },
      { label: '余る物', value: `${overflow.length}品` },
      { label: '仕切り', value: '3区画' }
    ]);
    setResultLead('仕切りに収まる形が見えるので、朝の詰め方をすぐ決められます。');
  }

  mountPresetButtons([{ label: 'お弁当', action: () => { items = clone(presets['お弁当']); render(); } }]);
  state.helpers.runBriefSample = () => { items = clone(presets['お弁当']); render(); };
  render();
}

function setupLaundryLoad(root) {
  const presets = {
    '洗濯前': [
      { name: '白シャツ', lane: 'today', note: '今日回す' },
      { name: '黒Tシャツ', lane: 'today', note: '今日回す' },
      { name: 'ニット', lane: 'handwash', note: '手洗い' },
      { name: '厚手タオル', lane: 'later', note: '次の回' },
      { name: 'デニム', lane: 'later', note: '色移りが気になる' }
    ]
  };
  let items = clone(presets['洗濯前']);

  root.querySelector('#briefInputZone').innerHTML = '<div class="item-grid" id="laundryControls"></div>';
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="compartment-grid">
      <div class="compartment" id="laundryToday"><strong>今回まわす</strong></div>
      <div class="compartment" id="laundryLater"><strong>後で洗う</strong></div>
      <div class="compartment" id="laundryHandwash"><strong>手洗い</strong></div>
    </div>
  `;
  setResultHint('服の行き先を変えるたび、今回まわす一回分がすぐ固まります。');

  function render() {
    byId('laundryControls').innerHTML = items.map((item, idx) => `
      <div class="item-card ${item.lane === 'today' ? 'keep' : item.lane === 'later' ? 'cut' : ''}">
        <div><div class="item-title">${escapeHtml(item.name)}</div><div class="subline">${escapeHtml(item.note)}</div></div>
        <div class="pill-row">
          <button class="assign-btn" data-laundry-idx="${idx}" data-lane="today">今回</button>
          <button class="assign-btn" data-laundry-idx="${idx}" data-lane="later">後で</button>
          <button class="assign-btn" data-laundry-idx="${idx}" data-lane="handwash">手洗い</button>
        </div>
      </div>
    `).join('');
    root.querySelectorAll('[data-laundry-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        items[Number(btn.dataset.laundryIdx)].lane = btn.dataset.lane;
        render();
      });
    });
    const laneHtml = (lane) => items.filter((item) => item.lane === lane)
      .map((item) => `<div class="overflow-pill"><strong>${escapeHtml(item.name)}</strong><div class="subline">${escapeHtml(item.note)}</div></div>`)
      .join('') || '<div class="empty-state">まだありません。</div>';
    byId('laundryToday').innerHTML = '<strong>今回まわす</strong>' + laneHtml('today');
    byId('laundryLater').innerHTML = '<strong>後で洗う</strong>' + laneHtml('later');
    byId('laundryHandwash').innerHTML = '<strong>手洗い</strong>' + laneHtml('handwash');
    setHeroStat(`${items.filter((item) => item.lane === 'today').length}点`);
    setStatusCards([
      { label: '今回', value: `${items.filter((item) => item.lane === 'today').length}点` },
      { label: '後で', value: `${items.filter((item) => item.lane === 'later').length}点` },
      { label: '手洗い', value: `${items.filter((item) => item.lane === 'handwash').length}点` }
    ]);
    setResultLead('今回まわす / 後で洗う / 手洗いが同時に見えるので、床で広げるより早く決まります。');
  }

  mountPresetButtons([{ label: '洗濯前', action: () => { items = clone(presets['洗濯前']); render(); } }]);
  state.helpers.runBriefSample = () => { items = clone(presets['洗濯前']); render(); };
  render();
}

function setupFridgeDinner(root) {
  const presets = {
    '20分夕飯': {
      ingredients: [
        { key: '卵', active: true },
        { key: 'ベーコン', active: true },
        { key: 'トマト', active: false },
        { key: 'チーズ', active: true },
        { key: '豆腐', active: false }
      ],
      meals: [
        { name: 'カルボナーラ風うどん', needs: ['卵', 'ベーコン', 'チーズ'], note: '10分で作れる' },
        { name: 'トマトオムレツ', needs: ['卵', 'トマト', 'チーズ'], note: '洗い物が少ない' },
        { name: '豆腐チャンプルー', needs: ['豆腐', '卵', 'ベーコン'], note: 'ボリュームが出る' },
        { name: 'ベーコンエッグ丼', needs: ['卵', 'ベーコン'], note: '最短でまとまる' }
      ]
    }
  };
  let model = clone(presets['20分夕飯']);

  root.querySelector('#briefInputZone').innerHTML = '<div class="filter-toolbar" id="dinnerFilters"></div>';
  root.querySelector('#briefResultZone').innerHTML = '<div class="listing-grid" id="dinnerCards"></div>';
  setResultHint('食材を切り替えるたび、今夜作れる候補だけが前に残ります。');

  function render() {
    const active = model.ingredients.filter((item) => item.active).map((item) => item.key);
    byId('dinnerFilters').innerHTML = model.ingredients.map((item, idx) => `
      <button class="tag-btn ${item.active ? 'active' : ''}" data-dinner-idx="${idx}">${escapeHtml(item.key)}</button>
    `).join('');
    byId('dinnerFilters').querySelectorAll('[data-dinner-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        model.ingredients[Number(btn.dataset.dinnerIdx)].active = !model.ingredients[Number(btn.dataset.dinnerIdx)].active;
        render();
      });
    });
    const survivors = model.meals.filter((meal) => meal.needs.every((need) => active.includes(need)));
    byId('dinnerCards').innerHTML = model.meals.map((meal) => {
      const alive = survivors.includes(meal);
      return `<div class="listing-card ${alive ? '' : 'dead'}">
        <div class="listing-title">${escapeHtml(meal.name)}</div>
        <div class="subline">${escapeHtml(alive ? meal.note : '食材が足りないので今日は外れます')}</div>
        <div class="listing-badges">${meal.needs.map((need) => `<span class="badge ${active.includes(need) ? 'hit' : ''}">${escapeHtml(need)}</span>`).join('')}</div>
      </div>`;
    }).join('');
    setHeroStat(`${survivors.length}品`);
    setStatusCards([
      { label: '今ある食材', value: `${active.length}つ` },
      { label: '作れる候補', value: `${survivors.length}品` },
      { label: '外れた候補', value: `${model.meals.length - survivors.length}品` }
    ]);
    setResultLead(survivors.length ? '検索より先に候補が数枚へ減るので、今日作る物をその場で決められます。' : '食材が少なすぎるので、1つ戻すと候補が復活します。');
  }

  mountPresetButtons([{ label: '20分夕飯', action: () => { model = clone(presets['20分夕飯']); render(); } }]);
  state.helpers.runBriefSample = () => { model = clone(presets['20分夕飯']); render(); };
  render();
}

function setupCableMatch(root) {
  const presets = {
    '出張セット': {
      devices: [
        { key: 'ノートPC', active: true, needs: ['USB-C 65W', 'USB-C ケーブル'] },
        { key: 'スマホ', active: true, needs: ['USB-C ケーブル'] },
        { key: 'イヤホン', active: false, needs: ['USB-C ケーブル'] },
        { key: 'タブレット', active: false, needs: ['USB-C 30W', 'USB-C ケーブル'] }
      ],
      accessories: ['USB-C 65W', 'USB-C 30W', 'USB-C ケーブル', 'Lightning ケーブル', 'モバイルバッテリー']
    }
  };
  let model = clone(presets['出張セット']);

  root.querySelector('#briefInputZone').innerHTML = '<div class="filter-toolbar" id="deviceFilters"></div>';
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="cut-board">
      <div class="item-grid" id="requiredAccessories"></div>
      <div class="overflow-list" id="extraAccessories"></div>
    </div>
  `;
  setResultHint('端末を切り替えるたび、今日持つ充電器だけが皿に残ります。');

  function render() {
    const activeDevices = model.devices.filter((item) => item.active);
    const required = [...new Set(activeDevices.flatMap((item) => item.needs))];
    const extras = model.accessories.filter((item) => !required.includes(item));
    byId('deviceFilters').innerHTML = model.devices.map((item, idx) => `
      <button class="tag-btn ${item.active ? 'active' : ''}" data-device-idx="${idx}">${escapeHtml(item.key)}</button>
    `).join('');
    byId('deviceFilters').querySelectorAll('[data-device-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        model.devices[Number(btn.dataset.deviceIdx)].active = !model.devices[Number(btn.dataset.deviceIdx)].active;
        render();
      });
    });
    byId('requiredAccessories').innerHTML = required.length
      ? required.map((item) => `<div class="item-card keep"><div class="item-title">${escapeHtml(item)}</div><div class="subline">今日の端末に必要です</div></div>`).join('')
      : '<div class="empty-state">端末を選ぶと必要な充電器が出ます。</div>';
    byId('extraAccessories').innerHTML = extras.length
      ? extras.map((item) => `<div class="overflow-pill"><strong>${escapeHtml(item)}</strong><div class="subline">今回は置いていけます</div></div>`).join('')
      : '<div class="empty-state">余計な充電器はありません。</div>';
    setHeroStat(`${required.length}点`);
    setStatusCards([
      { label: '持つ端末', value: `${activeDevices.length}台` },
      { label: '必要な充電器', value: `${required.length}点` },
      { label: '置いていく物', value: `${extras.length}点` }
    ]);
    setResultLead('必要な充電器と置いていく物が同時に見えるので、多めに詰めるより軽くまとまります。');
  }

  mountPresetButtons([{ label: '出張セット', action: () => { model = clone(presets['出張セット']); render(); } }]);
  state.helpers.runBriefSample = () => { model = clone(presets['出張セット']); render(); };
  render();
}

function setupDryRack(root) {
  const presets = {
    '洗濯直後': [
      { name: 'バスタオル', lane: 'now', slot: '広い列', note: '乾きにくい' },
      { name: 'シャツ', lane: 'now', slot: '中央', note: 'しわを伸ばしたい' },
      { name: '靴下', lane: 'now', slot: '小物列', note: '今なら入る' },
      { name: 'パーカー', lane: 'later', slot: '', note: '今日は待機' },
      { name: 'シーツ', lane: 'later', slot: '', note: '次の晴れ日に回す' }
    ]
  };
  let items = clone(presets['洗濯直後']);

  root.querySelector('#briefInputZone').innerHTML = '<div class="item-grid" id="dryControls"></div>';
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="compartment-grid">
      <div class="compartment" id="dryWide"><strong>広い列</strong></div>
      <div class="compartment" id="dryCenter"><strong>中央</strong></div>
      <div class="compartment" id="drySmall"><strong>小物列</strong></div>
    </div>
    <div class="overflow-list" id="dryWaiting"></div>
  `;
  setResultHint('干し場に掛ける / 待たせるを切り替えると、今干せる一回分がすぐ見えます。');

  function render() {
    byId('dryControls').innerHTML = items.map((item, idx) => `
      <div class="item-card ${item.lane === 'now' ? 'keep' : 'cut'}">
        <div><div class="item-title">${escapeHtml(item.name)}</div><div class="subline">${escapeHtml(item.note)}</div></div>
        <button class="assign-btn" data-dry-idx="${idx}">${item.lane === 'now' ? '待たせる' : '今干す'}</button>
      </div>
    `).join('');
    root.querySelectorAll('[data-dry-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.dryIdx);
        items[idx].lane = items[idx].lane === 'now' ? 'later' : 'now';
        render();
      });
    });
    const now = items.filter((item) => item.lane === 'now');
    const renderSlot = (slot) => now.filter((item) => item.slot === slot).map((item) => `<div class="overflow-pill"><strong>${escapeHtml(item.name)}</strong><div class="subline">${escapeHtml(item.note)}</div></div>`).join('') || '<div class="empty-state">まだ空いています。</div>';
    byId('dryWide').innerHTML = '<strong>広い列</strong>' + renderSlot('広い列');
    byId('dryCenter').innerHTML = '<strong>中央</strong>' + renderSlot('中央');
    byId('drySmall').innerHTML = '<strong>小物列</strong>' + renderSlot('小物列');
    const later = items.filter((item) => item.lane !== 'now');
    byId('dryWaiting').innerHTML = later.length ? later.map((item) => `<div class="overflow-pill"><strong>${escapeHtml(item.name)}</strong><div class="subline">${escapeHtml(item.note)}</div></div>`).join('') : '<div class="empty-state">待ち列はありません。</div>';
    setHeroStat(`${now.length}点`);
    setStatusCards([
      { label: '今干す物', value: `${now.length}点` },
      { label: '待つ物', value: `${later.length}点` },
      { label: '干し場', value: '3列' }
    ]);
    setResultLead('干し場に乗る分と待つ分が分かれるので、適当に重ねるより早く順番が決まります。');
  }

  mountPresetButtons([{ label: '洗濯直後', action: () => { items = clone(presets['洗濯直後']); render(); } }]);
  state.helpers.runBriefSample = () => { items = clone(presets['洗濯直後']); render(); };
  render();
}

function setupReturnBox(root) {
  const presets = {
    '期限が近い順': [
      { name: 'スニーカー', lane: 'now', deadline: '明日', note: 'サイズ交換' },
      { name: 'シャツ', lane: 'now', deadline: '2日後', note: '色が違った' },
      { name: 'スマホケース', lane: 'later', deadline: '5日後', note: '週末に持ち込む' },
      { name: 'ライト', lane: 'later', deadline: '1週間後', note: 'まだ迷っている' }
    ]
  };
  let items = clone(presets['期限が近い順']);

  root.querySelector('#briefInputZone').innerHTML = '<div class="item-grid" id="returnControls"></div>';
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="cut-board">
      <div class="item-grid" id="returnNowBox"></div>
      <div class="overflow-list" id="returnLater"></div>
    </div>
  `;
  setResultHint('箱へ入れる / 後回しを切り替えると、今夜返す一箱分だけが残ります。');

  function render() {
    byId('returnControls').innerHTML = items.map((item, idx) => `
      <div class="item-card ${item.lane === 'now' ? 'keep' : 'cut'}">
        <div><div class="item-title">${escapeHtml(item.name)}</div><div class="subline">期限 ${escapeHtml(item.deadline)} / ${escapeHtml(item.note)}</div></div>
        <button class="assign-btn" data-return-idx="${idx}">${item.lane === 'now' ? '後回し' : '今返す箱へ'}</button>
      </div>
    `).join('');
    root.querySelectorAll('[data-return-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.returnIdx);
        items[idx].lane = items[idx].lane === 'now' ? 'later' : 'now';
        render();
      });
    });
    const now = items.filter((item) => item.lane === 'now');
    const later = items.filter((item) => item.lane !== 'now');
    byId('returnNowBox').innerHTML = now.length
      ? now.map((item) => `<div class="item-card keep"><div class="item-title">${escapeHtml(item.name)}</div><div class="subline">期限 ${escapeHtml(item.deadline)} / ${escapeHtml(item.note)}</div></div>`).join('')
      : '<div class="empty-state">今返す物を箱に入れると、ここにまとまります。</div>';
    byId('returnLater').innerHTML = later.length
      ? later.map((item) => `<div class="overflow-pill"><strong>${escapeHtml(item.name)}</strong><div class="subline">期限 ${escapeHtml(item.deadline)}</div></div>`).join('')
      : '<div class="empty-state">後回し候補はありません。</div>';
    setHeroStat(`${now.length}点`);
    setStatusCards([
      { label: '今返す物', value: `${now.length}点` },
      { label: '後回し', value: `${later.length}点` },
      { label: '最短期限', value: now[0] ? now[0].deadline : '未選択' }
    ]);
    setResultLead('期限ラベルつきで今返す物がまとまるので、玄関に積むより判断が速く進みます。');
  }

  mountPresetButtons([{ label: '期限が近い順', action: () => { items = clone(presets['期限が近い順']); render(); } }]);
  state.helpers.runBriefSample = () => { items = clone(presets['期限が近い順']); render(); };
  render();
}

function setupPhotoPurge(root) {
  const presets = {
    '旅行写真': [
      { name: '海-1', lane: 'keep', note: '表情がいちばん良い' },
      { name: '海-2', lane: 'drop', note: '少しブレている' },
      { name: '夕日-1', lane: 'keep', note: '色が残っている' },
      { name: '夕日-2', lane: 'drop', note: '同じ構図' },
      { name: '集合-1', lane: 'drop', note: '目線がずれている' }
    ]
  };
  let items = clone(presets['旅行写真']);

  root.querySelector('#briefInputZone').innerHTML = '<div class="item-grid" id="photoControls"></div>';
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="cut-board">
      <div class="listing-grid" id="photoKeep"></div>
      <div class="overflow-list" id="photoDrop"></div>
    </div>
  `;
  setResultHint('残す / 削除候補を切り替えるたび、壁がすっきりしていきます。');

  function render() {
    byId('photoControls').innerHTML = items.map((item, idx) => `
      <div class="item-card ${item.lane === 'keep' ? 'keep' : 'cut'}">
        <div><div class="item-title">${escapeHtml(item.name)}</div><div class="subline">${escapeHtml(item.note)}</div></div>
        <div class="pill-row">
          <button class="assign-btn" data-photo-idx="${idx}" data-lane="keep">残す</button>
          <button class="assign-btn" data-photo-idx="${idx}" data-lane="drop">削除候補</button>
        </div>
      </div>
    `).join('');
    root.querySelectorAll('[data-photo-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        items[Number(btn.dataset.photoIdx)].lane = btn.dataset.lane;
        render();
      });
    });
    const keep = items.filter((item) => item.lane === 'keep');
    const drop = items.filter((item) => item.lane !== 'keep');
    byId('photoKeep').innerHTML = keep.length
      ? keep.map((item) => `<div class="listing-card"><div class="listing-title">${escapeHtml(item.name)}</div><div class="subline">${escapeHtml(item.note)}</div></div>`).join('')
      : '<div class="empty-state">残す写真を選ぶと、ここに残ります。</div>';
    byId('photoDrop').innerHTML = drop.length
      ? drop.map((item) => `<div class="overflow-pill"><strong>${escapeHtml(item.name)}</strong><div class="subline">${escapeHtml(item.note)}</div></div>`).join('')
      : '<div class="empty-state">削除候補はありません。</div>';
    setHeroStat(`${keep.length}枚`);
    setStatusCards([
      { label: '残す写真', value: `${keep.length}枚` },
      { label: '削除候補', value: `${drop.length}枚` },
      { label: '整理進捗', value: `${Math.round((keep.length / items.length) * 100)}%` }
    ]);
    setResultLead('残す壁と削除候補が分かれるので、一覧を眺めるだけの整理より前に進みやすくなります。');
  }

  mountPresetButtons([{ label: '旅行写真', action: () => { items = clone(presets['旅行写真']); render(); } }]);
  state.helpers.runBriefSample = () => { items = clone(presets['旅行写真']); render(); };
  render();
}

function setupTrashDay(root) {
  const presets = {
    '前夜の分別': [
      { name: '牛乳パック', lane: 'next', note: '資源回収日' },
      { name: '生ごみ袋', lane: 'tomorrow', note: '可燃で出せる' },
      { name: '段ボール', lane: 'next', note: '次回の資源日' },
      { name: '壊れた傘', lane: 'bulky', note: '粗大で確認' }
    ]
  };
  let items = clone(presets['前夜の分別']);

  root.querySelector('#briefInputZone').innerHTML = '<div class="item-grid" id="trashControls"></div>';
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="compartment-grid">
      <div class="compartment" id="trashTomorrow"><strong>明日出す</strong></div>
      <div class="compartment" id="trashNext"><strong>次回</strong></div>
      <div class="compartment" id="trashBulky"><strong>粗大 / 要確認</strong></div>
    </div>
  `;
  setResultHint('出し先の列を切り替えるたび、明日出す物だけが先にまとまります。');

  function render() {
    byId('trashControls').innerHTML = items.map((item, idx) => `
      <div class="item-card ${item.lane === 'tomorrow' ? 'keep' : 'cut'}">
        <div><div class="item-title">${escapeHtml(item.name)}</div><div class="subline">${escapeHtml(item.note)}</div></div>
        <div class="pill-row">
          <button class="assign-btn" data-trash-idx="${idx}" data-lane="tomorrow">明日</button>
          <button class="assign-btn" data-trash-idx="${idx}" data-lane="next">次回</button>
          <button class="assign-btn" data-trash-idx="${idx}" data-lane="bulky">粗大</button>
        </div>
      </div>
    `).join('');
    root.querySelectorAll('[data-trash-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        items[Number(btn.dataset.trashIdx)].lane = btn.dataset.lane;
        render();
      });
    });
    const laneHtml = (lane) => items.filter((item) => item.lane === lane)
      .map((item) => `<div class="overflow-pill"><strong>${escapeHtml(item.name)}</strong><div class="subline">${escapeHtml(item.note)}</div></div>`)
      .join('') || '<div class="empty-state">まだありません。</div>';
    byId('trashTomorrow').innerHTML = '<strong>明日出す</strong>' + laneHtml('tomorrow');
    byId('trashNext').innerHTML = '<strong>次回</strong>' + laneHtml('next');
    byId('trashBulky').innerHTML = '<strong>粗大 / 要確認</strong>' + laneHtml('bulky');
    setHeroStat(`${items.filter((item) => item.lane === 'tomorrow').length}点`);
    setStatusCards([
      { label: '明日出す', value: `${items.filter((item) => item.lane === 'tomorrow').length}点` },
      { label: '次回', value: `${items.filter((item) => item.lane === 'next').length}点` },
      { label: '要確認', value: `${items.filter((item) => item.lane === 'bulky').length}点` }
    ]);
    setResultLead('明日出す列だけが先に埋まるので、自治体サイトを見続けるより前夜の準備が早く終わります。');
  }

  mountPresetButtons([{ label: '前夜の分別', action: () => { items = clone(presets['前夜の分別']); render(); } }]);
  state.helpers.runBriefSample = () => { items = clone(presets['前夜の分別']); render(); };
  render();
}

function setupDeskCheckout(root) {
  const presets = {
    '退勤前': [
      { name: 'ノートPC', lane: 'take', note: '家でも作業あり' },
      { name: '充電器', lane: 'take', note: '家で必要' },
      { name: '文房具', lane: 'leave', note: '机に置く' },
      { name: '資料ファイル', lane: 'leave', note: '明日また使う' }
    ]
  };
  let items = clone(presets['退勤前']);

  root.querySelector('#briefInputZone').innerHTML = '<div class="item-grid" id="deskControls"></div>';
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="request-cards">
      <div class="request-card" id="deskTake"><strong>持ち帰る</strong></div>
      <div class="request-card" id="deskLeave"><strong>机に残す</strong></div>
    </div>
  `;
  setResultHint('持ち帰る / 机に残すを切り替えると、今夜必要な物だけがまとまります。');

  function render() {
    byId('deskControls').innerHTML = items.map((item, idx) => `
      <div class="item-card ${item.lane === 'take' ? 'keep' : 'cut'}">
        <div><div class="item-title">${escapeHtml(item.name)}</div><div class="subline">${escapeHtml(item.note)}</div></div>
        <div class="pill-row">
          <button class="assign-btn" data-desk-idx="${idx}" data-lane="take">持ち帰る</button>
          <button class="assign-btn" data-desk-idx="${idx}" data-lane="leave">机に置く</button>
        </div>
      </div>
    `).join('');
    root.querySelectorAll('[data-desk-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        items[Number(btn.dataset.deskIdx)].lane = btn.dataset.lane;
        render();
      });
    });
    const laneHtml = (lane) => items.filter((item) => item.lane === lane)
      .map((item) => `<div class="overflow-pill"><strong>${escapeHtml(item.name)}</strong><div class="subline">${escapeHtml(item.note)}</div></div>`)
      .join('') || '<div class="empty-state">まだありません。</div>';
    byId('deskTake').innerHTML = '<strong>持ち帰る</strong>' + laneHtml('take');
    byId('deskLeave').innerHTML = '<strong>机に残す</strong>' + laneHtml('leave');
    setHeroStat(`${items.filter((item) => item.lane === 'take').length}点`);
    setStatusCards([
      { label: '持ち帰る', value: `${items.filter((item) => item.lane === 'take').length}点` },
      { label: '残す', value: `${items.filter((item) => item.lane === 'leave').length}点` },
      { label: '机上整理', value: '完了前' }
    ]);
    setResultLead('今夜必要な物だけがトレイに残るので、全部入れて帰るより軽く終わります。');
  }

  mountPresetButtons([{ label: '退勤前', action: () => { items = clone(presets['退勤前']); render(); } }]);
  state.helpers.runBriefSample = () => { items = clone(presets['退勤前']); render(); };
  render();
}

function setupToneBalance(root) {
  const presets = {
    '仕事の依頼を断る': {
      scene: '今週は手がいっぱいです',
      tones: [
        { label: 'やわらかめ', text: '今回は難しいのですが、別日なら相談できます。' },
        { label: 'ちょうどよい', text: '今週は難しいので、今回は見送らせてください。' },
        { label: 'はっきりめ', text: '今回は対応できないため、お受けできません。' }
      ]
    }
  };
  let model = clone(presets['仕事の依頼を断る']);
  let tone = 2;

  root.querySelector('#briefInputZone').innerHTML = `
    <div class="brief-form">
      <div class="mini-note">${escapeHtml(model.scene)}</div>
      <label>強さ <input id="toneRange" type="range" min="1" max="3" value="${tone}"></label>
    </div>
  `;
  root.querySelector('#briefResultZone').innerHTML = '<div class="listing-grid" id="toneCards"></div>';
  setResultHint('つまみを動かすと、送れそうな言い回しが中央に寄ってきます。');

  function render() {
    const activeIdx = tone - 1;
    byId('toneCards').innerHTML = model.tones.map((item, idx) => `
      <div class="listing-card ${idx === activeIdx ? '' : 'dead'}">
        <div class="listing-title">${escapeHtml(item.label)}</div>
        <div class="subline">${escapeHtml(item.text)}</div>
      </div>
    `).join('');
    setHeroStat(model.tones[activeIdx].label);
    setStatusCards([
      { label: 'いまの温度', value: model.tones[activeIdx].label },
      { label: '比較候補', value: `${model.tones.length}枚` },
      { label: '送れそう度', value: activeIdx === 1 ? '高い' : '調整中' }
    ]);
    setResultLead('強さを動かすと候補カードが入れ替わるので、検索より先にちょうどよい温度が見つかります。');
  }

  byId('toneRange').addEventListener('input', (e) => {
    tone = Number(e.target.value);
    render();
  });
  mountPresetButtons([{ label: '仕事の依頼を断る', action: () => { model = clone(presets['仕事の依頼を断る']); tone = 2; byId('toneRange').value = '2'; render(); } }]);
  state.helpers.runBriefSample = () => { model = clone(presets['仕事の依頼を断る']); tone = 2; byId('toneRange').value = '2'; render(); };
  render();
}

function setupFridgeRescue(root) {
  const presets = {
    '冷蔵庫の夕飯': {
      ingredients: [
        { name: '卵', days: 1 },
        { name: 'ベーコン', days: 2 },
        { name: 'チーズ', days: 4 },
        { name: 'トマト', days: 2 }
      ],
      meals: [
        { name: 'カルボナーラ風うどん', needs: '卵, ベーコン, チーズ' },
        { name: 'トマトオムレツ', needs: '卵, トマト, チーズ' },
        { name: 'ベーコンエッグ丼', needs: '卵, ベーコン' }
      ]
    }
  };
  let model = clone(presets['冷蔵庫の夕飯']);

  root.querySelector('#briefInputZone').innerHTML = `
    <div class="row-stack" id="ingredientRows"></div>
    <div class="inline-fields">
      <input id="newIngredientName" class="text-input" placeholder="食材名">
      <input id="newIngredientDays" class="money-input" type="number" min="0" value="2">
      <button id="addIngredientBtn" class="secondary-btn">食材を追加</button>
    </div>
    <div class="row-stack" id="mealRows"></div>
    <div class="inline-fields--wide">
      <input id="newMealName" class="text-input" placeholder="候補名">
      <input id="newMealNeeds" class="text-input" placeholder="必要食材をカンマ区切り">
      <div class="subline">例: 卵, ベーコン</div>
      <button id="addMealBtn" class="secondary-btn">候補を追加</button>
    </div>
  `;
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="detail-row">
      <section class="sample-card">
        <h2>先に使う食材</h2>
        <div class="row-stack" id="urgentIngredientList"></div>
      </section>
      <section class="legend-card">
        <h2>今夜作れる候補</h2>
        <div class="listing-grid" id="fridgeMealList"></div>
      </section>
    </div>
  `;
  setResultHint('残り日数や食材名を書き換えると、先に使う食材と作れる候補がすぐ入れ替わります。');

  function normalizedIngredients() {
    return model.ingredients
      .map((item) => ({ name: (item.name || '').trim(), days: Number(item.days || 0) }))
      .filter((item) => item.name);
  }

  function normalizedMeals() {
    return model.meals
      .map((item) => ({
        name: (item.name || '').trim(),
        needs: String(item.needs || '').split(',').map((token) => token.trim()).filter(Boolean)
      }))
      .filter((item) => item.name && item.needs.length);
  }

  function render() {
    const ingredientRows = byId('ingredientRows');
    ingredientRows.innerHTML = normalizedIngredients().map((item, idx) => `
      <div class="row-card inline-fields">
        <input class="text-input" data-ing-name="${idx}" value="${escapeHtml(item.name)}">
        <input class="money-input" data-ing-days="${idx}" type="number" min="0" value="${item.days}">
        <button class="assign-btn" data-ing-remove="${idx}">削除</button>
      </div>
    `).join('') || '<div class="empty-state">食材を足すと、先に使う物がここから見えます。</div>';
    normalizedIngredients().forEach((item, idx) => {
      ingredientRows.querySelector(`[data-ing-name="${idx}"]`)?.addEventListener('input', (e) => {
        model.ingredients[idx].name = e.target.value;
        render();
      });
      ingredientRows.querySelector(`[data-ing-days="${idx}"]`)?.addEventListener('input', (e) => {
        model.ingredients[idx].days = Number(e.target.value || 0);
        render();
      });
      ingredientRows.querySelector(`[data-ing-remove="${idx}"]`)?.addEventListener('click', () => {
        model.ingredients.splice(idx, 1);
        render();
      });
    });

    const mealRows = byId('mealRows');
    mealRows.innerHTML = normalizedMeals().map((meal, idx) => `
      <div class="row-card inline-fields--wide">
        <input class="text-input" data-meal-name="${idx}" value="${escapeHtml(meal.name)}">
        <input class="text-input" data-meal-needs="${idx}" value="${escapeHtml(meal.needs.join(', '))}">
        <div class="subline">${escapeHtml(meal.needs.length)}食材で成立</div>
        <button class="assign-btn" data-meal-remove="${idx}">削除</button>
      </div>
    `).join('') || '<div class="empty-state">候補を足すと、今夜作れる物だけが残ります。</div>';
    normalizedMeals().forEach((meal, idx) => {
      mealRows.querySelector(`[data-meal-name="${idx}"]`)?.addEventListener('input', (e) => {
        model.meals[idx].name = e.target.value;
        render();
      });
      mealRows.querySelector(`[data-meal-needs="${idx}"]`)?.addEventListener('input', (e) => {
        model.meals[idx].needs = e.target.value;
        render();
      });
      mealRows.querySelector(`[data-meal-remove="${idx}"]`)?.addEventListener('click', () => {
        model.meals.splice(idx, 1);
        render();
      });
    });

    const ingredients = normalizedIngredients();
    const ingredientMap = Object.fromEntries(ingredients.map((item) => [item.name, item.days]));
    const urgent = [...ingredients].sort((a, b) => a.days - b.days).slice(0, 3);
    const meals = normalizedMeals()
      .map((meal) => {
        const missing = meal.needs.filter((need) => ingredientMap[need] == null);
        const priority = Math.min(...meal.needs.map((need) => ingredientMap[need] ?? 999));
        const urgentNeed = meal.needs.slice().sort((a, b) => (ingredientMap[a] ?? 999) - (ingredientMap[b] ?? 999))[0] || '';
        return { ...meal, missing, priority, urgentNeed };
      })
      .filter((meal) => meal.missing.length === 0)
      .sort((a, b) => a.priority - b.priority);

    byId('urgentIngredientList').innerHTML = urgent.length
      ? urgent.map((item) => `<div class="warning-card"><strong>${escapeHtml(item.name)}</strong><div class="subline">残り ${item.days}日</div></div>`).join('')
      : '<div class="empty-state">食材を足すと優先順が出ます。</div>';
    byId('fridgeMealList').innerHTML = meals.length
      ? meals.map((meal) => `<div class="listing-card"><div class="listing-title">${escapeHtml(meal.name)}</div><div class="subline">先に使う: ${escapeHtml(meal.urgentNeed)} / 材料: ${escapeHtml(meal.needs.join('・'))}</div></div>`).join('')
      : '<div class="empty-state">足りる材料の候補だけがここに残ります。</div>';

    setHeroStat(urgent[0] ? `${urgent[0].name} ${urgent[0].days}日` : '未入力');
    setStatusCards([
      { label: '先に使う食材', value: `${Math.min(urgent.length, ingredients.length)}つ` },
      { label: '作れる候補', value: `${meals.length}品` },
      { label: '不足食材', value: `${Math.max(0, normalizedMeals().length - meals.length)}品分` }
    ]);
    setResultLead(meals.length ? '先に使う食材と今夜作れる候補が同時に見えるので、検索より早く決まります。' : '材料が足りる候補がないので、候補名や食材を少し足すと復活します。');
  }

  byId('addIngredientBtn').addEventListener('click', () => {
    const name = (byId('newIngredientName').value || '').trim();
    if (!name) return;
    model.ingredients.push({ name, days: Number(byId('newIngredientDays').value || 0) });
    byId('newIngredientName').value = '';
    byId('newIngredientDays').value = '2';
    render();
  });
  byId('addMealBtn').addEventListener('click', () => {
    const name = (byId('newMealName').value || '').trim();
    const needs = (byId('newMealNeeds').value || '').trim();
    if (!name || !needs) return;
    model.meals.push({ name, needs });
    byId('newMealName').value = '';
    byId('newMealNeeds').value = '';
    render();
  });

  mountPresetButtons([{ label: '冷蔵庫の夕飯', action: () => { model = clone(presets['冷蔵庫の夕飯']); render(); } }]);
  state.helpers.runBriefSample = () => { model = clone(presets['冷蔵庫の夕飯']); render(); };
  render();
}

function setupQuoteWatcher(root) {
  const presets = {
    '3社見積もり': {
      vendors: ['A社', 'B社', 'C社'],
      rows: [
        { label: '初期費用', values: ['120000', '110000', '120000'] },
        { label: '設置費', values: ['込み', '', '別料金'] },
        { label: '月額保守', values: ['18000', '19000', '18000'] },
        { label: '解約手数料', values: ['あり', 'あり', 'なし'] }
      ]
    }
  };
  let model = clone(presets['3社見積もり']);

  root.querySelector('#briefInputZone').innerHTML = `
    <div class="mini-grid">
      <input id="vendorA" class="text-input" placeholder="会社名A">
      <input id="vendorB" class="text-input" placeholder="会社名B">
      <input id="vendorC" class="text-input" placeholder="会社名C">
    </div>
    <div class="quote-grid">
      <div class="quote-header"><span>項目</span><span id="vendorAHead"></span><span id="vendorBHead"></span><span id="vendorCHead"></span><span>操作</span></div>
      <div id="quoteRows"></div>
    </div>
    <div class="quote-row">
      <input id="newQuoteLabel" class="text-input" placeholder="条件項目">
      <input id="newQuoteA" class="text-input" placeholder="A社">
      <input id="newQuoteB" class="text-input" placeholder="B社">
      <input id="newQuoteC" class="text-input" placeholder="C社">
      <button id="addQuoteRowBtn" class="secondary-btn">行を追加</button>
    </div>
  `;
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="detail-row">
      <section class="sample-card">
        <h2>要確認の前提</h2>
        <div class="warning-list" id="quoteAlertList"></div>
      </section>
      <section class="legend-card">
        <h2>聞き返しメモ</h2>
        <div class="row-stack" id="quoteQuestionList"></div>
      </section>
    </div>
  `;
  setResultHint('空欄や表現差がある行だけが浮くので、金額順より先に確認ポイントが見えます。');

  function syncVendorHeads() {
    ['A', 'B', 'C'].forEach((key, idx) => {
      const value = model.vendors[idx] || `${key}社`;
      byId(`vendor${key}`).value = value;
      byId(`vendor${key}Head`).textContent = value;
    });
  }

  function render() {
    syncVendorHeads();
    const rowsWrap = byId('quoteRows');
    rowsWrap.innerHTML = model.rows.map((row, idx) => {
      const values = row.values.map((value) => (value || '').trim());
      const unique = [...new Set(values.filter(Boolean))];
      const hasGap = values.some((value) => !value) || unique.length > 1;
      return `<div class="quote-row row-card ${hasGap ? 'quote-row--alert' : ''}">
        <input class="text-input" data-quote-label="${idx}" value="${escapeHtml(row.label)}">
        <input class="text-input" data-quote-value="${idx}-0" value="${escapeHtml(values[0] || '')}">
        <input class="text-input" data-quote-value="${idx}-1" value="${escapeHtml(values[1] || '')}">
        <input class="text-input" data-quote-value="${idx}-2" value="${escapeHtml(values[2] || '')}">
        <button class="assign-btn" data-quote-remove="${idx}">削除</button>
      </div>`;
    }).join('') || '<div class="empty-state">条件行を足すと、差のある所だけがここに出ます。</div>';

    model.rows.forEach((row, idx) => {
      rowsWrap.querySelector(`[data-quote-label="${idx}"]`)?.addEventListener('input', (e) => {
        model.rows[idx].label = e.target.value;
        render();
      });
      [0, 1, 2].forEach((col) => {
        rowsWrap.querySelector(`[data-quote-value="${idx}-${col}"]`)?.addEventListener('input', (e) => {
          model.rows[idx].values[col] = e.target.value;
          render();
        });
      });
      rowsWrap.querySelector(`[data-quote-remove="${idx}"]`)?.addEventListener('click', () => {
        model.rows.splice(idx, 1);
        render();
      });
    });

    const alerts = model.rows.map((row) => {
      const values = row.values.map((value) => (value || '').trim());
      const unique = [...new Set(values.filter(Boolean))];
      const missingAt = values.map((value, idx) => (!value ? model.vendors[idx] : null)).filter(Boolean);
      const diff = unique.length > 1;
      return {
        label: row.label,
        diff,
        missingAt,
        values
      };
    }).filter((item) => item.diff || item.missingAt.length);

    byId('quoteAlertList').innerHTML = alerts.length
      ? alerts.map((item) => `<div class="warning-card"><strong>${escapeHtml(item.label)}</strong><div class="subline">${item.missingAt.length ? `未記載: ${escapeHtml(item.missingAt.join(' / '))}` : '表現差あり'}</div></div>`).join('')
      : '<div class="empty-state">要確認の差分はありません。</div>';
    byId('quoteQuestionList').innerHTML = alerts.length
      ? alerts.map((item) => `<div class="row-card"><strong>${escapeHtml(item.label)}</strong><div class="subline">${escapeHtml(item.missingAt.length ? `${item.missingAt.join(' / ')} はこの条件が含まれるか確認する` : 'この項目は同じ条件か、別料金かを確認する')}</div></div>`).join('')
      : '<div class="empty-state">このまま比較を進められます。</div>';

    setHeroStat(`${alerts.length}行`);
    setStatusCards([
      { label: '要確認', value: `${alerts.length}行` },
      { label: '未記載', value: `${alerts.filter((item) => item.missingAt.length).length}行` },
      { label: '表現差', value: `${alerts.filter((item) => item.diff).length}行` }
    ]);
    setResultLead(alerts.length ? '未記載や別表現の行だけが残るので、価格差より先に聞くべき所が見えます。' : 'いまの条件なら、大きな前提差は見えていません。');
  }

  ['A', 'B', 'C'].forEach((key, idx) => {
    byId(`vendor${key}`).addEventListener('input', (e) => {
      model.vendors[idx] = e.target.value || `${key}社`;
      render();
    });
  });
  byId('addQuoteRowBtn').addEventListener('click', () => {
    const label = (byId('newQuoteLabel').value || '').trim();
    if (!label) return;
    model.rows.push({
      label,
      values: [byId('newQuoteA').value || '', byId('newQuoteB').value || '', byId('newQuoteC').value || '']
    });
    ['newQuoteLabel', 'newQuoteA', 'newQuoteB', 'newQuoteC'].forEach((id) => { byId(id).value = ''; });
    render();
  });

  mountPresetButtons([{ label: '3社見積もり', action: () => { model = clone(presets['3社見積もり']); render(); } }]);
  state.helpers.runBriefSample = () => { model = clone(presets['3社見積もり']); render(); };
  render();
}

function setupReminderTone(root) {
  const presets = {
    '返信が止まった相手': {
      recipient: '取引先の佐藤さん',
      purpose: '見積もり確認',
      deadline: '明日17:00',
      lastSent: '3日前',
      points: ['金額の確定', '返信期限の共有']
    }
  };
  let model = clone(presets['返信が止まった相手']);
  let tone = 2;

  root.querySelector('#briefInputZone').innerHTML = `
    <div class="mini-grid">
      <input id="toneRecipient" class="text-input" placeholder="相手">
      <input id="tonePurpose" class="text-input" placeholder="目的">
      <input id="toneDeadline" class="text-input" placeholder="期限">
      <input id="toneLastSent" class="text-input" placeholder="前回送信">
    </div>
    <label>催促の強さ <input id="toneLevelRange" type="range" min="1" max="3" value="2"></label>
    <div class="row-stack" id="tonePointRows"></div>
    <div class="inline-fields">
      <input id="newTonePoint" class="text-input" placeholder="入れたい要点">
      <div class="subline">例: 返信期限</div>
      <button id="addTonePointBtn" class="secondary-btn">要点を追加</button>
    </div>
  `;
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="tag-row" id="toneMissingTags"></div>
    <div class="variant-grid" id="toneVariantGrid"></div>
  `;
  setResultHint('相手や期限を書き換えると、3段階の文案と不足タグが同時に変わります。');

  function bindModelInputs() {
    [['toneRecipient', 'recipient'], ['tonePurpose', 'purpose'], ['toneDeadline', 'deadline'], ['toneLastSent', 'lastSent']].forEach(([id, key]) => {
      byId(id).value = model[key] || '';
      byId(id).addEventListener('input', (e) => {
        model[key] = e.target.value;
        render();
      });
    });
  }

  function toneTexts() {
    const base = {
      soft: `${model.recipient}、${model.purpose}の件でご状況だけでも伺えたら助かります。${model.deadline ? `${model.deadline}までに一言いただけると安心です。` : ''}`,
      mid: `${model.recipient}、${model.purpose}について確認したくご連絡しました。${model.deadline ? `${model.deadline}までにご返信いただけると進めやすいです。` : 'ご確認のうえご返信をお願いします。'}`,
      strong: `${model.recipient}、${model.purpose}の進行上、${model.deadline || '今週中'}までにご返信をお願いできますでしょうか。難しい場合はその旨だけでも共有いただけると助かります。`
    };
    const pointLine = model.points.filter(Boolean).length ? ` 要点: ${model.points.filter(Boolean).join(' / ')}` : '';
    return [base.soft + pointLine, base.mid + pointLine, base.strong + pointLine];
  }

  function render() {
    const pointRows = byId('tonePointRows');
    pointRows.innerHTML = model.points.length
      ? model.points.map((point, idx) => `
          <div class="row-card inline-fields">
            <input class="text-input" data-tone-point="${idx}" value="${escapeHtml(point)}">
            <div class="subline">本文へ反映</div>
            <button class="assign-btn" data-tone-remove="${idx}">削除</button>
          </div>
        `).join('')
      : '<div class="empty-state">入れたい要点を足すと、不足タグと文案に反映されます。</div>';
    model.points.forEach((point, idx) => {
      pointRows.querySelector(`[data-tone-point="${idx}"]`)?.addEventListener('input', (e) => {
        model.points[idx] = e.target.value;
        render();
      });
      pointRows.querySelector(`[data-tone-remove="${idx}"]`)?.addEventListener('click', () => {
        model.points.splice(idx, 1);
        render();
      });
    });

    const missing = [];
    if (!(model.deadline || '').trim()) missing.push('期限がまだ空です');
    if (!(model.lastSent || '').trim()) missing.push('前回送信がまだ空です');
    if (!model.points.filter(Boolean).length) missing.push('要点がまだ1つもありません');
    byId('toneMissingTags').innerHTML = missing.length
      ? missing.map((item) => `<span class="alert-tag">${escapeHtml(item)}</span>`).join('')
      : '<span class="preview-token">不足情報なし</span>';

    const texts = toneTexts();
    const labels = ['やわらかめ', '標準', '強め'];
    byId('toneVariantGrid').innerHTML = texts.map((text, idx) => `
      <div class="variant-card ${idx === tone - 1 ? 'active' : ''}">
        <strong>${labels[idx]}</strong>
        <textarea class="text-input" rows="6" data-tone-variant="${idx}">${escapeHtml(text)}</textarea>
      </div>
    `).join('');
    byId('toneVariantGrid').querySelectorAll('[data-tone-variant]').forEach((field) => {
      field.addEventListener('input', () => {
        // editable output is intentionally user-owned; keep current text in place
      });
    });

    setHeroStat(labels[tone - 1]);
    setStatusCards([
      { label: 'いまの温度', value: labels[tone - 1] },
      { label: '不足情報', value: `${missing.length}件` },
      { label: '要点', value: `${model.points.filter(Boolean).length}件` }
    ]);
    setResultLead(missing.length ? '不足情報タグが残るので、送る前に足りない所だけ埋められます。' : '3段階の文案を見比べながら、そのまま送れる温度を選べます。');
  }

  bindModelInputs();
  byId('toneLevelRange').addEventListener('input', (e) => {
    tone = Number(e.target.value || 2);
    render();
  });
  byId('addTonePointBtn').addEventListener('click', () => {
    const point = (byId('newTonePoint').value || '').trim();
    if (!point) return;
    model.points.push(point);
    byId('newTonePoint').value = '';
    render();
  });

  mountPresetButtons([{ label: '返信が止まった相手', action: () => { model = clone(presets['返信が止まった相手']); tone = 2; byId('toneLevelRange').value = '2'; bindModelInputs(); render(); } }]);
  state.helpers.runBriefSample = () => { model = clone(presets['返信が止まった相手']); tone = 2; byId('toneLevelRange').value = '2'; bindModelInputs(); render(); };
  render();
}

function setupGapChore(root) {
  const presets = {
    '18分の空き時間': {
      minutes: 18,
      chores: [
        { name: 'ゴミ集め', minutes: 5, place: '玄関' },
        { name: '食器片づけ', minutes: 7, place: 'キッチン' },
        { name: '洗面台を拭く', minutes: 4, place: '洗面所' },
        { name: '洗濯物をたたむ', minutes: 12, place: 'リビング' }
      ]
    }
  };
  let model = clone(presets['18分の空き時間']);

  root.querySelector('#briefInputZone').innerHTML = `
    <div class="inline-fields">
      <input id="gapMinutes" class="money-input" type="number" min="1" value="18">
      <div class="subline">使える分数</div>
      <span></span>
    </div>
    <div class="row-stack" id="gapChoreRows"></div>
    <div class="inline-fields--wide">
      <input id="newGapChoreName" class="text-input" placeholder="家事名">
      <input id="newGapChoreMinutes" class="money-input" type="number" min="1" value="5">
      <input id="newGapChorePlace" class="text-input" placeholder="場所">
      <button id="addGapChoreBtn" class="secondary-btn">家事を追加</button>
    </div>
  `;
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="detail-row">
      <section class="sample-card"><h2>今入る家事</h2><div class="row-stack" id="gapFitList"></div></section>
      <section class="legend-card"><h2>あとで回す家事</h2><div class="row-stack" id="gapOverflowList"></div></section>
    </div>
  `;
  setResultHint('使える分数を変えると、今入る家事とあふれる家事がその場で分かれます。');

  function render() {
    byId('gapMinutes').value = model.minutes;
    const rows = byId('gapChoreRows');
    rows.innerHTML = model.chores.length
      ? model.chores.map((chore, idx) => `
          <div class="row-card inline-fields--wide">
            <input class="text-input" data-gap-name="${idx}" value="${escapeHtml(chore.name)}">
            <input class="money-input" data-gap-minutes="${idx}" type="number" min="1" value="${Number(chore.minutes || 0)}">
            <input class="text-input" data-gap-place="${idx}" value="${escapeHtml(chore.place || '')}">
            <button class="assign-btn" data-gap-remove="${idx}">削除</button>
          </div>
        `).join('')
      : '<div class="empty-state">家事を足すと、今入る組み合わせがここから作れます。</div>';

    model.chores.forEach((chore, idx) => {
      rows.querySelector(`[data-gap-name="${idx}"]`)?.addEventListener('input', (e) => { model.chores[idx].name = e.target.value; render(); });
      rows.querySelector(`[data-gap-minutes="${idx}"]`)?.addEventListener('input', (e) => { model.chores[idx].minutes = Number(e.target.value || 0); render(); });
      rows.querySelector(`[data-gap-place="${idx}"]`)?.addEventListener('input', (e) => { model.chores[idx].place = e.target.value; render(); });
      rows.querySelector(`[data-gap-remove="${idx}"]`)?.addEventListener('click', () => { model.chores.splice(idx, 1); render(); });
    });

    const sorted = model.chores
      .map((chore) => ({ ...chore, minutes: Number(chore.minutes || 0) }))
      .filter((chore) => (chore.name || '').trim() && chore.minutes > 0)
      .sort((a, b) => a.minutes - b.minutes);
    let used = 0;
    const fit = [];
    const overflow = [];
    sorted.forEach((chore) => {
      if (used + chore.minutes <= Number(model.minutes || 0)) {
        fit.push(chore);
        used += chore.minutes;
      } else {
        overflow.push(chore);
      }
    });

    byId('gapFitList').innerHTML = fit.length
      ? fit.map((chore) => `<div class="row-card"><strong>${escapeHtml(chore.name)}</strong><div class="subline">${chore.minutes}分 / ${escapeHtml(chore.place)}</div></div>`).join('')
      : '<div class="empty-state">まだ入る家事がありません。</div>';
    byId('gapOverflowList').innerHTML = overflow.length
      ? overflow.map((chore) => `<div class="warning-card"><strong>${escapeHtml(chore.name)}</strong><div class="subline">${chore.minutes}分 / ${escapeHtml(chore.place)}</div></div>`).join('')
      : '<div class="empty-state">あふれる家事はありません。</div>';

    setHeroStat(`${used}分`);
    setStatusCards([
      { label: '使える時間', value: `${model.minutes}分` },
      { label: '今入る家事', value: `${fit.length}件` },
      { label: 'あとで回す', value: `${overflow.length}件` }
    ]);
    setResultLead(fit.length ? '今入る家事だけが上段に残るので、目についた物から始めるより迷いません。' : '使える分数か家事の分数を少し見直すと、入る候補が出ます。');
  }

  byId('gapMinutes').addEventListener('input', (e) => { model.minutes = Number(e.target.value || 0); render(); });
  byId('addGapChoreBtn').addEventListener('click', () => {
    const name = (byId('newGapChoreName').value || '').trim();
    if (!name) return;
    model.chores.push({
      name,
      minutes: Number(byId('newGapChoreMinutes').value || 0),
      place: byId('newGapChorePlace').value || ''
    });
    ['newGapChoreName', 'newGapChorePlace'].forEach((id) => { byId(id).value = ''; });
    byId('newGapChoreMinutes').value = '5';
    render();
  });

  mountPresetButtons([{ label: '18分の空き時間', action: () => { model = clone(presets['18分の空き時間']); render(); } }]);
  state.helpers.runBriefSample = () => { model = clone(presets['18分の空き時間']); render(); };
  render();
}

function setupGiftOverlap(root) {
  const presets = {
    '3人の手土産': {
      people: [
        { name: 'Aさん', avoid: '甘い物NG' },
        { name: 'Bさん', avoid: '要冷蔵は避けたい' },
        { name: 'Cさん', avoid: '軽い物が良い' }
      ],
      gifts: [
        { name: '焼き菓子', category: '甘い', price: 1800 },
        { name: 'お茶', category: '常温', price: 1500 },
        { name: 'ジャム', category: '瓶もの', price: 2200 },
        { name: 'チョコ', category: '甘い', price: 1700 }
      ]
    }
  };
  let model = clone(presets['3人の手土産']);

  root.querySelector('#briefInputZone').innerHTML = `
    <div class="row-stack" id="giftPeopleRows"></div>
    <div class="inline-fields--wide">
      <input id="newGiftPersonName" class="text-input" placeholder="参加者">
      <input id="newGiftPersonAvoid" class="text-input" placeholder="避けたい条件">
      <div class="subline">例: 甘い物NG</div>
      <button id="addGiftPersonBtn" class="secondary-btn">参加者を追加</button>
    </div>
    <div class="row-stack" id="giftItemRows"></div>
    <div class="inline-fields--wide">
      <input id="newGiftName" class="text-input" placeholder="候補名">
      <input id="newGiftCategory" class="text-input" placeholder="カテゴリ">
      <input id="newGiftPrice" class="money-input" type="number" min="0" value="1500">
      <button id="addGiftItemBtn" class="secondary-btn">候補を追加</button>
    </div>
  `;
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="assignment-grid" id="giftAssignmentGrid"></div>
    <div class="warning-list" id="giftWarningList"></div>
  `;
  setResultHint('候補や参加者を書き換えると、担当割り当てとかぶり警告がすぐ入れ替わります。');

  function assignment() {
    const usedCategories = new Set();
    return model.people.map((person, idx) => {
      const avoid = (person.avoid || '').trim();
      const pick = model.gifts.find((gift) => {
        if (usedCategories.has(gift.category)) return false;
        if (avoid && `${gift.name} ${gift.category}`.includes(avoid.replace('NG', '').trim())) return false;
        return true;
      }) || null;
      if (pick) usedCategories.add(pick.category);
      return { person, pick };
    });
  }

  function render() {
    const peopleRows = byId('giftPeopleRows');
    peopleRows.innerHTML = model.people.map((person, idx) => `
      <div class="row-card inline-fields--wide">
        <input class="text-input" data-person-name="${idx}" value="${escapeHtml(person.name)}">
        <input class="text-input" data-person-avoid="${idx}" value="${escapeHtml(person.avoid || '')}">
        <div class="subline">避けたい条件</div>
        <button class="assign-btn" data-person-remove="${idx}">削除</button>
      </div>
    `).join('');
    model.people.forEach((person, idx) => {
      peopleRows.querySelector(`[data-person-name="${idx}"]`)?.addEventListener('input', (e) => { model.people[idx].name = e.target.value; render(); });
      peopleRows.querySelector(`[data-person-avoid="${idx}"]`)?.addEventListener('input', (e) => { model.people[idx].avoid = e.target.value; render(); });
      peopleRows.querySelector(`[data-person-remove="${idx}"]`)?.addEventListener('click', () => { model.people.splice(idx, 1); render(); });
    });

    const giftRows = byId('giftItemRows');
    giftRows.innerHTML = model.gifts.map((gift, idx) => `
      <div class="row-card inline-fields--wide">
        <input class="text-input" data-gift-name="${idx}" value="${escapeHtml(gift.name)}">
        <input class="text-input" data-gift-category="${idx}" value="${escapeHtml(gift.category)}">
        <input class="money-input" data-gift-price="${idx}" type="number" min="0" value="${Number(gift.price || 0)}">
        <button class="assign-btn" data-gift-remove="${idx}">削除</button>
      </div>
    `).join('');
    model.gifts.forEach((gift, idx) => {
      giftRows.querySelector(`[data-gift-name="${idx}"]`)?.addEventListener('input', (e) => { model.gifts[idx].name = e.target.value; render(); });
      giftRows.querySelector(`[data-gift-category="${idx}"]`)?.addEventListener('input', (e) => { model.gifts[idx].category = e.target.value; render(); });
      giftRows.querySelector(`[data-gift-price="${idx}"]`)?.addEventListener('input', (e) => { model.gifts[idx].price = Number(e.target.value || 0); render(); });
      giftRows.querySelector(`[data-gift-remove="${idx}"]`)?.addEventListener('click', () => { model.gifts.splice(idx, 1); render(); });
    });

    const assigned = assignment();
    const categoryCounts = model.gifts.reduce((acc, gift) => {
      const key = (gift.category || '').trim();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const warnings = [
      ...Object.entries(categoryCounts).filter(([, count]) => count > 1).map(([category]) => `${category} がかぶりやすいです`),
      ...assigned.filter((item) => !item.pick).map((item) => `${item.person.name} に割り当てられる候補が不足しています`)
    ];

    byId('giftAssignmentGrid').innerHTML = assigned.length
      ? assigned.map((item) => `<div class="assignment-card"><strong>${escapeHtml(item.person.name)}</strong><div class="subline">${escapeHtml(item.person.avoid || '制約なし')}</div><div class="item-card keep"><div class="item-title">${escapeHtml(item.pick ? item.pick.name : '未割り当て')}</div><div class="subline">${escapeHtml(item.pick ? `${item.pick.category} / ¥${Number(item.pick.price).toLocaleString()}` : '候補を足すと担当が埋まります')}</div></div></div>`).join('')
      : '<div class="empty-state">参加者を足すと担当割り当てが出ます。</div>';
    byId('giftWarningList').innerHTML = warnings.length
      ? warnings.map((item) => `<div class="warning-card"><strong>${escapeHtml(item)}</strong></div>`).join('')
      : '<div class="empty-state">大きなかぶり警告はありません。</div>';

    setHeroStat(`${assigned.filter((item) => item.pick).length}/${assigned.length || 0}`);
    setStatusCards([
      { label: '担当あり', value: `${assigned.filter((item) => item.pick).length}人` },
      { label: 'かぶり警告', value: `${Object.values(categoryCounts).filter((count) => count > 1).length}件` },
      { label: '未割り当て', value: `${assigned.filter((item) => !item.pick).length}人` }
    ]);
    setResultLead(assigned.length ? '誰が何を持つかまで一画面で見えるので、LINEで往復するより早くまとまります。' : '参加者と候補を足すと、担当割り当てがここに出ます。');
  }

  byId('addGiftPersonBtn').addEventListener('click', () => {
    const name = (byId('newGiftPersonName').value || '').trim();
    if (!name) return;
    model.people.push({ name, avoid: byId('newGiftPersonAvoid').value || '' });
    byId('newGiftPersonName').value = '';
    byId('newGiftPersonAvoid').value = '';
    render();
  });
  byId('addGiftItemBtn').addEventListener('click', () => {
    const name = (byId('newGiftName').value || '').trim();
    const category = (byId('newGiftCategory').value || '').trim();
    if (!name || !category) return;
    model.gifts.push({ name, category, price: Number(byId('newGiftPrice').value || 0) });
    ['newGiftName', 'newGiftCategory'].forEach((id) => { byId(id).value = ''; });
    byId('newGiftPrice').value = '1500';
    render();
  });

  mountPresetButtons([{ label: '3人の手土産', action: () => { model = clone(presets['3人の手土産']); render(); } }]);
  state.helpers.runBriefSample = () => { model = clone(presets['3人の手土産']); render(); };
  render();
}

function setupCashfloor(root) {
  const presets = {
    '給料日前': {
      start: 58000,
      rows: [
        { date: '04/27', label: '家賃', type: 'debit', amount: 62000 },
        { date: '04/28', label: 'サブスク', type: 'debit', amount: 4800 },
        { date: '04/30', label: '給与', type: 'income', amount: 180000 },
        { date: '05/02', label: 'カード引落', type: 'debit', amount: 54000 }
      ]
    }
  };
  let model = clone(presets['給料日前']);

  root.querySelector('#briefInputZone').innerHTML = `
    <div class="inline-fields">
      <input id="cashStart" class="money-input" type="number" min="0" value="58000">
      <div class="subline">いまの残高</div>
      <span></span>
    </div>
    <div class="row-stack" id="cashRows"></div>
    <div class="inline-fields--wide">
      <input id="newCashDate" class="text-input" placeholder="日付 04/29">
      <input id="newCashLabel" class="text-input" placeholder="予定名">
      <input id="newCashAmount" class="money-input" type="number" min="0" value="10000">
      <button id="addCashDebitBtn" class="secondary-btn">引落を追加</button>
    </div>
  `;
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="timeline-list" id="cashTimeline"></div>
  `;
  setResultHint('金額を書き換えると、危ない日だけが赤く沈んで見えるようになります。');

  function parseRows() {
    return model.rows
      .map((row) => ({ ...row, amount: Number(row.amount || 0) }))
      .filter((row) => (row.label || '').trim() && (row.date || '').trim());
  }

  function render() {
    byId('cashStart').value = model.start;
    const rowsWrap = byId('cashRows');
    rowsWrap.innerHTML = model.rows.map((row, idx) => `
      <div class="row-card inline-fields--wide">
        <input class="text-input" data-cash-date="${idx}" value="${escapeHtml(row.date)}">
        <input class="text-input" data-cash-label="${idx}" value="${escapeHtml(row.label)}">
        <input class="money-input" data-cash-amount="${idx}" type="number" min="0" value="${Number(row.amount || 0)}">
        <button class="assign-btn" data-cash-toggle="${idx}">${row.type === 'income' ? '入金' : '引落'}</button>
      </div>
    `).join('');
    model.rows.forEach((row, idx) => {
      rowsWrap.querySelector(`[data-cash-date="${idx}"]`)?.addEventListener('input', (e) => { model.rows[idx].date = e.target.value; render(); });
      rowsWrap.querySelector(`[data-cash-label="${idx}"]`)?.addEventListener('input', (e) => { model.rows[idx].label = e.target.value; render(); });
      rowsWrap.querySelector(`[data-cash-amount="${idx}"]`)?.addEventListener('input', (e) => { model.rows[idx].amount = Number(e.target.value || 0); render(); });
      rowsWrap.querySelector(`[data-cash-toggle="${idx}"]`)?.addEventListener('click', () => {
        model.rows[idx].type = model.rows[idx].type === 'income' ? 'debit' : 'income';
        render();
      });
      const removeBtn = document.createElement('button');
      removeBtn.className = 'assign-btn';
      removeBtn.textContent = '削除';
      removeBtn.addEventListener('click', () => {
        model.rows.splice(idx, 1);
        render();
      });
      rowsWrap.querySelector(`[data-cash-toggle="${idx}"]`)?.after(removeBtn);
    });

    let balance = Number(model.start || 0);
    const timeline = parseRows().map((row) => {
      balance += row.type === 'income' ? row.amount : -row.amount;
      return { ...row, balance };
    });
    const minBalance = timeline.reduce((min, row) => Math.min(min, row.balance), Number(model.start || 0));
    const riskDays = timeline.filter((row) => row.balance < 0);
    byId('cashTimeline').innerHTML = timeline.length
      ? timeline.map((row) => {
          const ratio = Math.max(0, Math.min(100, ((row.balance + 50000) / 230000) * 100));
          return `<div class="timeline-card ${row.balance < 0 ? 'risk' : ''}">
            <div><strong>${escapeHtml(row.date)} ${escapeHtml(row.label)}</strong><div class="subline">${row.type === 'income' ? '+' : '-'}¥${row.amount.toLocaleString()}</div></div>
            <div class="timeline-bar"><span style="width:${ratio}%"></span></div>
            <div class="subline">残高 ¥${row.balance.toLocaleString()}</div>
          </div>`;
        }).join('')
      : '<div class="empty-state">入出金予定を足すと、危ない日がここに出ます。</div>';

    setHeroStat(riskDays[0] ? riskDays[0].date : '安全');
    setStatusCards([
      { label: '危ない日', value: `${riskDays.length}日` },
      { label: '最低残高', value: `¥${minBalance.toLocaleString()}` },
      { label: '入出金予定', value: `${timeline.length}件` }
    ]);
    setResultLead(riskDays.length ? '危ない日だけが赤く残るので、通帳のスクショを見比べるより注意日が早く見えます。' : 'いまの予定なら、給料日前まで大きく沈む日はありません。');
  }

  byId('cashStart').addEventListener('input', (e) => { model.start = Number(e.target.value || 0); render(); });
  byId('addCashDebitBtn').addEventListener('click', () => {
    const date = (byId('newCashDate').value || '').trim();
    const label = (byId('newCashLabel').value || '').trim();
    if (!date || !label) return;
    model.rows.push({ date, label, type: 'debit', amount: Number(byId('newCashAmount').value || 0) });
    ['newCashDate', 'newCashLabel'].forEach((id) => { byId(id).value = ''; });
    byId('newCashAmount').value = '10000';
    render();
  });

  mountPresetButtons([{ label: '給料日前', action: () => { model = clone(presets['給料日前']); render(); } }]);
  state.helpers.runBriefSample = () => { model = clone(presets['給料日前']); render(); };
  render();
}

function setupTempSpace(root) {
  const presets = {
    '掃除中の部屋': {
      zones: [
        { name: '窓際', capacity: 12, walkway: 4 },
        { name: '机横', capacity: 8, walkway: 3 },
        { name: '廊下前', capacity: 10, walkway: 6 }
      ],
      items: [
        { name: '段ボールA', size: 3, zone: '窓際' },
        { name: '段ボールB', size: 4, zone: '窓際' },
        { name: '折りたたみ椅子', size: 2, zone: '机横' },
        { name: '本の束', size: 3, zone: '廊下前' }
      ]
    }
  };
  let model = clone(presets['掃除中の部屋']);

  root.querySelector('#briefInputZone').innerHTML = `
    <div class="row-stack" id="zoneRows"></div>
    <div class="inline-fields--wide">
      <input id="newZoneName" class="text-input" placeholder="ゾーン名">
      <input id="newZoneCapacity" class="money-input" type="number" min="1" value="8">
      <input id="newZoneWalkway" class="money-input" type="number" min="0" value="3">
      <button id="addZoneBtn" class="secondary-btn">ゾーンを追加</button>
    </div>
    <div class="row-stack" id="spaceItemRows"></div>
    <div class="inline-fields--wide">
      <input id="newSpaceItemName" class="text-input" placeholder="荷物名">
      <input id="newSpaceItemSize" class="money-input" type="number" min="1" value="2">
      <input id="newSpaceItemZone" class="text-input" placeholder="置きたいゾーン名">
      <button id="addSpaceItemBtn" class="secondary-btn">荷物を追加</button>
    </div>
  `;
  root.querySelector('#briefResultZone').innerHTML = `
    <div class="zone-grid" id="spaceZoneGrid"></div>
    <div class="warning-list" id="spaceWarnings"></div>
  `;
  setResultHint('荷物のサイズや置き場所を変えると、通路余白が足りないゾーンだけが警告されます。');

  function render() {
    const zoneRows = byId('zoneRows');
    zoneRows.innerHTML = model.zones.map((zone, idx) => `
      <div class="row-card inline-fields--wide">
        <input class="text-input" data-zone-name="${idx}" value="${escapeHtml(zone.name)}">
        <input class="money-input" data-zone-capacity="${idx}" type="number" min="1" value="${Number(zone.capacity || 0)}">
        <input class="money-input" data-zone-walkway="${idx}" type="number" min="0" value="${Number(zone.walkway || 0)}">
        <button class="assign-btn" data-zone-remove="${idx}">削除</button>
      </div>
    `).join('');
    model.zones.forEach((zone, idx) => {
      zoneRows.querySelector(`[data-zone-name="${idx}"]`)?.addEventListener('input', (e) => { model.zones[idx].name = e.target.value; render(); });
      zoneRows.querySelector(`[data-zone-capacity="${idx}"]`)?.addEventListener('input', (e) => { model.zones[idx].capacity = Number(e.target.value || 0); render(); });
      zoneRows.querySelector(`[data-zone-walkway="${idx}"]`)?.addEventListener('input', (e) => { model.zones[idx].walkway = Number(e.target.value || 0); render(); });
      zoneRows.querySelector(`[data-zone-remove="${idx}"]`)?.addEventListener('click', () => { model.zones.splice(idx, 1); render(); });
    });

    const itemRows = byId('spaceItemRows');
    itemRows.innerHTML = model.items.map((item, idx) => `
      <div class="row-card inline-fields--wide">
        <input class="text-input" data-space-name="${idx}" value="${escapeHtml(item.name)}">
        <input class="money-input" data-space-size="${idx}" type="number" min="1" value="${Number(item.size || 0)}">
        <input class="text-input" data-space-zone="${idx}" value="${escapeHtml(item.zone || '')}">
        <button class="assign-btn" data-space-remove="${idx}">削除</button>
      </div>
    `).join('');
    model.items.forEach((item, idx) => {
      itemRows.querySelector(`[data-space-name="${idx}"]`)?.addEventListener('input', (e) => { model.items[idx].name = e.target.value; render(); });
      itemRows.querySelector(`[data-space-size="${idx}"]`)?.addEventListener('input', (e) => { model.items[idx].size = Number(e.target.value || 0); render(); });
      itemRows.querySelector(`[data-space-zone="${idx}"]`)?.addEventListener('input', (e) => { model.items[idx].zone = e.target.value; render(); });
      itemRows.querySelector(`[data-space-remove="${idx}"]`)?.addEventListener('click', () => { model.items.splice(idx, 1); render(); });
    });

    const zoneCards = model.zones.map((zone) => {
      const items = model.items.filter((item) => (item.zone || '').trim() === zone.name);
      const used = items.reduce((sum, item) => sum + Number(item.size || 0), 0);
      const freeWalkway = Number(zone.capacity || 0) - used;
      const warn = freeWalkway < Number(zone.walkway || 0);
      return { zone, items, used, freeWalkway, warn };
    });
    byId('spaceZoneGrid').innerHTML = zoneCards.length
      ? zoneCards.map(({ zone, items, used, freeWalkway, warn }) => `<div class="zone-card ${warn ? 'warn' : ''}"><strong>${escapeHtml(zone.name)}</strong><div class="zone-meters"><div class="subline">容量 ${zone.capacity} / 使用 ${used}</div><div class="timeline-bar"><span style="width:${Math.min(100, (used / Math.max(1, zone.capacity)) * 100)}%"></span></div><div class="subline">通路余白 ${freeWalkway}${warn ? ' / <strong>警告</strong>' : ''}</div></div><div class="tag-row">${items.length ? items.map((item) => `<span class="preview-token">${escapeHtml(item.name)} ${item.size}</span>`).join('') : '<span class="subline">まだ空きがあります</span>'}</div></div>`).join('')
      : '<div class="empty-state">ゾーンを足すと、仮置き先の安全さがここに出ます。</div>';
    const warnings = zoneCards.filter((item) => item.warn).map((item) => `${item.zone.name} は通路余白が ${item.freeWalkway} で足りません`);
    const unplaced = model.items.filter((item) => !model.zones.some((zone) => zone.name === (item.zone || '').trim())).map((item) => item.name);
    if (unplaced.length) warnings.push(`未配置: ${unplaced.join(' / ')}`);
    byId('spaceWarnings').innerHTML = warnings.length
      ? warnings.map((item) => `<div class="warning-card"><strong>${escapeHtml(item)}</strong></div>`).join('')
      : '<div class="empty-state">通路を塞ぐ警告はありません。</div>';

    setHeroStat(`${zoneCards.filter((item) => !item.warn).length}/${zoneCards.length || 0}`);
    setStatusCards([
      { label: '安全ゾーン', value: `${zoneCards.filter((item) => !item.warn).length}つ` },
      { label: '警告', value: `${zoneCards.filter((item) => item.warn).length}つ` },
      { label: '未配置', value: `${unplaced.length}点` }
    ]);
    setResultLead(zoneCards.length ? '通路余白が足りない所だけが警告されるので、床置きしてから困る前に直せます。' : 'ゾーンと荷物を足すと、通れる配置がここで見えます。');
  }

  byId('addZoneBtn').addEventListener('click', () => {
    const name = (byId('newZoneName').value || '').trim();
    if (!name) return;
    model.zones.push({
      name,
      capacity: Number(byId('newZoneCapacity').value || 0),
      walkway: Number(byId('newZoneWalkway').value || 0)
    });
    ['newZoneName'].forEach((id) => { byId(id).value = ''; });
    byId('newZoneCapacity').value = '8';
    byId('newZoneWalkway').value = '3';
    render();
  });
  byId('addSpaceItemBtn').addEventListener('click', () => {
    const name = (byId('newSpaceItemName').value || '').trim();
    if (!name) return;
    model.items.push({
      name,
      size: Number(byId('newSpaceItemSize').value || 0),
      zone: byId('newSpaceItemZone').value || ''
    });
    ['newSpaceItemName', 'newSpaceItemZone'].forEach((id) => { byId(id).value = ''; });
    byId('newSpaceItemSize').value = '2';
    render();
  });

  mountPresetButtons([{ label: '掃除中の部屋', action: () => { model = clone(presets['掃除中の部屋']); render(); } }]);
  state.helpers.runBriefSample = () => { model = clone(presets['掃除中の部屋']); render(); };
  render();
}

function setupFallback() {
  const root = byId('briefCanvas') || byId('app');
  if (!root) return;
  root.innerHTML = `
    <section class="brief-card">
      <div class="tool-chip">${escapeHtml(PROFILE.display_name_ja || PROFILE.title || '')}</div>
      <h2>${escapeHtml(PROFILE.input_panel_title || '入力を整える')}</h2>
      <div class="brief-form">
        <textarea id="fallbackNoteInput" class="text-input" rows="5" placeholder="${escapeHtml(PROFILE.how_it_works_line_ja || '入力の内容を整理します。')}"></textarea>
        <div class="action-row">
          <button id="fallbackPrimaryBtn" class="primary-btn">${escapeHtml(PROFILE.main_cta || 'サンプルで試す')}</button>
          <button id="fallbackAltBtn" class="secondary-btn">別の切り口を見る</button>
        </div>
      </div>
    </section>
    <section class="result-card">
      <div class="hero-head">
        <div>
          <div class="tool-chip tool-chip--soft">${escapeHtml(PROFILE.hero_panel_label || '結果の見どころ')}</div>
          <h2>${escapeHtml(PROFILE.output_label || 'ここを見ればOKです')}</h2>
          <p id="fallbackLead">${escapeHtml(PROFILE.use_case_line_ja || '変化した結果がここに出ます。')}</p>
        </div>
        <div class="hero-kpi"><span>いまの主役</span><strong id="fallbackHero">未入力</strong></div>
      </div>
      <div class="status-strip" id="fallbackStatus"></div>
      <div class="item-grid" id="fallbackCards"></div>
    </section>
  `;

  function renderFallback(inputText, mode) {
    const text = (inputText || '').trim();
    const cards = [
      { label: '要約', value: text ? `${text.slice(0, 18)}${text.length > 18 ? '…' : ''}` : 'まだ入力なし' },
      { label: '次の動き', value: mode === 'alt' ? '別の切り口で見る' : 'まず主語をそろえる' },
      { label: '見せ方', value: PROFILE.result_presentation_style || 'stacked_result_cards' }
    ];
    byId('fallbackCards').innerHTML = cards.map((card) => `
      <div class="item-card keep">
        <div class="item-title">${escapeHtml(card.label)}</div>
        <div class="subline">${escapeHtml(card.value)}</div>
      </div>
    `).join('');
    byId('fallbackStatus').innerHTML = `
      <div class="status-chip"><span>layout</span><strong>${escapeHtml(PROFILE.primary_layout || 'workbench')}</strong></div>
      <div class="status-chip"><span>model</span><strong>${escapeHtml(PROFILE.interaction_model || 'structured')}</strong></div>
      <div class="status-chip"><span>motif</span><strong>${escapeHtml(PROFILE.palette_motif || 'neutral')}</strong></div>
    `;
    byId('fallbackHero').textContent = text ? `${text.length}字` : '未入力';
    byId('fallbackLead').textContent = text ? '構造化した結果カードで見せます。' : 'サンプルを入れると、そのまま結果カードが出ます。';
  }

  byId('fallbackPrimaryBtn')?.addEventListener('click', () => {
    byId('fallbackNoteInput').value = byId('fallbackNoteInput').value || 'サンプル入力を構造化する';
    renderFallback(byId('fallbackNoteInput').value, 'primary');
  });
  byId('fallbackAltBtn')?.addEventListener('click', () => {
    byId('fallbackNoteInput').value = byId('fallbackNoteInput').value || '別の切り口も見たい';
    renderFallback(byId('fallbackNoteInput').value, 'alt');
  });
  state.helpers.runBriefSample = () => {
    byId('fallbackNoteInput').value = 'サンプル入力を構造化する';
    renderFallback(byId('fallbackNoteInput').value, 'primary');
  };
  renderFallback('', 'primary');
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeHtml(v) {
  return String(v).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function escapeAttr(v) {
  return escapeHtml(v);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
