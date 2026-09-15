/*
 * 预计返利管理原型｜交互逻辑
 *
 * 全部展示数据由 mock-data.js 派生，不在本文件写死列表内容。
 * 金额一律按「分」做整数运算，规避浮点误差（对应方案核心口径-金额精度）。
 * 筛选条件为真实筛选，作用于派生后的数据集。
 */

/* ---------------- 基础工具 ---------------- */
const D = window.rebateMockData;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cents = n => Math.round(Number(n || 0) * 100);
const yuan = c => c / 100;
const fmt = n => Number(n || 0).toFixed(2);
const sumCents = (arr, pick) => arr.reduce((s, x) => s + cents(pick(x)), 0);
const dict = (t, v) => (D.dicts[t] && D.dicts[t][v]) || v || '';
const amountOk = v => /^\d+(\.\d{1,2})?$/.test(String(v).trim());
const uniq = (arr, k) => [...new Set(arr.map(x => x[k]).filter(Boolean))].sort();

let uidSeq = 1000;
const nextUid = () => 'U' + (++uidSeq);

/* 当前角色权限（方案 3.2.1 / 3.3.1） */
const perm = () => D.roles[D.auth.role];

/* 演示模式：打开时显示角色切换与字段口径说明号，关闭后即为上线形态 */
let demoMode = true;

/* 字段口径说明，来源为方案「核心口径」与各页字段表 */
const FIELD_NOTES = {
  '合同出库金额': '数仓每日同步至项目管理平台的合同出库金额，默认为 0。预警推送要求该值大于 0。',
  '预计返利金额': '项目管理平台合同中的预计返利金额，原币种，合同行级。',
  '合同剩余返利金额': '预计返利金额 − 该合同行下有效关联金额合计，关联返利与关联到款合并计算。',
  '关联类型': '按合同行已有的有效关联展示。到款行关联金额为 0 或为空时不展示「关联到款」。',
  '已上账金额': '返利池系统中该返利ID已完成上账的金额。',
  '已关联金额': '该返利编码被全部合同有效关联的金额之和。',
  '剩余可关联金额': '已上账金额 − 已关联金额，含本合同已保存的关联。编辑已保存记录时需把本合同占用加回。',
  '本次关联金额': '必填，大于 0，最多两位小数。已保存的关联返利行不可修改。',
  '挑款金额': '到款系统中该到款ID的到款金额。同一合同多个合同行使用同一到款ID时，关联金额需合并计算。',
  '关联金额': '按到款ID替换：原记录置失效并新增一条本次金额的记录。填 0 表示取消该笔关联。',
  '关联方式': '关联返利与关联到款可在同一次保存中一并提交，不再限制同一合同只能用一种方式。',
  '是否有效': '删除、解锁、自动释放、覆盖替换后置为失效，失效记录不再占用额度。',
  '返利编码': '默认按合同行核算大类过滤剩余可关联金额大于 0 的返利；勾选按产品线查询可扩大范围。',
  '到款ID': '由到款系统的挑款关系自动带出，每个到款ID一行，用户只填关联金额。'
};

// 每个页面独立编号，进入新页面重新从 1 开始
let noteSeq = [];
const resetNotes = () => { noteSeq = []; };
const th = t => {
  const note = FIELD_NOTES[t];
  if (!note || !demoMode) return esc(t);
  let i = noteSeq.findIndex(x => x.field === t);
  if (i < 0) { noteSeq.push({ field: t, note: note }); i = noteSeq.length - 1; }
  return `${esc(t)}<span class="note-no">${i + 1}</span>`;
};
function renderLegend(el) {
  const box = $(el);
  if (!demoMode || !noteSeq.length) { box.innerHTML = ''; box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = `<div class="legend-head"><span class="note-no">#</span>字段口径说明（仅评审与开发查看，关闭演示模式后隐藏）</div>
    <ol class="legend-list">${noteSeq.map((x, i) =>
      `<li><span class="note-no">${i + 1}</span><b>${esc(x.field)}</b>${esc(x.note)}</li>`).join('')}</ol>`;
}

function toast(text, type) {
  const el = $('#toast');
  el.textContent = text;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(el._t);
  el._t = setTimeout(() => (el.className = 'toast'), 2800);
}

/* ---------------- 派生数据 ---------------- */
const validCorrs = cid => D.correlations.filter(c => c.contractId === cid && c.status === 1);

// 合同剩余返利金额 = 预计返利金额 − 有效关联合计（关联返利 + 关联到款合并）
const contractRebateCents = c => cents(c.totalRebate) - sumCents(validCorrs(c.id), x => x.theCorrelationAmount);

// 关联类型：到款行金额为 0 或空时不展示「关联到款」
function theType(c) {
  const l = validCorrs(c.id), out = [];
  if (l.some(x => x.correlationType === '关联返利')) out.push('关联返利');
  if (l.some(x => x.correlationType === '关联到款' && cents(x.theCorrelationAmount) > 0)) out.push('关联到款');
  return out.join('、');
}

// 返利底表：已关联金额 / 剩余可关联金额
function rebateStat(coding) {
  const already = sumCents(
    D.correlations.filter(c => c.status === 1 && c.correlationType === '关联返利' && c.rebateCoding === coding),
    c => c.theCorrelationAmount);
  const base = D.rebateBase.find(b => b.rebateCoding === coding) || { alreadyBillAmount: 0 };
  return { already: already, residue: cents(base.alreadyBillAmount) - already };
}

const pendingContracts = () => D.contracts.filter(c => !c.terminated && contractRebateCents(c) > 0);
const linkedContracts = () => D.contracts.filter(c => !c.terminated && contractRebateCents(c) === 0);
const contractById = id => D.contracts.find(c => c.id === id);

/* ---------------- 筛选 ---------------- */
const like = (v, q) => !q || String(v == null ? '' : v).toLowerCase().includes(String(q).toLowerCase());
const eqv = (v, q) => !q || String(v) === String(q);
const inRange = (v, a, b) => (!a || String(v) >= a) && (!b || String(v) <= b);

const FILTERS = {
  pending: [
    { key: 'applyDate', label: '申请日期', type: 'daterange' },
    { key: 'contractNo', label: '合同号', type: 'text', ph: '请输入合同号' },
    { key: 'customer', label: '客户名称', type: 'text', ph: '请输入客户名称' },
    { key: 'estimatedRebateTime', label: '预计返利时间', type: 'daterange' },
    { key: 'accountCate', label: '核算大类', type: 'select', ph: '请选择核算大类', opts: () => uniq(D.contracts, 'accountCate') },
    { key: 'businessDivision', label: '事业部', type: 'select', ph: '请选择事业部', opts: () => uniq(D.contracts, 'businessDivision') },
    { key: 'salerName', label: '销售员', type: 'select', ph: '请选择销售员', opts: () => uniq(D.contracts, 'salerName') },
    { key: 'outboundAmount', label: '合同出库金额', type: 'select', ph: '请选择', opts: () => [['1', '大于0'], ['0', '等于0']] }
  ],
  linked: [
    { key: 'applyDate', label: '申请日期', type: 'daterange' },
    { key: 'contractNo', label: '合同号', type: 'text', ph: '请输入合同号' },
    { key: 'customer', label: '客户名称', type: 'text', ph: '请输入客户名称' },
    { key: 'accountCate', label: '核算大类', type: 'select', ph: '请选择核算大类', opts: () => uniq(D.contracts, 'accountCate') },
    { key: 'businessDivision', label: '事业部', type: 'select', ph: '请选择事业部', opts: () => uniq(D.contracts, 'businessDivision') },
    { key: 'salerName', label: '销售员', type: 'select', ph: '请选择销售员', opts: () => uniq(D.contracts, 'salerName') }
  ],
  details: [
    { key: 'correlationDate', label: '关联日期', type: 'daterange' },
    { key: 'contractNo', label: '合同号', type: 'text', ph: '请输入合同号' },
    { key: 'customer', label: '客户名称', type: 'text', ph: '请输入客户名称' },
    { key: 'accountCate', label: '核算大类', type: 'select', ph: '请选择核算大类', opts: () => uniq(D.contracts, 'accountCate') },
    { key: 'rebateCoding', label: '返利编码', type: 'text', ph: '请输入返利编码' }
  ],
  base: [
    { key: 'accountCate', label: '核算大类', type: 'select', ph: '请选择核算大类', opts: () => uniq(D.rebateBase, 'accountCate') },
    { key: 'rebateCoding', label: '返利编码', type: 'text', ph: '请输入返利编码' },
    { key: 'rebateName', label: '返利名称', type: 'text', ph: '请输入返利名称' },
    { key: 'generateDate', label: '生成日期', type: 'daterange' }
  ]
};

const filterState = { pending: {}, linked: {}, details: {}, base: {} };
const pageState = { pending: { page: 1, size: 10 }, linked: { page: 1, size: 10 }, details: { page: 1, size: 10 }, base: { page: 1, size: 10 } };

function matchContract(c, f) {
  return like(c.contractNo, f.contractNo) && like(c.customer, f.customer)
    && eqv(c.accountCate, f.accountCate) && eqv(c.businessDivision, f.businessDivision)
    && eqv(c.salerName, f.salerName)
    && inRange(c.applyDate, f.applyDate_start, f.applyDate_end)
    && inRange(c.estimatedRebateTime, f.estimatedRebateTime_start, f.estimatedRebateTime_end)
    && (f.outboundAmount === undefined || f.outboundAmount === ''
      || (f.outboundAmount === '1' ? cents(c.outboundAmount) > 0 : cents(c.outboundAmount) === 0));
}

/* ---------------- 列表页配置 ---------------- */
const PAGES = {
  pending: {
    title: '待关联返利列表',
    actions: () => perm().canEdit ? ['导出待关联模板', '批量导入', '导出查询结果', '查询', '重置'] : ['导出查询结果', '查询', '重置'],
    columns: ['', '序号', '申请日期', '合同号', '事业部', '客户名称', '销售员', '审批类型', '合同金额', '合同出库金额',
      '产品线名称', '核算大类', '预计返利金额', '合同剩余返利金额', '币种', '预计返利时间', '关联类型', '操作'],
    rows: f => pendingContracts().filter(c => matchContract(c, f)).map((c, i) => ({
      key: c.id,
      cells: ['<input type="checkbox" class="row-check">', i + 1, c.applyDate, c.contractNo, c.businessDivision,
        c.customer, c.salerName, c.prevIdStr, fmt(c.contractAmount), fmt(c.outboundAmount), c.productLine,
        c.accountCate, fmt(c.totalRebate), fmt(yuan(contractRebateCents(c))), dict('cmn_currency_code', c.currency),
        c.estimatedRebateTime, theType(c) || '—'],
      ops: perm().canEdit ? [['查看详情', 'view'], ['编辑', 'edit']] : [['查看详情', 'view']]
    }))
  },

  linked: {
    title: '已关联返利列表',
    actions: () => ['导出查询结果', '查询', '重置'],
    columns: ['序号', '申请日期', '合同号', '事业部', '客户名称', '销售员', '审批类型', '合同金额', '合同出库金额',
      '产品线名称', '核算大类', '预计返利金额', '币种', '预计返利时间', '关联类型', '操作'],
    rows: f => linkedContracts().filter(c => matchContract(c, f)).map((c, i) => ({
      key: c.id,
      cells: [i + 1, c.applyDate, c.contractNo, c.businessDivision, c.customer, c.salerName, c.prevIdStr,
        fmt(c.contractAmount), fmt(c.outboundAmount), c.productLine, c.accountCate, fmt(c.totalRebate),
        dict('cmn_currency_code', c.currency), c.estimatedRebateTime, theType(c) || '—'],
      ops: perm().canUnlock ? [['查看详情', 'view'], ['编辑', 'unlock']] : [['查看详情', 'view']]
    }))
  },

  details: {
    title: '已关联返利明细列表',
    actions: () => ['导出查询结果', '查询', '重置'],
    columns: ['序号', '关联日期', '合同号', '合同出库金额', '事业部', '客户名称', '产品线名称', '核算大类', '币种',
      '预计返利金额', '关联类型', '关联返利编码', '返利名称', '已上账金额', '剩余可关联金额', '到款ID', '挑款金额', '关联金额'],
    rows: f => D.correlations.filter(r => r.status === 1).map(r => ({ r: r, c: contractById(r.contractId) || {} }))
      .filter(x => !x.c.terminated)
      .filter(x => like(x.c.contractNo, f.contractNo) && like(x.c.customer, f.customer)
        && eqv(x.c.accountCate, f.accountCate) && like(x.r.rebateCoding, f.rebateCoding)
        && inRange(x.r.correlationDate, f.correlationDate_start, f.correlationDate_end))
      .map((x, i) => {
        const r = x.r, c = x.c, isFl = r.correlationType === '关联返利';
        const st = isFl ? rebateStat(r.rebateCoding) : null;
        return {
          key: r.id,
          cells: [i + 1, r.correlationDate, c.contractNo, fmt(c.outboundAmount), c.businessDivision, c.customer,
            c.productLine, c.accountCate, dict('cmn_currency_code', c.currency), fmt(c.totalRebate), r.correlationType,
            isFl ? r.rebateCoding : '—', isFl ? r.rebateName : '—', isFl ? fmt(r.alreadyBillAmount) : '—',
            isFl ? fmt(yuan(st.residue)) : '—', isFl ? '—' : r.daokuanId, isFl ? '—' : fmt(r.pickedAmount),
            fmt(r.theCorrelationAmount)],
          ops: null
        };
      })
  },

  base: {
    title: '返利底表数据列表',
    actions: () => ['导出查询结果', '查询', '重置'],
    columns: ['序号', '生成日期', '产品线名称', '核算大类', '返利编码', '返利名称', '返利池现金池对应编号',
      '返利池金额', '现金池金额', '已上账金额', '已关联金额', '剩余可关联金额'],
    rows: f => D.rebateBase
      .filter(b => eqv(b.accountCate, f.accountCate) && like(b.rebateCoding, f.rebateCoding)
        && like(b.rebateName, f.rebateName) && inRange(b.generateDate, f.generateDate_start, f.generateDate_end))
      .map((b, i) => {
        const st = rebateStat(b.rebateCoding);
        return {
          key: b.rebateCoding,
          cells: [i + 1, b.generateDate, b.productLine, b.accountCate, b.rebateCoding, b.rebateName,
            b.rebateCashPoolNumber, fmt(b.rebatePoolAmount), fmt(b.cashPoolAmount), fmt(b.alreadyBillAmount),
            fmt(yuan(st.already)), fmt(yuan(st.residue))],
          ops: null
        };
      })
  }
};

/* ---------------- 列表渲染 ---------------- */
let currentPage = 'pending';

function filterHtml(page) {
  const f = filterState[page];
  return `<div class="filter-grid">${FILTERS[page].map(x => {
    if (x.type === 'daterange') {
      return `<div class="field"><label>${x.label}</label><div class="date-range">
        <input type="date" data-fk="${x.key}_start" value="${esc(f[x.key + '_start'] || '')}">
        <span>至</span>
        <input type="date" data-fk="${x.key}_end" value="${esc(f[x.key + '_end'] || '')}"></div></div>`;
    }
    if (x.type === 'select') {
      const opts = x.opts().map(o => Array.isArray(o) ? o : [o, o]);
      return `<div class="field"><label>${x.label}</label><select data-fk="${x.key}">
        <option value="">${x.ph}</option>
        ${opts.map(o => `<option value="${esc(o[0])}" ${String(f[x.key]) === String(o[0]) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}
      </select></div>`;
    }
    return `<div class="field"><label>${x.label}</label><input data-fk="${x.key}" placeholder="${x.ph || ''}" value="${esc(f[x.key] || '')}"></div>`;
  }).join('')}</div>`;
}

function renderList() {
  $('#view-list').hidden = false;
  $('#view-detail').hidden = true;
  const p = PAGES[currentPage];
  $('#crumb-current').textContent = document.querySelector(`[data-page="${currentPage}"]`).textContent;
  $('#table-title').textContent = p.title;

  $('#filters').innerHTML = filterHtml(currentPage) +
    `<div class="actions">${p.actions().map(a => `<button class="btn ${a === '重置' ? '' : 'primary'}" data-action="${a}">${a}</button>`).join('')}</div>`;

  const all = p.rows(filterState[currentPage]);
  const ps = pageState[currentPage];
  const pages = Math.max(1, Math.ceil(all.length / ps.size));
  if (ps.page > pages) ps.page = pages;
  const rows = all.slice((ps.page - 1) * ps.size, ps.page * ps.size);

  resetNotes();
  $('#thead').innerHTML = `<tr>${p.columns.map(c => `<th>${th(c)}</th>`).join('')}</tr>`;
  $('#tbody').innerHTML = rows.length
    ? rows.map(r => `<tr data-key="${r.key}">${r.cells.map(v => `<td title="${esc(v)}">${String(v).startsWith('<input') ? v : esc(v)}</td>`).join('')}${
        r.ops ? `<td>${r.ops.map(o => `<button class="link" data-op="${o[1]}" data-key="${r.key}">${o[0]}</button>`).join(' ')}</td>` : ''}</tr>`).join('')
    : `<tr><td class="empty" colspan="${p.columns.length}">暂无数据</td></tr>`;
  renderLegend('#note-legend');
  renderPager(all.length, pages, ps);
}

// 真实分页器
function renderPager(total, pages, ps) {
  const nums = [];
  for (let n = 1; n <= pages; n++) {
    if (pages <= 7 || n === 1 || n === pages || Math.abs(n - ps.page) <= 1) nums.push(n);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  $('.pager').innerHTML = `<span id="total">共 ${total} 条</span>
    <select id="page-size">${[10, 20, 50].map(n => `<option value="${n}" ${n === ps.size ? 'selected' : ''}>${n}条/页</option>`).join('')}</select>
    <button data-page-to="${ps.page - 1}" ${ps.page === 1 ? 'disabled' : ''}>‹</button>
    ${nums.map(n => n === '…' ? '<button disabled>…</button>'
      : `<button class="${n === ps.page ? 'page-on' : ''}" data-page-to="${n}">${n}</button>`).join('')}
    <button data-page-to="${ps.page + 1}" ${ps.page === pages ? 'disabled' : ''}>›</button>
    <span>前往</span><input id="page-jump" value="${ps.page}"><span>页</span>`;
}

function collectFilters() {
  const f = {};
  $$('#filters [data-fk]').forEach(el => { if (el.value !== '') f[el.dataset.fk] = el.value; });
  filterState[currentPage] = f;
}

/* ---------------- 编辑 / 详情整页 ---------------- */
let ctx = null;

function buildEditRows(contract) {
  const rows = [];
  validCorrs(contract.id).filter(c => c.correlationType === '关联返利').forEach(c => {
    rows.push({
      uid: nextUid(), id: c.id, saved: true, correlationType: '关联返利', rebateCoding: c.rebateCoding,
      rebateName: c.rebateName, alreadyBillAmount: c.alreadyBillAmount, theCorrelationAmount: fmt(c.theCorrelationAmount)
    });
  });
  D.daokuanPicks.filter(p => p.contractNo === contract.contractNo).forEach(p => {
    const saved = validCorrs(contract.id).find(c => c.correlationType === '关联到款' && c.daokuanId === p.daokuanId);
    rows.push({
      uid: nextUid(), id: saved ? saved.id : '', saved: !!saved, correlationType: '关联到款',
      daokuanId: p.daokuanId, pickedAmount: p.pickedAmount,
      theCorrelationAmount: saved ? fmt(saved.theCorrelationAmount) : '0.00'
    });
  });
  return rows;
}

function openDetail(contractId, mode) {
  const contract = contractById(contractId);
  ctx = { contract: contract, mode: mode, filterType: '关联返利', statusFilter: '1' };
  if (mode === 'edit') ctx.rows = buildEditRows(contract);
  renderDetail();
}

const liveRemainCents = () => cents(ctx.contract.totalRebate) - sumCents(ctx.rows, r => r.theCorrelationAmount);

// 合同公共列，与线上编辑页保持一致（含横向滚动）
function commonCols(isEdit) {
  const base = ['序号', '申请日期', '合同号', '事业部', '客户名称', '销售员', '审批类型', '合同金额', '合同出库金额',
    '产品线名称', '核算大类', '预计返利金额'];
  if (isEdit) base.push('合同剩余返利金额');
  return base.concat(['币种', '预计返利时间', '关联方式']);
}
function commonCells(idx, isEdit, type) {
  const c = ctx.contract;
  const out = [idx, c.applyDate, c.contractNo, c.businessDivision, c.customer, c.salerName, c.prevIdStr,
    fmt(c.contractAmount), fmt(c.outboundAmount), c.productLine, c.accountCate, fmt(c.totalRebate)];
  if (isEdit) out.push(fmt(yuan(liveRemainCents())));
  return out.concat([dict('cmn_currency_code', c.currency), c.estimatedRebateTime, type]);
}

function renderDetail() {
  $('#view-list').hidden = true;
  $('#view-detail').hidden = false;
  const isEdit = ctx.mode === 'edit', isUnlock = ctx.mode === 'unlock';

  $('#crumb-current').textContent = isEdit ? '待关联返利详情列表（编辑）' : isUnlock ? '已关联返利详情列表（解锁）' : '待关联返利详情列表（详情）';
  $('#detail-title').textContent = $('#crumb-current').textContent;

  $('#detail-head-right').innerHTML = (!isEdit && !isUnlock)
    ? `<select id="status-filter">
         <option value="1">有效</option><option value="0">失效</option><option value="">全部</option></select>` : '';
  if ($('#status-filter')) $('#status-filter').value = ctx.statusFilter;

  $('#type-switch').innerHTML = isEdit
    ? `<div class="label">关联方式</div><div class="value"><select id="type-select">
         <option value="关联返利">关联返利</option><option value="关联到款">关联到款</option></select></div>
       <div class="msg">ⓘ 此处可切换关联方式，两种方式可在同一次保存中一并提交</div>` : '';
  if ($('#type-select')) $('#type-select').value = ctx.filterType;

  resetNotes();
  isEdit ? renderEditTable() : isUnlock ? renderUnlockTable() : renderViewTable();
  renderLegend('#detail-note-legend');

  $('#detail-toolbar').innerHTML = (isEdit && ctx.filterType === '关联返利')
    ? `<button class="btn primary" data-act="add-row">增加一行</button>
       <button class="btn danger" data-act="del-row">删除所选</button>` : '';

  $('#detail-footer').innerHTML = `<button class="btn" data-act="exit">退出</button>`
    + (isEdit ? `<button class="btn primary" data-act="save">保存</button>` : '')
    + (isUnlock ? `<button class="btn primary" data-act="save-unlock">保存</button>` : '');
}

function renderEditTable() {
  const isFl = ctx.filterType === '关联返利';
  const rows = ctx.rows.filter(r => r.correlationType === ctx.filterType);
  const cols = [isFl ? '<input type="checkbox" class="check-all">' : '', ...commonCols(true), ...(isFl
    ? ['返利编码', '返利名称', '已上账金额', '剩余可关联金额', '本次关联金额']
    : ['到款ID', '挑款金额', '关联金额'])];
  $('#detail-thead').innerHTML = `<tr>${cols.map(c => `<th>${c.startsWith('<input') ? c : th(c)}</th>`).join('')}</tr>`;

  if (!rows.length) {
    $('#detail-tbody').innerHTML = `<tr><td class="empty" colspan="${cols.length}">${
      isFl ? '暂无关联返利数据，请点击左下方「增加一行」新增' : '该合同在到款系统中暂无挑款记录'}</td></tr>`;
    return;
  }

  $('#detail-tbody').innerHTML = rows.map((r, i) => {
    const head = `<td>${isFl ? `<input type="checkbox" class="row-check" data-uid="${r.uid}">` : ''}</td>`;
    const common = commonCells(i + 1, true, r.correlationType).map(v => `<td title="${esc(v)}">${esc(v)}</td>`).join('');
    if (isFl) {
      const st = r.rebateCoding ? rebateStat(r.rebateCoding) : null;
      return `<tr data-uid="${r.uid}">${head}${common}
        <td>${r.saved ? esc(r.rebateCoding) : `<button class="link" data-act="pick-rebate" data-uid="${r.uid}">${r.rebateCoding ? esc(r.rebateCoding) : '选择返利'}</button>`}</td>
        <td title="${esc(r.rebateName)}">${esc(r.rebateName || '')}</td>
        <td>${r.alreadyBillAmount ? fmt(r.alreadyBillAmount) : ''}</td>
        <td>${st ? fmt(yuan(st.residue)) : '—'}</td>
        <td>${r.saved ? fmt(r.theCorrelationAmount)
          : `<input class="amount-input" data-uid="${r.uid}" value="${esc(r.theCorrelationAmount)}">`}</td></tr>`;
    }
    return `<tr data-uid="${r.uid}">${head}${common}
      <td>${esc(r.daokuanId)}</td><td>${fmt(r.pickedAmount)}</td>
      <td><input class="amount-input" data-uid="${r.uid}" value="${esc(r.theCorrelationAmount)}"></td></tr>`;
  }).join('');
}

function renderViewTable() {
  const cols = [...commonCols(false), '关联日期', '返利编码', '返利名称', '已上账金额', '剩余可关联金额',
    '到款ID', '挑款金额', '关联金额', '是否解锁', '解锁原因', '是否有效'];
  let list = D.correlations.filter(r => r.contractId === ctx.contract.id);
  if (ctx.statusFilter !== '') list = list.filter(r => r.status === Number(ctx.statusFilter));
  $('#detail-thead').innerHTML = `<tr>${cols.map(c => `<th>${c.startsWith('<input') ? c : th(c)}</th>`).join('')}</tr>`;
  $('#detail-tbody').innerHTML = list.length ? list.map((r, i) => {
    const isFl = r.correlationType === '关联返利';
    const st = isFl ? rebateStat(r.rebateCoding) : null;
    const common = commonCells(i + 1, false, r.correlationType).map(v => `<td title="${esc(v)}">${esc(v)}</td>`).join('');
    return `<tr>${common}<td>${esc(r.correlationDate)}</td>
      <td>${isFl ? esc(r.rebateCoding) : '—'}</td><td title="${esc(r.rebateName)}">${isFl ? esc(r.rebateName) : '—'}</td>
      <td>${isFl ? fmt(r.alreadyBillAmount) : '—'}</td><td>${isFl ? fmt(yuan(st.residue)) : '—'}</td>
      <td>${isFl ? '—' : esc(r.daokuanId)}</td><td>${isFl ? '—' : fmt(r.pickedAmount)}</td>
      <td>${fmt(r.theCorrelationAmount)}</td><td>${esc(r.whetherUnlock)}</td>
      <td>${esc(r.unlockReason || '—')}</td><td>${r.status === 1 ? '有效' : '失效'}</td></tr>`;
  }).join('') : `<tr><td class="empty" colspan="${cols.length}">暂无数据</td></tr>`;
}

function renderUnlockTable() {
  const cols = [...commonCols(false), '返利编码', '到款ID', '挑款金额', '关联金额', '是否解锁', '解锁原因'];
  const list = validCorrs(ctx.contract.id);
  $('#detail-thead').innerHTML = `<tr>${cols.map(c => `<th>${c.startsWith('<input') ? c : th(c)}</th>`).join('')}</tr>`;
  $('#detail-tbody').innerHTML = list.map((r, i) => {
    const isFl = r.correlationType === '关联返利';
    const common = commonCells(i + 1, false, r.correlationType).map(v => `<td title="${esc(v)}">${esc(v)}</td>`).join('');
    return `<tr>${common}
      <td>${isFl ? esc(r.rebateCoding) : '—'}</td><td>${isFl ? '—' : esc(r.daokuanId)}</td>
      <td>${isFl ? '—' : fmt(r.pickedAmount)}</td><td>${fmt(r.theCorrelationAmount)}</td>
      <td><select class="unlock-flag" data-id="${r.id}"><option value="否">否</option><option value="是">是</option></select></td>
      <td><input class="reason-input" data-id="${r.id}" placeholder="选择解锁时必填"></td></tr>`;
  }).join('');
}

/* ---------------- 返利选择弹框 ---------------- */
let dlg = { uid: null, query: {}, byProductLine: false, picked: new Set(), page: 1, pageSize: 10 };

function openRebateDialog(uid) {
  dlg = { uid: uid, query: { rebateCoding: '', rebateName: '', min: '', max: '' }, byProductLine: false, picked: new Set(), page: 1, pageSize: 10 };
  renderRebateDialog();
  showModal('请选择返利信息进行关联', [['取消', 'modal-cancel'], ['确定', 'dlg-confirm']]);
}

function rebateCandidates() {
  const c = ctx.contract;
  return D.rebateBase.filter(b => {
    const st = rebateStat(b.rebateCoding);
    if (st.residue <= 0) return false;
    if (dlg.byProductLine) { if (b.productLine !== c.productLine) return false; }
    else if (b.accountCate !== c.accountCate) return false;
    if (!like(b.rebateCoding, dlg.query.rebateCoding)) return false;
    if (!like(b.rebateName, dlg.query.rebateName)) return false;
    if (dlg.query.min !== '' && st.residue < cents(dlg.query.min)) return false;
    if (dlg.query.max !== '' && st.residue > cents(dlg.query.max)) return false;
    return true;
  });
}

function renderRebateDialog() {
  const all = rebateCandidates();
  const pages = Math.max(1, Math.ceil(all.length / dlg.pageSize));
  if (dlg.page > pages) dlg.page = pages;
  const list = all.slice((dlg.page - 1) * dlg.pageSize, dlg.page * dlg.pageSize);
  const allChecked = list.length && list.every(b => dlg.picked.has(b.rebateCoding));

  $('#modal-body').innerHTML = `
    <div class="dlg-filters">
      <div class="field"><label>返利编码</label><input id="q-coding" value="${esc(dlg.query.rebateCoding)}"></div>
      <div class="field"><label>返利名称</label><input id="q-name" value="${esc(dlg.query.rebateName)}"></div>
      <div class="field range"><label>剩余可关联金额:</label>
        <input id="q-min" placeholder="请输入最小金额" value="${esc(dlg.query.min)}"><span class="sep">-</span>
        <input id="q-max" placeholder="请输入最大金额" value="${esc(dlg.query.max)}"></div>
      <div class="field ck-line">
        <label class="ckbox ${dlg.byProductLine ? 'on' : ''}"><input type="checkbox" id="q-line" ${dlg.byProductLine ? 'checked' : ''}> 按产品线查询</label>
        <button class="btn primary" data-act="dlg-query">查询</button></div>
    </div>
    <div class="table-wrap dlg-table"><table>
      <thead><tr><th><input type="checkbox" class="dlg-check-all" ${allChecked ? 'checked' : ''}></th>
        <th>产品线名称</th><th>核算大类</th><th>${th('返利编码')}</th><th>返利名称</th><th>${th('已上账金额')}</th><th>${th('剩余可关联金额')}</th></tr></thead>
      <tbody>${list.length ? list.map(b => {
        const st = rebateStat(b.rebateCoding);
        return `<tr><td><input type="checkbox" class="dlg-check" data-coding="${b.rebateCoding}" ${dlg.picked.has(b.rebateCoding) ? 'checked' : ''}></td>
          <td>${esc(b.productLine)}</td><td>${esc(b.accountCate)}</td><td>${esc(b.rebateCoding)}</td>
          <td title="${esc(b.rebateName)}">${esc(b.rebateName)}</td><td>${fmt(b.alreadyBillAmount)}</td><td>${fmt(yuan(st.residue))}</td></tr>`;
      }).join('') : '<tr><td class="empty" colspan="7">暂无数据</td></tr>'}</tbody>
    </table></div>
    <div class="pager dlg-pager">
      <span>共 ${all.length} 条</span>
      <select><option>10条/页</option><option>20条/页</option></select>
      <button data-act="dlg-page" data-p="${dlg.page - 1}" ${dlg.page === 1 ? 'disabled' : ''}>‹</button>
      ${Array.from({ length: pages }, (_, i) => i + 1).map(n =>
        `<button class="${n === dlg.page ? 'page-on' : ''}" data-act="dlg-page" data-p="${n}">${n}</button>`).join('')}
      <button data-act="dlg-page" data-p="${dlg.page + 1}" ${dlg.page === pages ? 'disabled' : ''}>›</button>
      <span>前往</span><input value="${dlg.page}" readonly><span>页</span>
    </div>
    <div class="dlg-tip">默认按合同行核算大类「${esc(ctx.contract.accountCate)}」过滤；勾选「按产品线查询」后改按产品线「${esc(ctx.contract.productLine)}」查询，范围更大。已选 ${dlg.picked.size} 条。</div>`;
}

// 勾选变化后只同步全选状态与已选计数
function syncDlgSelection() {
  const boxes = $$('#modal-body .dlg-check');
  const all = $('#modal-body .dlg-check-all');
  if (all) all.checked = boxes.length > 0 && boxes.every(x => x.checked);
  const tip = $('#modal-body .dlg-tip');
  if (tip) tip.textContent = tip.textContent.replace(/已选 \d+ 条。$/, `已选 ${dlg.picked.size} 条。`);
}

function showModal(title, actions) {
  $('#modal-title').textContent = title;
  $('#modal-actions').innerHTML = actions.map(a =>
    `<button class="btn ${a[1] === 'modal-cancel' ? '' : 'primary'}" data-act="${a[1]}">${a[0]}</button>`).join('');
  $('#modal').classList.add('open');
  $('#modal').setAttribute('aria-hidden', 'false');
}
function closeModal() {
  $('#modal').classList.remove('open');
  $('#modal').setAttribute('aria-hidden', 'true');
}

/* ---------------- 保存校验（方案 3.2.4.5） ---------------- */
function validateSave() {
  const fl = ctx.rows.filter(r => r.correlationType === '关联返利');
  const dk = ctx.rows.filter(r => r.correlationType === '关联到款');

  for (let i = 0; i < fl.length; i++) {
    const r = fl[i];
    if (r.saved) continue;                                   // 已保存行不可修改，不参与校验
    if (!r.rebateCoding) return `关联返利：第${i + 1}行请先选择返利信息`;
    if (!amountOk(r.theCorrelationAmount) || cents(r.theCorrelationAmount) <= 0)
      return `关联返利：第${i + 1}行本次关联金额必须大于 0，且最多两位小数`;
  }
  for (let i = 0; i < dk.length; i++) {
    if (!amountOk(dk[i].theCorrelationAmount)) return `关联到款：第${i + 1}行关联金额格式不正确，最多两位小数`;
  }
  const seen = new Set();
  for (const r of dk) {
    if (seen.has(r.daokuanId)) return `同一合同、核算大类、币种下到款ID重复：${r.daokuanId}`;
    seen.add(r.daokuanId);
  }
  const byCoding = {};
  fl.filter(r => !r.saved && r.rebateCoding).forEach(r => {
    byCoding[r.rebateCoding] = (byCoding[r.rebateCoding] || 0) + cents(r.theCorrelationAmount);
  });
  for (const k in byCoding) {
    const st = rebateStat(k);
    if (byCoding[k] > st.residue)
      return `返利编码 ${k} 本次关联金额合计 ${fmt(yuan(byCoding[k]))}，大于剩余可关联金额 ${fmt(yuan(st.residue))}`;
  }
  const dkTotal = {};
  dk.forEach(r => { dkTotal[r.daokuanId] = (dkTotal[r.daokuanId] || 0) + cents(r.theCorrelationAmount); });
  D.correlations.filter(x => x.status === 1 && x.correlationType === '关联到款' && x.contractId !== ctx.contract.id)
    .forEach(x => {
      const other = contractById(x.contractId);
      if (other && other.contractNo === ctx.contract.contractNo && dkTotal[x.daokuanId] !== undefined)
        dkTotal[x.daokuanId] += cents(x.theCorrelationAmount);
    });
  for (const id in dkTotal) {
    const pick = D.daokuanPicks.find(p => p.contractNo === ctx.contract.contractNo && p.daokuanId === id);
    if (pick && dkTotal[id] > cents(pick.pickedAmount))
      return `到款ID ${id} 在本合同下关联金额合计 ${fmt(yuan(dkTotal[id]))}，大于挑款金额 ${fmt(pick.pickedAmount)}`;
  }
  const all = sumCents(ctx.rows, r => r.theCorrelationAmount);
  if (all > cents(ctx.contract.totalRebate))
    return `关联返利与关联到款合计 ${fmt(yuan(all))}，大于预计返利金额 ${fmt(ctx.contract.totalRebate)}`;
  return null;
}

function doSave() {
  const err = validateSave();
  if (err) { toast(err, 'error'); return; }
  const today = new Date().toISOString().slice(0, 10);
  ctx.rows.filter(r => r.correlationType === '关联返利' && !r.saved && r.rebateCoding).forEach(r => {
    D.correlations.push({
      id: 'R' + nextUid(), contractId: ctx.contract.id, correlationType: '关联返利', correlationDate: today,
      rebateCoding: r.rebateCoding, rebateName: r.rebateName, alreadyBillAmount: r.alreadyBillAmount,
      theCorrelationAmount: Number(r.theCorrelationAmount), status: 1, whetherUnlock: '否', unlockReason: ''
    });
  });
  ctx.rows.filter(r => r.correlationType === '关联到款').forEach(r => {
    const old = validCorrs(ctx.contract.id).find(c => c.correlationType === '关联到款' && c.daokuanId === r.daokuanId);
    const v = cents(r.theCorrelationAmount);
    if (old && cents(old.theCorrelationAmount) === v) return;
    if (old) { old.status = 0; old.unlockReason = '到款关联金额调整'; }
    if (v > 0) {
      D.correlations.push({
        id: 'R' + nextUid(), contractId: ctx.contract.id, correlationType: '关联到款', correlationDate: today,
        daokuanId: r.daokuanId, pickedAmount: r.pickedAmount, theCorrelationAmount: yuan(v),
        status: 1, whetherUnlock: '否', unlockReason: ''
      });
    }
  });
  const remain = contractRebateCents(ctx.contract);
  toast(remain === 0 ? '保存成功，合同剩余返利金额为 0，已移入已关联返利合同'
    : `保存成功，合同剩余返利金额 ${fmt(yuan(remain))}，仍停留在待关联`);
  backToList();
}

function doSaveUnlock() {
  const picked = $$('.unlock-flag').filter(f => f.value === '是');
  if (!picked.length) { toast('请至少选择一条需要解锁的记录', 'error'); return; }
  for (const f of picked) {
    if (!$(`.reason-input[data-id="${f.dataset.id}"]`).value.trim()) {
      toast('选择解锁的记录必须填写解锁原因', 'error'); return;
    }
  }
  picked.forEach(f => {
    const rec = D.correlations.find(r => r.id === f.dataset.id);
    rec.status = 0;
    rec.whetherUnlock = '是';
    rec.unlockReason = $(`.reason-input[data-id="${f.dataset.id}"]`).value.trim();
    if (rec.correlationType === '关联到款' && cents(rec.pickedAmount) > 0) {
      D.correlations.push({
        id: 'R' + nextUid(), contractId: rec.contractId, correlationType: '关联到款',
        correlationDate: new Date().toISOString().slice(0, 10), daokuanId: rec.daokuanId,
        pickedAmount: rec.pickedAmount, theCorrelationAmount: 0, status: 1, whetherUnlock: '否', unlockReason: ''
      });
    }
  });
  toast(`已解锁 ${picked.length} 条记录，金额已释放，合同回到待关联列表，释放通知邮件已发送（原型演示）`);
  backToList();
}

function backToList() { ctx = null; renderList(); }

/* ---------------- 导出待关联模板 ---------------- */
const TEMPLATE_FIELDS = [
  ['合同号', '是', '列表导出，不可修改'],
  ['关联方式', '是', '下拉框：关联返利、关联到款'],
  ['返利编码', '条件必填', '关联方式为「关联返利」时必填'],
  ['关联到款ID', '条件必填', '关联方式为「关联到款」时必填'],
  ['本次关联金额', '是', '不允许负数，最多两位小数'],
  ['核算大类', '是', '列表导出，不可修改'],
  ['币种', '是', '列表导出，不可修改'],
  ['其他参考字段', '否', '申请日期、事业部、客户名称、销售员、审批类型、合同金额、出库金额、产品线名称、预计返利金额、合同剩余返利金额，仅供填写时参考']
];

function openTemplateModal(n) {
  $('#modal-body').innerHTML = `
    <div class="import-box">
      <p class="import-file">已按当前勾选的 <b>${n}</b> 条待关联合同生成模板（原型演示，不产生真实文件）。</p>
      <div class="import-tip">
        <b>模板首行说明</b>
        <ol>
          <li>关联返利：新增返利关联记录。</li>
          <li>关联到款：按「到款ID」逐条替换，Excel 中出现的到款ID以本次金额覆盖原记录，未出现的到款ID保持不变；如需取消某笔到款关联，填写金额 0。</li>
        </ol>
      </div>
      <div class="table-wrap dlg-table"><table>
        <thead><tr><th>模板字段</th><th>是否必填</th><th>填写说明</th></tr></thead>
        <tbody>${TEMPLATE_FIELDS.map(f =>
          `<tr><td>${esc(f[0])}</td><td>${f[1] === '是' ? '<b class="req">是</b>' : esc(f[1])}</td><td>${esc(f[2])}</td></tr>`).join('')}</tbody>
      </table></div>
    </div>`;
  showModal('待关联模板字段', [['关闭', 'modal-cancel']]);
}

/* ---------------- 批量导入：真实执行校验 ---------------- */
// 内置示例数据维护在 mock-data.js 的 importSamples 中
const IMPORT_SAMPLES = D.importSamples;

let importPick = 'ok';
let importFileName = '';

function openImportModal(fileName) {
  renderImportModal(fileName, null);
  showModal('批量导入', [['取消', 'modal-cancel'], ['开始导入', 'import-run']]);
}

function renderImportModal(fileName, result) {
  const sample = IMPORT_SAMPLES[importPick];
  $('#modal-body').innerHTML = `
    <div class="import-box">
      <p class="import-file">已选择文件：<b>${esc(fileName)}</b>　
        <span class="muted">原型不解析真实文件内容，请选择一份内置示例数据代替。</span></p>
      <div class="sample-pick">
        ${Object.entries(IMPORT_SAMPLES).map(([k, v]) =>
          `<label class="ckbox ${k === importPick ? 'on' : ''}">
             <input type="radio" name="sample" value="${k}" ${k === importPick ? 'checked' : ''}> ${esc(v.label)}</label>`).join('')}
      </div>
      <p class="sample-desc">${esc(sample.desc)}</p>
      <div class="table-wrap dlg-table"><table>
        <thead><tr><th>行号</th><th>合同号</th><th>关联方式</th><th>返利编码</th><th>关联到款ID</th><th>本次关联金额</th><th>核算大类</th><th>币种</th></tr></thead>
        <tbody>${sample.rows.map((r, i) =>
          `<tr><td>${i + 2}</td><td>${esc(r.contractNo)}</td><td>${esc(r.type)}</td><td>${esc(r.rebateCoding) || '—'}</td>
           <td>${esc(r.daokuanId) || '—'}</td><td>${esc(r.amount)}</td><td>${esc(r.accountCate)}</td><td>${esc(r.currency)}</td></tr>`).join('')}</tbody>
      </table></div>
      ${result ? (result.errors.length
        ? `<div class="import-error"><b>导入失败，整批回滚，以下 ${result.errors.length} 处需修改</b><ul>${result.errors.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`
        : `<div class="import-ok"><b>导入成功</b><ul>${result.logs.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`) : ''}
    </div>`;
}

// 校验口径与编辑页保存一致：逐行校验通过后，再按导入后的最终状态做合并校验
function runImport(rows) {
  const errors = [];
  const parsed = [];

  rows.forEach((r, i) => {
    const line = i + 2;
    const c = D.contracts.find(x => x.contractNo === r.contractNo && x.accountCate === r.accountCate && x.currency === r.currency);
    if (!c) { errors.push(`第 ${line} 行：合同 ${r.contractNo} 下不存在核算大类 ${r.accountCate} 与币种 ${r.currency} 的组合`); return; }
    if (!['关联返利', '关联到款'].includes(r.type)) { errors.push(`第 ${line} 行：关联方式填写不正确`); return; }
    if (!amountOk(r.amount)) { errors.push(`第 ${line} 行：本次关联金额最多保留两位小数`); return; }
    if (r.type === '关联返利') {
      const b = D.rebateBase.find(x => x.rebateCoding === r.rebateCoding);
      if (!b) { errors.push(`第 ${line} 行：无法在返利底表查询到返利编码 ${r.rebateCoding}`); return; }
      if (b.accountCate !== c.accountCate && b.productLine !== c.productLine) {
        errors.push(`第 ${line} 行：合同 ${r.contractNo} 与返利编码 ${r.rebateCoding} 的核算大类、产品线均不一致`); return;
      }
    } else {
      const pick = D.daokuanPicks.find(p => p.contractNo === r.contractNo && p.daokuanId === r.daokuanId);
      if (!pick) { errors.push(`第 ${line} 行：到款ID ${r.daokuanId} 未关联该合同号`); return; }
    }
    parsed.push({ line: line, row: r, contract: c });
  });
  if (errors.length) return { errors: errors, logs: [] };

  // 合并校验一：每个返利编码
  const byCoding = {};
  parsed.filter(p => p.row.type === '关联返利').forEach(p => {
    (byCoding[p.row.rebateCoding] = byCoding[p.row.rebateCoding] || { c: 0, lines: [] });
    byCoding[p.row.rebateCoding].c += cents(p.row.amount);
    byCoding[p.row.rebateCoding].lines.push(p.line);
  });
  for (const k in byCoding) {
    const st = rebateStat(k);
    if (byCoding[k].c > st.residue)
      errors.push(`第 ${byCoding[k].lines.join('、')} 行：返利编码 ${k} 关联金额合计 ${fmt(yuan(byCoding[k].c))}，大于剩余可关联金额 ${fmt(yuan(st.residue))}`);
  }
  // 合并校验二：每个到款ID按合同合并
  const byDk = {};
  parsed.filter(p => p.row.type === '关联到款').forEach(p => {
    const key = p.row.contractNo + '|' + p.row.daokuanId;
    (byDk[key] = byDk[key] || { c: 0, lines: [], contractNo: p.row.contractNo, daokuanId: p.row.daokuanId });
    byDk[key].c += cents(p.row.amount);
    byDk[key].lines.push(p.line);
  });
  for (const k in byDk) {
    const v = byDk[k];
    const pick = D.daokuanPicks.find(p => p.contractNo === v.contractNo && p.daokuanId === v.daokuanId);
    if (pick && v.c > cents(pick.pickedAmount))
      errors.push(`第 ${v.lines.join('、')} 行：到款ID ${v.daokuanId} 在合同 ${v.contractNo} 下关联金额合计 ${fmt(yuan(v.c))}，大于挑款金额 ${fmt(pick.pickedAmount)}`);
  }
  // 合并校验三：每个合同行
  const byContract = {};
  parsed.forEach(p => {
    (byContract[p.contract.id] = byContract[p.contract.id] || { c: 0, lines: [], contract: p.contract });
    byContract[p.contract.id].c += cents(p.row.amount);
    byContract[p.contract.id].lines.push(p.line);
  });
  for (const k in byContract) {
    const v = byContract[k];
    const savedFl = sumCents(validCorrs(v.contract.id).filter(x => x.correlationType === '关联返利'), x => x.theCorrelationAmount);
    if (v.c + savedFl > cents(v.contract.totalRebate))
      errors.push(`第 ${v.lines.join('、')} 行：合同 ${v.contract.contractNo}（${v.contract.accountCate}）关联金额合计 ${fmt(yuan(v.c + savedFl))}，大于预计返利金额 ${fmt(v.contract.totalRebate)}`);
  }
  if (errors.length) return { errors: errors, logs: [] };

  // 全部通过，写入数据
  const today = new Date().toISOString().slice(0, 10);
  const logs = [];
  parsed.forEach(p => {
    const r = p.row, c = p.contract;
    if (r.type === '关联返利') {
      const b = D.rebateBase.find(x => x.rebateCoding === r.rebateCoding);
      D.correlations.push({
        id: 'R' + nextUid(), contractId: c.id, correlationType: '关联返利', correlationDate: today,
        rebateCoding: b.rebateCoding, rebateName: b.rebateName, alreadyBillAmount: b.alreadyBillAmount,
        theCorrelationAmount: Number(r.amount), status: 1, whetherUnlock: '否', unlockReason: ''
      });
      logs.push(`第 ${p.line} 行：合同 ${c.contractNo} 新增关联返利 ${r.rebateCoding}，金额 ${fmt(r.amount)}`);
    } else {
      const old = validCorrs(c.id).find(x => x.correlationType === '关联到款' && x.daokuanId === r.daokuanId);
      if (old) { old.status = 0; old.unlockReason = '批量导入覆盖'; }
      const pick = D.daokuanPicks.find(x => x.contractNo === c.contractNo && x.daokuanId === r.daokuanId);
      if (cents(r.amount) > 0) {
        D.correlations.push({
          id: 'R' + nextUid(), contractId: c.id, correlationType: '关联到款', correlationDate: today,
          daokuanId: r.daokuanId, pickedAmount: pick.pickedAmount, theCorrelationAmount: Number(r.amount),
          status: 1, whetherUnlock: '否', unlockReason: ''
        });
      }
      logs.push(`第 ${p.line} 行：合同 ${c.contractNo} 到款 ${r.daokuanId} 关联金额${old ? '由 ' + fmt(old.theCorrelationAmount) + ' 覆盖为 ' : '置为 '}${fmt(r.amount)}`);
    }
  });
  Object.values(byContract).forEach(v => {
    const remain = contractRebateCents(v.contract);
    logs.push(remain === 0
      ? `合同 ${v.contract.contractNo}（${v.contract.accountCate}）剩余返利金额为 0，已移入已关联返利合同`
      : `合同 ${v.contract.contractNo}（${v.contract.accountCate}）剩余返利金额 ${fmt(yuan(remain))}，仍停留在待关联`);
  });
  return { errors: [], logs: logs };
}


/* ================= PRD 说明抽屉 ================= */
const DRAWER_TABS = [
  ['flow', '流转与时间轴'],
  ['notes', '补充说明'],
  ['versions', '版本变化'],
  ['tools', '演示工具'],
  ['links', '相关链接']
];
let drawerTab = 'flow';

const SVG_FLOW = `
<svg viewBox="0 0 560 300" class="prd-svg" role="img" aria-label="合同状态流转">
  <defs><marker id="ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
    <path d="M0,0 L8,4 L0,8 z" fill="#1F2329"/></marker>
    <marker id="arb" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
    <path d="M0,0 L8,4 L0,8 z" fill="#3370FF"/></marker>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
    <path d="M0,0 L8,4 L0,8 z" fill="#F54A45"/></marker></defs>
  <g font-size="12" font-family="inherit" fill="#1F2329">
    <rect x="8" y="40" width="96" height="42" rx="6" fill="#fff" stroke="#1F2329"/>
    <text x="56" y="57" text-anchor="middle">项目管理平台</text><text x="56" y="72" text-anchor="middle">合同同步</text>
    <rect x="140" y="40" width="88" height="42" rx="6" fill="#EFF3FC" stroke="#1F2329"/>
    <text x="184" y="66" text-anchor="middle">待关联合同</text>
    <rect x="262" y="40" width="104" height="42" rx="6" fill="#EFF3FC" stroke="#1F2329"/>
    <text x="314" y="57" text-anchor="middle">编辑关联 / 导入</text><text x="314" y="72" text-anchor="middle">返利 · 到款</text>
    <polygon points="400,61 428,40 456,61 428,82" fill="#E9E3FB" stroke="#1F2329"/>
    <text x="428" y="58" text-anchor="middle" font-size="10">合同剩余</text><text x="428" y="70" text-anchor="middle" font-size="10">返利金额</text>
    <rect x="474" y="40" width="80" height="42" rx="6" fill="#EFF3FC" stroke="#1F2329"/>
    <text x="514" y="66" text-anchor="middle">已关联合同</text>
    <rect x="200" y="252" width="200" height="36" rx="6" fill="#F2F3F5" stroke="#8F959E" stroke-dasharray="4 3"/>
    <text x="300" y="274" text-anchor="middle" fill="#646A73">合同终止：释放全部关联，不再可见</text>
    <line x1="104" y1="61" x2="136" y2="61" stroke="#1F2329" marker-end="url(#ar)"/>
    <line x1="228" y1="61" x2="258" y2="61" stroke="#1F2329" marker-end="url(#ar)"/>
    <line x1="366" y1="61" x2="396" y2="61" stroke="#1F2329" marker-end="url(#ar)"/>
    <line x1="456" y1="61" x2="470" y2="61" stroke="#1F2329" marker-end="url(#ar)"/>
    <text x="463" y="34" text-anchor="middle" font-size="10">= 0</text>
    <path d="M428,40 L428,16 L184,16 L184,36" fill="none" stroke="#1F2329" marker-end="url(#ar)"/>
    <text x="306" y="12" text-anchor="middle" font-size="10">&gt; 0 仍停留在待关联</text>
    <path d="M500,82 L500,120 L196,120 L196,86" fill="none" stroke="#3370FF" marker-end="url(#arb)"/>
    <text x="348" y="115" text-anchor="middle" font-size="10" fill="#3370FF">采购经理手工解锁（按单条记录）</text>
    <path d="M528,82 L528,168 L172,168 L172,86" fill="none" stroke="#F54A45" stroke-dasharray="5 3" marker-end="url(#arr)"/>
    <text x="350" y="163" text-anchor="middle" font-size="10" fill="#F54A45">外部数据变动自动释放（无需解锁）</text>
    <path d="M160,82 L160,270 L196,270" fill="none" stroke="#8F959E" stroke-dasharray="4 3"/>
    <path d="M540,82 L540,270 L404,270" fill="none" stroke="#8F959E" stroke-dasharray="4 3"/>
  </g>
</svg>`;

const SVG_TIMELINE = `
<svg viewBox="0 0 560 150" class="prd-svg" role="img" aria-label="预警邮件推送时间轴">
  <g font-size="11" font-family="inherit" fill="#1F2329">
    <rect x="20" y="60" width="150" height="20" rx="4" fill="#3370FF"/>
    <rect x="175" y="60" width="150" height="20" rx="4" fill="#FF8800"/>
    <rect x="330" y="60" width="112" height="20" rx="4" fill="#F54A45"/>
    <rect x="447" y="60" width="93" height="20" rx="4" fill="#BBBFC4"/>
    <text x="95" y="40" text-anchor="middle" fill="#3370FF" font-weight="bold">未到期预警</text>
    <text x="95" y="54" text-anchor="middle" fill="#646A73">前 4 周起每周一次</text>
    <text x="250" y="40" text-anchor="middle" fill="#FF8800" font-weight="bold">已到期未关联</text>
    <text x="250" y="54" text-anchor="middle" fill="#646A73">第 1–4 周共 4 次</text>
    <text x="386" y="40" text-anchor="middle" fill="#F54A45" font-weight="bold">升级预警</text>
    <text x="386" y="54" text-anchor="middle" fill="#646A73">第 5–7 周共 3 次</text>
    <text x="493" y="40" text-anchor="middle" fill="#646A73" font-weight="bold">停止推送</text>
    <line x1="172" y1="30" x2="172" y2="96" stroke="#1F2329" stroke-dasharray="4 3"/>
    <text x="172" y="24" text-anchor="middle" font-weight="bold">预计返利时间</text>
    <text x="20" y="108" fill="#646A73">-4周</text><text x="160" y="108" fill="#646A73">到期日</text>
    <text x="318" y="108" fill="#646A73">+4周</text><text x="430" y="108" fill="#646A73">+7周</text>
    <text x="20" y="132" fill="#646A73">推送条件：合同出库金额 &gt; 0 且合同剩余返利金额 &gt; 0，阶段按预计返利时间实时推算</text>
  </g>
</svg>`;

function openDrawer() {
  $('#drawer').hidden = false;
  $('#drawer-mask').hidden = false;
  renderDrawer();
}
function closeDrawer() { $('#drawer').hidden = true; $('#drawer-mask').hidden = true; }

function renderDrawer() {
  $('#drawer-tabs').innerHTML = DRAWER_TABS.map(t =>
    `<button class="${t[0] === drawerTab ? 'on' : ''}" data-drawer-tab="${t[0]}">${t[1]}</button>`).join('');
  const P = D.prd;
  let html = '';

  if (drawerTab === 'flow') {
    html = `<h3>合同状态流转</h3>${SVG_FLOW}
      <p class="prd-p">保存后重算合同剩余返利金额：大于 0 仍停留在待关联，等于 0 移入已关联。已关联需调整时由采购经理按单条记录解锁；外部数据变动导致剩余金额大于 0 时自动回到待关联，无需解锁。</p>
      <h3>预警邮件推送时间轴</h3>${SVG_TIMELINE}
      <p class="prd-p">收件人为产品专员、预计返利运营总、预计返利采购；升级阶段加送事业部总。<span class="warn">现有代码第三阶段为到期后 4–8 周，与上图 5–7 周不一致，见待办清单 BUG-08。</span></p>`;
  }

  if (drawerTab === 'notes') {
    html = `<p class="prd-p">以下内容没有对应界面，原型不呈现，开发按本说明与方案实现。</p>
      ${P.notes.map(n => `<div class="prd-note"><b>${esc(n.title)}</b><p>${esc(n.text)}</p></div>`).join('')}`;
  }

  if (drawerTab === 'versions') {
    html = `<div class="ver-legend">
        <span class="tag-type add">新增</span><span class="tag-type mod">修改</span><span class="tag-type del">删除</span>
        <span class="tag-st done">已开发</span><span class="tag-st todo">待开发</span></div>
      ${P.versions.map(v => `<div class="ver-block">
        <div class="ver-head">${esc(v.version)}<span>${esc(v.date)}</span><span>${esc(v.author)}</span></div>
        <ul class="ver-list">${v.items.map(it => `<li>
          <span class="tag-type ${it.type === '新增' ? 'add' : it.type === '删除' ? 'del' : 'mod'}">${esc(it.type)}</span>
          <span class="ver-text">${esc(it.text)}</span>
          <span class="tag-st ${it.status === '已开发' ? 'done' : 'todo'}">${esc(it.status)}</span>
          <span class="ver-by">提出：${esc(it.by)}</span></li>`).join('')}</ul></div>`).join('')}`;
  }

  if (drawerTab === 'tools') {
    html = `<p class="prd-p warn">以下按钮仅用于评审演示，不是系统功能，开发无需实现。点击后会直接修改当前演示数据。</p>
      <div class="tool-grid">
        <button class="btn primary" data-sim="rebate">模拟返利变更</button>
        <button class="btn primary" data-sim="daokuan">模拟挑款金额变化</button>
        <button class="btn primary" data-sim="shrink">模拟合同金额变小</button>
        <button class="btn danger" data-sim="terminate">模拟合同终止</button>
      </div>
      <div class="tool-desc">
        <p><b>模拟返利变更</b>：返利编码 639724 发生调整，其上所有合同关联失效并释放，受影响合同自动回到待关联。</p>
        <p><b>模拟挑款金额变化</b>：到款 DK20260812007 挑款金额由 20000 变为 15000，仅该到款的关联失效，同合同的返利关联不受影响。</p>
        <p><b>模拟合同金额变小</b>：ZZWHF26070219 预计返利金额由 31908 改为 20000，该合同下全部关联失效。</p>
        <p><b>模拟合同终止</b>：ZZSHF25010022 终止，释放全部关联，合同对用户不再可见。</p>
      </div>`;
  }

  if (drawerTab === 'links') {
    html = `<p class="prd-p">链接维护在 mock-data.js 的 prd.links 中，未填写地址的条目显示为待补充。</p>
      <ul class="link-list">${P.links.map(l => l.url
        ? `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`
        : `<li><span class="muted">${esc(l.label)}（待补充链接）</span></li>`).join('')}</ul>`;
  }
  $('#drawer-body').innerHTML = html;
}

/* -------- 演示：模拟外部数据变动 -------- */
function releaseAndMail(list, reason, extra) {
  const mails = list.map(c => {
    const contract = contractById(c.contractId);
    return {
      contractNo: contract.contractNo, businessDivision: contract.businessDivision,
      accountCate: contract.accountCate, currency: dict('cmn_currency_code', contract.currency),
      totalRebate: fmt(contract.totalRebate), released: fmt(c.theCorrelationAmount),
      daokuanId: c.daokuanId || '—', rebateCoding: c.rebateCoding || '—', reason: reason
    };
  });
  list.forEach(c => { c.status = 0; c.whetherUnlock = '是'; c.unlockReason = reason; });
  if (extra) extra();
  openMailModal('合同自动释放返利/到款通知', reason, mails);
}

function simulate(kind) {
  if (kind === 'rebate') {
    const list = D.correlations.filter(c => c.status === 1 && c.rebateCoding === '639724');
    if (!list.length) { toast('返利 639724 当前没有有效关联，可先做一笔关联再试', 'error'); return; }
    releaseAndMail(list, '返利数据调整');
  }
  if (kind === 'daokuan') {
    const list = D.correlations.filter(c => c.status === 1 && c.daokuanId === 'DK20260812007');
    if (!list.length) { toast('到款 DK20260812007 当前没有有效关联', 'error'); return; }
    releaseAndMail(list, '挑款金额变更', () => {
      const pick = D.daokuanPicks.find(p => p.daokuanId === 'DK20260812007');
      if (pick) pick.pickedAmount = 15000;
      const c = D.contracts.find(x => x.contractNo === 'ZZWHF26070219');
      D.correlations.push({
        id: 'R' + nextUid(), contractId: c.id, correlationType: '关联到款',
        correlationDate: new Date().toISOString().slice(0, 10), daokuanId: 'DK20260812007',
        pickedAmount: 15000, theCorrelationAmount: 0, status: 1, whetherUnlock: '否', unlockReason: ''
      });
    });
  }
  if (kind === 'shrink') {
    const c = D.contracts.find(x => x.contractNo === 'ZZWHF26070219');
    const list = validCorrs(c.id);
    if (!list.length) { toast('该合同当前没有有效关联', 'error'); return; }
    releaseAndMail(list, '合同变更：预计返利金额变小', () => { c.totalRebate = 20000; });
  }
  if (kind === 'terminate') {
    const c = D.contracts.find(x => x.contractNo === 'ZZSHF25010022');
    if (!c || c.terminated) { toast('该合同已终止', 'error'); return; }
    releaseAndMail(validCorrs(c.id), '合同终止', () => { c.terminated = true; });
  }
  ctx = null;
  renderList();
}

function openMailModal(title, reason, rows) {
  $('#modal-body').innerHTML = `
    <div class="mail-box">
      <div class="mail-head">
        <div><b>邮件标题</b>${esc(title)}</div>
        <div><b>收件人</b>产品线-产品专员、采购商务、运营总</div>
        <div><b>发送方式</b>每次同步任务完成后按收件人汇总为一封</div>
      </div>
      <p class="mail-lead">您好，因关联数据发生调整，已关联的预计返利金额已释放，释放结果如下，请重新做关联。</p>
      <div class="table-wrap dlg-table"><table>
        <thead><tr><th>合同号</th><th>事业部</th><th>核算大类</th><th>币种</th><th>预计返利金额（原币种）</th>
          <th>本次释放关联金额</th><th>到款ID</th><th>返利ID</th><th>释放原因</th></tr></thead>
        <tbody>${rows.length ? rows.map(r => `<tr><td>${esc(r.contractNo)}</td><td>${esc(r.businessDivision)}</td>
          <td>${esc(r.accountCate)}</td><td>${esc(r.currency)}</td><td>${esc(r.totalRebate)}</td>
          <td>${esc(r.released)}</td><td>${esc(r.daokuanId)}</td><td>${esc(r.rebateCoding)}</td>
          <td>${esc(r.reason)}</td></tr>`).join('') : '<tr><td class="empty" colspan="9">无释放记录</td></tr>'}</tbody>
      </table></div>
      <p class="mail-foot">释放后受影响合同的剩余返利金额回增，自动回到待关联返利合同列表（合同终止除外）。</p>
    </div>`;
  showModal('释放通知邮件预览（原型演示）', [['关闭', 'modal-cancel']]);
}

/* ---------------- 事件 ---------------- */
document.addEventListener('click', e => {
  // 一级菜单：箭头只是收起/展开标记
  if (e.target.closest('#nav-group')) {
    const wrap = $('#nav-children'), btn = $('#nav-group');
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    wrap.hidden = open;
    $('#nav-arrow').textContent = open ? '⌄' : '⌃';
    return;
  }

  if (e.target.closest('#prd-btn')) { openDrawer(); return; }
  if (e.target.closest('#drawer-close') || e.target.id === 'drawer-mask') { closeDrawer(); return; }
  const dt = e.target.closest('[data-drawer-tab]');
  if (dt) { drawerTab = dt.dataset.drawerTab; renderDrawer(); return; }
  const sim = e.target.closest('[data-sim]');
  if (sim) { simulate(sim.dataset.sim); return; }

  const pageTo = e.target.closest('[data-page-to]');
  if (pageTo && !pageTo.disabled) { pageState[currentPage].page = Number(pageTo.dataset.pageTo); renderList(); return; }

  const nav = e.target.closest('[data-page]');
  if (nav) {
    $$('.nav-item').forEach(x => x.classList.remove('active'));
    nav.classList.add('active');
    currentPage = nav.dataset.page;
    ctx = null;
    renderList();
    return;
  }

  const action = e.target.closest('[data-action]');
  if (action) {
    const a = action.dataset.action;
    if (a === '重置') {
      filterState[currentPage] = {};
      pageState[currentPage].page = 1;
      renderList();
      toast('筛选条件已重置');
    } else if (a === '查询') {
      collectFilters();
      pageState[currentPage].page = 1;
      renderList();
      toast(`查询完成，共 ${PAGES[currentPage].rows(filterState[currentPage]).length} 条`);
    } else if (a === '批量导入') {
      $('#file-input').click();
    } else if (a === '导出待关联模板') {
      const n = $$('#tbody .row-check:checked').length;
      n ? openTemplateModal(n) : toast('请先勾选需要导出的数据', 'error');
    } else if (a.includes('导出')) {
      collectFilters();
      toast(`${a}已生成，按当前筛选条件导出 ${PAGES[currentPage].rows(filterState[currentPage]).length} 条（原型演示）`);
    }
    return;
  }

  const op = e.target.closest('[data-op]');
  if (op) { openDetail(op.dataset.key, op.dataset.op); return; }

  const act = e.target.closest('[data-act]');
  if (!act) return;
  const uid = act.dataset.uid;
  switch (act.dataset.act) {
    case 'exit': backToList(); break;
    case 'save': doSave(); break;
    case 'save-unlock': doSaveUnlock(); break;
    case 'add-row':
      ctx.rows.push({ uid: nextUid(), id: '', saved: false, correlationType: '关联返利', rebateCoding: '', rebateName: '', alreadyBillAmount: '', theCorrelationAmount: '' });
      renderDetail();
      break;
    case 'del-row': {
      const checked = $$('#detail-tbody .row-check:checked').map(x => x.dataset.uid);
      if (!checked.length) { toast('请先勾选要删除的数据', 'error'); return; }
      const savedIds = ctx.rows.filter(r => checked.includes(r.uid) && r.saved).map(r => r.id);
      ctx.rows = ctx.rows.filter(r => !checked.includes(r.uid));
      savedIds.forEach(id => {
        const rec = D.correlations.find(r => r.id === id);
        if (rec) { rec.status = 0; rec.whetherUnlock = '是'; rec.unlockReason = '编辑页删除'; }
      });
      renderDetail();
      toast(savedIds.length ? `已删除 ${checked.length} 行，其中 ${savedIds.length} 条已保存记录立即失效并释放金额`
        : `已移除 ${checked.length} 行`);
      break;
    }
    case 'pick-rebate': openRebateDialog(uid); break;
    case 'dlg-query':
      dlg.query = { rebateCoding: $('#q-coding').value.trim(), rebateName: $('#q-name').value.trim(), min: $('#q-min').value.trim(), max: $('#q-max').value.trim() };
      dlg.byProductLine = $('#q-line').checked;
      dlg.page = 1;
      renderRebateDialog();
      break;
    case 'dlg-page':
      dlg.page = Number(act.dataset.p);
      renderRebateDialog();
      break;
    case 'dlg-confirm': {
      if (!dlg.picked.size) { toast('请先选择返利数据', 'error'); return; }
      const codings = [...dlg.picked];
      const target = ctx.rows.find(r => r.uid === dlg.uid);   // 按唯一标识定位，避免下标错位
      const idx = ctx.rows.indexOf(target);
      const mk = coding => {
        const b = D.rebateBase.find(x => x.rebateCoding === coding);
        return { uid: nextUid(), id: '', saved: false, correlationType: '关联返利', rebateCoding: b.rebateCoding, rebateName: b.rebateName, alreadyBillAmount: b.alreadyBillAmount, theCorrelationAmount: '' };
      };
      const first = mk(codings[0]);
      first.uid = target.uid;
      ctx.rows.splice(idx, 1, first, ...codings.slice(1).map(mk));
      closeModal();
      renderDetail();
      break;
    }
    case 'import-run': {
      const res = runImport(IMPORT_SAMPLES[importPick].rows);
      renderImportModal(importFileName, res);
      if (!res.errors.length) {
        $('#modal-actions').innerHTML = `<button class="btn primary" data-act="import-done">完成</button>`;
        toast('导入成功，列表数据已更新');
      } else {
        toast('导入失败，整批回滚', 'error');
      }
      break;
    }
    case 'import-done': closeModal(); renderList(); break;
    case 'modal-cancel': closeModal(); break;
  }
});

document.addEventListener('change', e => {
  if (e.target.id === 'page-size') { pageState[currentPage].size = Number(e.target.value); pageState[currentPage].page = 1; renderList(); return; }
  if (e.target.id === 'role-select') { D.auth.role = e.target.value; ctx = null; applyDemoMode(); renderList(); toast(`已切换为${perm().label}`); return; }
  if (e.target.id === 'demo-mode') { demoMode = e.target.checked; applyDemoMode(); ctx ? renderDetail() : renderList(); return; }
  if (e.target.id === 'type-select') { ctx.filterType = e.target.value; renderDetail(); return; }
  if (e.target.id === 'status-filter') { ctx.statusFilter = e.target.value; renderDetail(); return; }
  if (e.target.name === 'sample') { importPick = e.target.value; renderImportModal(importFileName, null); return; }
  if (e.target.classList.contains('dlg-check')) {
    e.target.checked ? dlg.picked.add(e.target.dataset.coding) : dlg.picked.delete(e.target.dataset.coding);
    syncDlgSelection();                       // 不整体重绘，避免丢失勾选焦点
    return;
  }
  if (e.target.classList.contains('dlg-check-all')) {
    const on = e.target.checked;
    $$('#modal-body .dlg-check').forEach(x => {
      x.checked = on;
      on ? dlg.picked.add(x.dataset.coding) : dlg.picked.delete(x.dataset.coding);
    });
    syncDlgSelection();
    return;
  }
  if (e.target.classList.contains('check-all')) {
    $$('#detail-tbody .row-check').forEach(x => { x.checked = e.target.checked; });
    return;
  }
  if (e.target.classList.contains('amount-input')) {
    const row = ctx.rows.find(r => r.uid === e.target.dataset.uid);
    if (row) { row.theCorrelationAmount = e.target.value.trim(); renderDetail(); }
  }
});

// 回车触发查询
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.closest('#filters')) { collectFilters(); pageState[currentPage].page = 1; renderList(); }
  if (e.key === 'Enter' && e.target.id === 'page-jump') {
    const n = Number(e.target.value);
    if (n >= 1) { pageState[currentPage].page = n; renderList(); }
  }
});

// 演示模式与角色切换
function applyDemoMode() {
  $('#role-select').hidden = !demoMode;
  document.body.classList.toggle('demo-off', !demoMode);
  $('#nav-children').querySelector('[data-page="base"]').hidden = !perm().isAdmin;
  if (currentPage === 'base' && !perm().isAdmin) {
    currentPage = 'pending';
    $$('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.page === 'pending'));
  }
}
$('#role-select').innerHTML = Object.entries(D.roles)
  .map(([k, v]) => `<option value="${k}" ${k === D.auth.role ? 'selected' : ''}>${v.label}</option>`).join('');
applyDemoMode();

$('#modal-close').onclick = closeModal;
$('#file-input').onchange = e => { if (e.target.files[0]) { importFileName = e.target.files[0].name; importPick = 'ok'; openImportModal(importFileName); e.target.value = ''; } };
$('#user-name').textContent = D.auth.userName;
renderList();
