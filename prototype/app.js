/*
 * 预计返利管理原型｜交互逻辑
 *
 * 全部展示数据由 mock-data.js 派生，不在本文件写死列表内容。
 * 金额一律按「分」做整数运算，规避浮点误差（对应方案核心口径-金额精度）。
 * 筛选条件为真实筛选，作用于派生后的数据集。
 */

/* ---------------- 基础工具 ---------------- */
const D = window.rebateMockData;
D.reviewDrafts = D.reviewDrafts || []; // 增补：特殊关联保存后先进入待提审池，由待关联列表批量提交审批
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cents = n => Math.round(Number(n || 0) * 100);
const yuan = c => c / 100;
const fmt = n => Number(n || 0).toFixed(2);
const sumCents = (arr, pick) => arr.reduce((s, x) => s + cents(pick(x)), 0);
const dict = (t, v) => (D.dicts[t] && D.dicts[t][v]) || v || '';
const amountOk = v => /^\d+(\.\d{1,2})?$/.test(String(v).trim());
// 批量导入专用：超两位小数四舍五入保留两位（与手工填写的 amountOk 报错规则不同，方案 3.2.2.4）
const round2 = v => Math.round(Number(v || 0) * 100) / 100;
const uniq = (arr, k) => [...new Set(arr.map(x => x[k]).filter(Boolean))].sort();

let uidSeq = 1000;
const nextUid = () => 'U' + (++uidSeq);

/* 当前角色权限（方案 3.2.1 / 3.3.1） */
const perm = () => D.roles[D.auth.role];

/* 开发模式：打开时显示角色切换、演示工具入口，以及字段级说明提示；关闭后即为上线形态 */
let devMode = true;
/* 场景优化（增补需求，2026-09-10 会议纪要）：打开后编辑页出现新关联方式；关闭即为改动前的基线原型 */
let addonMode = true;

function toast(text, type) {
  const el = $('#toast');
  el.textContent = text;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(el._t);
  el._t = setTimeout(() => (el.className = 'toast'), 2800);
}

/* ---------------- 派生数据 ---------------- */
const validCorrs = cid => D.correlations.filter(c => c.contractId === cid && c.status === 1);
// 增补需求：合同剩余返利金额要扣减「审批中」记录，这里额外提供一个 有效+审批中 的口径
const effectiveCorrs = cid => D.correlations.filter(c => c.contractId === cid && (c.status === 1 || c.status === 2));
const hasPendingApproval = cid => D.correlations.some(c => c.contractId === cid && c.status === 2);

// 合同剩余返利金额 = 预计返利金额 − （有效 + 审批中）关联合计（关联返利 + 关联到款）
const contractRebateCents = c => cents(c.totalRebate) - sumCents(effectiveCorrs(c.id), x => x.theCorrelationAmount);

// 关联类型：到款/货款行金额为 0 或空时不展示对应标签；审批中的记录也计入展示（业务能看到这笔占着额度）
function theType(c) {
  const l = effectiveCorrs(c.id), out = [];
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

/* ---- 增补需求：共享到款池（跨合同关联/跨客户关联/厂商款补/其他款补共用） ----
 * 口径与 rebateStat 一致：谁先关联谁先占用挑款总金额，已用金额按「有效 + 审批中」合并计算，跨全部合同求和。 */
const SPECIAL_DK_SUBTYPES = ['跨合同关联', '跨客户关联', '厂商款补', '其他款补'];
function sharedDaokuanStat(daokuanId) {
  const already = sumCents(
    D.correlations.filter(c => (c.status === 1 || c.status === 2) && c.correlationType === '关联到款'
      && SPECIAL_DK_SUBTYPES.includes(c.subType) && c.daokuanId === daokuanId),
    c => c.theCorrelationAmount);
  const base = D.sharedDaokuan.find(d => d.daokuanId === daokuanId) || { totalPickedAmount: 0 };
  return { already: already, residue: cents(base.totalPickedAmount) - already };
}

// 增补需求例外：合同下还挂着 status=2（审批中）记录时，即使算出来剩余为 0，也停留在待关联，不移入已关联
const pendingContracts = () => D.contracts.filter(c => !c.terminated && (contractRebateCents(c) > 0 || hasPendingApproval(c.id)));
const linkedContracts = () => D.contracts.filter(c => !c.terminated && contractRebateCents(c) === 0 && !hasPendingApproval(c.id));
const contractById = id => D.contracts.find(c => c.id === id);
const contractByNo = no => D.contracts.find(c => c.contractNo === no); // 增补需求：来源合同信息按合同号查（原型演示用，取首个匹配行）

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
    { key: 'outboundAmount', label: '合同出库金额', type: 'select', ph: '请选择', opts: () => [['1', '大于0'], ['0', '等于0']] },
    { key: 'approvalStatus', label: '审批状态', type: 'select', ph: '全部', opts: () => [['待提交', '待提交'], ['审批中', '审批中'], ['审批通过', '审批通过'], ['审批驳回', '审批驳回'], ['审批拒绝', '审批拒绝']] }
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

function contractApprovalStatus(c) {
  if ((D.reviewDrafts || []).some(r => r.contractId === c.id)) return '待提交';
  if (D.correlations.some(r => r.contractId === c.id && r.status === 2)) return '审批中';
  return '—';
}
function approvalStatusHtml(c) {
  const st = contractApprovalStatus(c);
  if (st === '待提交') return '<span class="approval-tag todo">待提交</span>';
  if (st === '审批中') return '<span class="approval-tag running">审批中</span>';
  if (st === '审批驳回' || st === '审批拒绝') return `<span class="approval-tag rejected">${st}</span>`;
  if (st === '审批通过') return '<span class="approval-tag passed">审批通过</span>';
  return '—';
}

function matchContract(c, f) {
  return like(c.contractNo, f.contractNo) && like(c.customer, f.customer)
    && eqv(c.accountCate, f.accountCate) && eqv(c.businessDivision, f.businessDivision)
    && eqv(c.salerName, f.salerName)
    && inRange(c.applyDate, f.applyDate_start, f.applyDate_end)
    && inRange(c.estimatedRebateTime, f.estimatedRebateTime_start, f.estimatedRebateTime_end)
    && (f.outboundAmount === undefined || f.outboundAmount === ''
      || (f.outboundAmount === '1' ? cents(c.outboundAmount) > 0 : cents(c.outboundAmount) === 0))
    && (!f.approvalStatus || contractApprovalStatus(c) === f.approvalStatus);
}

/* ---------------- 列表页配置 ---------------- */
const PAGES = {
  pending: {
    title: '待关联返利列表',
    actions: () => perm().canEdit ? ['导出待关联模板', '批量导入', '导出查询结果', '查询', '重置'] : ['导出查询结果', '查询', '重置'],
    columns: ['', '序号', '申请日期', '合同号', '事业部', '客户名称', '销售员', '合同类型', '合同金额', '合同出库金额',
      '产品线名称', '核算大类', '预计返利金额', '合同剩余返利金额', '币种', '预计返利时间', '关联类型', '审批状态', '操作'],
    rows: f => pendingContracts().filter(c => matchContract(c, f)).map((c, i) => ({
      key: c.id,
      cells: ['<input type="checkbox" class="row-check">', i + 1, c.applyDate, c.contractNo, c.businessDivision,
        c.customer, c.salerName, c.prevIdStr, fmt(c.contractAmount), fmt(c.outboundAmount), c.productLine,
        c.accountCate, fmt(c.totalRebate), fmt(yuan(contractRebateCents(c))), dict('cmn_currency_code', c.currency),
        c.estimatedRebateTime, theType(c) || '—', approvalStatusHtml(c)],
      ops: perm().canEdit ? [['查看详情', 'view'], ['编辑', 'edit']] : [['查看详情', 'view']]
    }))
  },

  linked: {
    title: '已关联返利列表',
    actions: () => ['导出查询结果', '查询', '重置'],
    columns: ['序号', '申请日期', '合同号', '事业部', '客户名称', '销售员', '合同类型', '合同金额', '合同出库金额',
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
      '预计返利金额', '关联类型', '关联返利编码', '返利名称', '已上账金额', '剩余可关联金额', '到款ID', '挑款金额', '关联金额', '审批状态'],
    rows: f => D.correlations.filter(r => r.status === 1 || r.status === 2).map(r => ({ r: r, c: contractById(r.contractId) || {} }))
      .filter(x => !x.c.terminated)
      .filter(x => like(x.c.contractNo, f.contractNo) && like(x.c.customer, f.customer)
        && eqv(x.c.accountCate, f.accountCate) && like(x.r.rebateCoding, f.rebateCoding)
        && inRange(x.r.correlationDate, f.correlationDate_start, f.correlationDate_end))
      .map((x, i) => {
        const r = x.r, c = x.c, isFl = r.correlationType === '关联返利', isDk = r.correlationType === '关联到款';
        const st = isFl ? rebateStat(r.rebateCoding) : null;
        const typeLabel = r.correlationType + (isDk && r.subType && r.subType !== '通用关联' ? `-${r.subType}` : '');
        return {
          key: r.id,
          cells: [i + 1, r.correlationDate, c.contractNo, fmt(c.outboundAmount), c.businessDivision, c.customer,
            c.productLine, c.accountCate, dict('cmn_currency_code', c.currency), fmt(c.totalRebate), typeLabel,
            isFl ? r.rebateCoding : '—', isFl ? r.rebateName : '—', isFl ? fmt(r.alreadyBillAmount) : '—',
            isFl ? fmt(yuan(st.residue)) : '—', isFl ? '—' : (r.daokuanId || '—'), isDk ? fmt(r.pickedAmount) : '—',
            fmt(r.theCorrelationAmount), r.status === 2 ? '<span class="addon-badge pending">审批中</span>' : '—'],
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

/* ---------------- 字段级说明提示（开发模式） ----------------
 * 只标注原型画面上看不出来的口径 / 校验规则，纯透传字段（合同号、事业部等）不标注。
 * 与「PRD 说明」抽屉的「方案快速说明」内容对应，避免两处规则不一致，如需改口径请两边一起改。
 * 是否落库、由前端还是后端实现由开发自行判断，这里只给算法口径，不做技术选型。 */
const FIELD_HINTS = {
  '合同剩余返利金额': '预计返利金额 − 同合同行下有效（status=1）关联金额合计（关联返利+关联到款合并计算）；保存关联、解锁、自动释放后都要重新计算',
  '关联类型': '按合同行有效关联记录展示：出现「关联返利」记录则显示「关联返利」；出现「关联到款」且金额 > 0 的记录才显示「关联到款」，金额为 0 或空不计入',
  '剩余可关联金额': '返利底表已上账金额 − 该返利编码被全部合同有效关联的金额之和（含本合同）；新增返利时默认 = 已上账金额',
  '已关联金额': '该返利编码当前有效（status=1）关联金额合计；新增返利时默认 = 0',
  '本次关联金额': '关联返利行必填且大于 0，最多两位小数；已保存的记录不可修改（编辑页保存校验）',
  '关联金额': '关联到款行：≥ 0，最多两位小数；保存时覆盖原关联金额，= 0 表示未关联，或失效历史关联金额',
  '返利编码': '关联返利行必须先选择返利，否则无法保存；同一合同行下同一返利编码可存在多行',
  '是否解锁': '选择「是」时「解锁原因」必填，且整单至少勾选一条「是」才能保存',
  '解锁原因': '「是否解锁」选「是」时必填；保存后台会记录解锁原因、操作人、操作时间',
  '是否有效': '对应关联记录的 status 字段：有效=1，失效=0；失效记录不进入「已关联返利明细」列表，可在合同详情切换查看',
  '合同出库金额': '取自数仓，经项目管理平台每日同步一次，默认值为 0',
  '预计返利时间': '返利预警邮件推送节奏的计算基准；该字段变更后，推送节奏自动跟随调整',
  /* 增补需求（2026-09-10）字段说明 */
  '来源合同号': '增补：跨合同/跨客户/厂商款补/其他款补场景专属，这笔到款原本挂靠的合同号，点击可查看来源合同的客户名称等信息，固定列不随横向滚动移出视口',
  '挑款总金额': '增补：4 类特殊到款场景的共享到款池额度，跨合同共享，不是该合同专属；口径同返利编码的「已上账金额」',
  '剩余可用': '增补：挑款总金额 − 全部合同对该到款ID的有效 + 审批中关联金额之和，谁先关联谁先占用（与返利编码「剩余可关联金额」同一口径）',
  '审批状态': '增补：status=2 时显示「审批中」，占用共享到款额度；通过后变为有效不再标注，驳回后失效并释放额度'
};

// 按钮级说明（保存等操作按钮的完整逻辑），key 对应按钮的 data-act
const ACTION_HINTS = {
  'save': '先执行保存校验（见「保存校验」组，六项，任一不通过整单不保存）；通过后：关联返利新增行生效、写入已关联返利明细、更新返利底表已关联金额；关联到款按到款ID覆盖原记录（原记录失效、新记录生效）；最后重算合同剩余返利金额，> 0 留在待关联，= 0 移入已关联。',
  'save-unlock': '校验：至少勾选一条「是否解锁 = 是」，且勾选的记录必须填写解锁原因；通过后：所选记录失效并释放金额，重算返利底表与合同剩余返利金额，合同回到待关联返利合同列表，并发送释放通知邮件。'
};

// 统一构造表头单元格：checkbox/resizer 等自带 HTML 的列原样输出；开发模式下命中 FIELD_HINTS 的列在字段名后加编号角标
let hintCollector = [];
const resetHints = () => { hintCollector = []; };

const STICKY_HEADERS = ['操作', '来源合同号'];
function thCell(label) {
  const raw = String(label);
  if (raw.startsWith('<input') || raw.startsWith('<button')) return `<th>${raw}</th>`;
  const stickyCls = STICKY_HEADERS.includes(raw) ? ' class="col-sticky"' : '';
  const hint = devMode && FIELD_HINTS[raw];
  if (!hint) return `<th${stickyCls}>${esc(raw)}</th>`;
  hintCollector.push({ label: raw, hint: hint });
  const n = hintCollector.length;
  return `<th${stickyCls}><span class="th-hint" data-tip="${esc(hint)}">${esc(raw)}<sup class="th-num">${n}</sup></span></th>`;
}

// 按钮文字加同样的编号角标 + 悬浮说明，用于「保存」这类看不出内部逻辑的操作按钮
function actionHintLabel(text, actKey) {
  const hint = devMode && ACTION_HINTS[actKey];
  if (!hint) return esc(text);
  hintCollector.push({ label: text, hint: hint });
  const n = hintCollector.length;
  return `<span class="th-hint" data-tip="${esc(hint)}">${esc(text)}<sup class="th-num">${n}</sup></span>`;
}

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

  const pageActions = p.actions();
  const filterActions = (currentPage === 'pending' && addonMode)
    ? pageActions.filter(a => !['导出待关联模板', '批量导入'].includes(a))
    : pageActions;
  $('#filters').innerHTML = filterHtml(currentPage) +
    `<div class="actions">${filterActions.map(a => `<button class="btn ${a === '重置' ? '' : 'primary'}" data-action="${a}">${a}</button>`).join('')}</div>`;

  const listToolbar = $('#list-toolbar');
  if (currentPage === 'pending' && addonMode && perm().canEdit) {
    listToolbar.innerHTML = `<div class="batch-menu">
      <button class="btn primary batch-main" data-act="batch-menu-toggle">批量关联 <span class="caret">∨</span></button>
      <div class="batch-pop" hidden>
        <button data-action="导出待关联模板">导出待关联模板</button>
        <button data-action="批量导入">批量导入</button>
      </div>
    </div>
    <button class="btn primary" data-act="open-batch-review">提交审批</button>`;
  } else {
    listToolbar.innerHTML = '';
  }

  const all = p.rows(filterState[currentPage]);
  const ps = pageState[currentPage];
  const pages = Math.max(1, Math.ceil(all.length / ps.size));
  if (ps.page > pages) ps.page = pages;
  const rows = all.slice((ps.page - 1) * ps.size, ps.page * ps.size);

  resetHints();
  $('#thead').innerHTML = `<tr>${p.columns.map(thCell).join('')}</tr>`;
  $('#tbody').innerHTML = rows.length
    ? rows.map(r => `<tr data-key="${r.key}" class="${currentPage === 'pending' && contractApprovalStatus(contractById(r.key) || {}) === '待提交' ? 'row-needs-approval' : ''}">${r.cells.map(v => {
        const s = String(v);
        const isHtml = s.startsWith('<input') || s.startsWith('<span') || s.startsWith('<button');
        return `<td title="${isHtml ? '' : esc(v)}">${isHtml ? v : esc(v)}</td>`;
      }).join('')}${
        r.ops ? `<td class="col-sticky">${r.ops.map(o => `<button class="link" data-op="${o[1]}" data-key="${r.key}">${o[0]}</button>`).join(' ')}</td>` : ''}</tr>`).join('')
    : `<tr><td class="empty" colspan="${p.columns.length}">暂无数据</td></tr>`;
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
    const saved = validCorrs(contract.id).find(c => c.correlationType === '关联到款' && c.daokuanId === p.daokuanId && (!c.subType || c.subType === '通用关联'));
    rows.push({
      uid: nextUid(), id: saved ? saved.id : '', saved: !!saved, correlationType: '关联到款', subType: '通用关联',
      daokuanId: p.daokuanId, pickedAmount: p.pickedAmount,
      theCorrelationAmount: saved ? fmt(saved.theCorrelationAmount) : '0.00'
    });
  });
  // 增补需求：4 类特殊到款场景，已保存（status=1，审批已通过）的记录也带出来展示，但不可再编辑（金额锁定，提交中的记录不在此出现）
  validCorrs(contract.id).filter(c => c.correlationType === '关联到款' && SPECIAL_DK_SUBTYPES.includes(c.subType)).forEach(c => {
    rows.push({
      uid: nextUid(), id: c.id, saved: true, correlationType: '关联到款', subType: c.subType,
      daokuanId: c.daokuanId, pickedAmount: c.pickedAmount, sourceContractNo: c.sourceContractNo, sourceCustomer: c.sourceCustomer,
      theCorrelationAmount: fmt(c.theCorrelationAmount)
    });
  });
  // 增补：已保存但尚未提交审批的特殊关联，重新进入编辑页时仍可看到并调整
  D.reviewDrafts.filter(r => r.contractId === contract.id).forEach(d => {
    rows.push(Object.assign({}, d, { uid: nextUid(), id: d.id || '', saved: false, draft: true,
      theCorrelationAmount: fmt(d.theCorrelationAmount) }));
  });
  return rows;
}

function openDetail(contractId, mode) {
  const contract = contractById(contractId);
  ctx = { contract: contract, mode: mode, filterType: '关联返利', subType: '通用关联', statusFilter: '1' };
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
  resetHints();

  $('#crumb-current').textContent = isEdit ? '待关联返利详情列表（编辑）' : isUnlock ? '已关联返利详情列表（解锁）' : '待关联返利详情列表（详情）';
  $('#detail-title').textContent = $('#crumb-current').textContent;

  $('#detail-head-right').innerHTML = (!isEdit && !isUnlock)
    ? `<select id="status-filter">
         <option value="1">有效</option>${addonMode ? '<option value="2">审批中</option>' : ''}<option value="0">失效</option><option value="">全部</option></select>` : '';
  if ($('#status-filter')) $('#status-filter').value = ctx.statusFilter;

  $('#type-switch').innerHTML = isEdit
    ? `<div class="label">关联方式</div><div class="value"><select id="type-select">
         <option value="关联返利">关联返利</option><option value="关联到款">关联到款</option></select></div>
       <div class="msg">ⓘ 此处可切换关联方式</div>${
         addonMode && ctx.filterType === '关联到款' ? `<div class="subtype-tabs">${
           ['通用关联', '跨合同关联', '跨客户关联', '厂商款补', '其他款补'].map(t =>
             `<button class="${t === ctx.subType ? 'on' : ''}" data-subtype="${esc(t)}">${esc(t)}</button>`).join('')
         }</div>` : ''}` : '';
  if ($('#type-select')) $('#type-select').value = ctx.filterType;

  isEdit ? renderEditTable() : isUnlock ? renderUnlockTable() : renderViewTable();

  $('#detail-toolbar').innerHTML = !isEdit ? '' : (() => {
    if (ctx.filterType === '关联返利') return `<button class="btn primary" data-act="add-row">增加一行</button>
       <button class="btn danger" data-act="del-row">删除所选</button>`;
    if (ctx.filterType === '关联到款' && addonMode && ctx.subType !== '通用关联')
      return `<button class="btn primary" data-act="pick-daokuan">增加一行</button>
       <button class="btn danger" data-act="del-row">删除所选</button>`;
    return '';
  })();

  $('#detail-footer').innerHTML = `<button class="btn" data-act="exit">退出</button>`
    + (isEdit ? `<button class="btn primary" data-act="save">${actionHintLabel('保存', 'save')}</button>` : '')
    + (isUnlock ? `<button class="btn primary" data-act="save-unlock">${actionHintLabel('保存', 'save-unlock')}</button>` : '');
}

function renderEditTable() {
  const isFl = ctx.filterType === '关联返利';
  const isDkSpecial = ctx.filterType === '关联到款' && addonMode && ctx.subType !== '通用关联';
  const rows = ctx.filterType === '关联到款'
      ? ctx.rows.filter(r => r.correlationType === '关联到款' && (addonMode ? (r.subType || '通用关联') === ctx.subType : true))
      : ctx.rows.filter(r => r.correlationType === ctx.filterType);

  let cols;
  if (isFl) cols = ['<input type="checkbox" class="check-all">', ...commonCols(true), '返利编码', '返利名称', '已上账金额', '剩余可关联金额', '本次关联金额'];
  else if (isDkSpecial) cols = ['<input type="checkbox" class="check-all">', ...commonCols(true), '到款ID', '挑款总金额', '剩余可用', '关联金额', '来源合同号'];
  else cols = ['', ...commonCols(true), '到款ID', '挑款金额', '关联金额'];
  $('#detail-thead').innerHTML = `<tr>${cols.map(thCell).join('')}</tr>`;

  if (!rows.length) {
    $('#detail-tbody').innerHTML = `<tr><td class="empty" colspan="${cols.length}">${
      isFl ? '暂无关联返利数据，请点击左下方「增加一行」新增'
      : isDkSpecial ? '该合同无关联到款数据，请点击左下方「增加一行」新增'
      : '该合同在到款系统中暂无挑款记录'}</td></tr>`;
    return;
  }

  $('#detail-tbody').innerHTML = rows.map((r, i) => {
    const checkable = isFl || isDkSpecial;
    const head = `<td>${checkable ? `<input type="checkbox" class="row-check" data-uid="${r.uid}">` : ''}</td>`;
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

    if (isDkSpecial) {
      const total = (D.sharedDaokuan.find(d => d.daokuanId === r.daokuanId) || {}).totalPickedAmount;
      const st = sharedDaokuanStat(r.daokuanId);
      return `<tr data-uid="${r.uid}">${head}${common}
        <td>${esc(r.daokuanId)}</td>
        <td>${fmt(total)}</td>
        <td>${fmt(yuan(st.residue))}</td>
        <td>${r.saved ? fmt(r.theCorrelationAmount)
          : `<input class="amount-input" data-uid="${r.uid}" value="${esc(r.theCorrelationAmount)}">`}</td>
        <td class="col-sticky"><button class="src-link" data-act="view-source" data-contractno="${esc(r.sourceContractNo)}">${esc(r.sourceContractNo)}</button></td></tr>`;
    }

    // 关联到款 · 通用关联（原有逻辑不变，同合同强绑定）
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
  $('#detail-thead').innerHTML = `<tr>${cols.map(thCell).join('')}</tr>`;
  $('#detail-tbody').innerHTML = list.length ? list.map((r, i) => {
    const isFl = r.correlationType === '关联返利';
    const st = isFl ? rebateStat(r.rebateCoding) : null;
    const common = commonCells(i + 1, false, r.correlationType).map(v => `<td title="${esc(v)}">${esc(v)}</td>`).join('');
    return `<tr>${common}<td>${esc(r.correlationDate)}</td>
      <td>${isFl ? esc(r.rebateCoding) : '—'}</td><td title="${esc(r.rebateName)}">${isFl ? esc(r.rebateName) : '—'}</td>
      <td>${isFl ? fmt(r.alreadyBillAmount) : '—'}</td><td>${isFl ? fmt(yuan(st.residue)) : '—'}</td>
      <td>${isFl ? '—' : esc(r.daokuanId)}</td><td>${isFl ? '—' : fmt(r.pickedAmount)}</td>
      <td>${fmt(r.theCorrelationAmount)}</td><td>${esc(r.whetherUnlock)}</td>
      <td>${esc(r.unlockReason || '—')}</td><td>${r.status === 1 ? '有效' : r.status === 2 ? '审批中' : '失效'}</td></tr>`;
  }).join('') : `<tr><td class="empty" colspan="${cols.length}">暂无数据</td></tr>`;
}

function renderUnlockTable() {
  const cols = [...commonCols(false), '返利编码', '到款ID', '挑款金额', '关联金额', '是否解锁', '解锁原因'];
  const list = validCorrs(ctx.contract.id);
  $('#detail-thead').innerHTML = `<tr>${cols.map(thCell).join('')}</tr>`;
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
        <th>产品线名称</th><th>核算大类</th><th>返利编码</th><th>返利名称</th><th>已上账金额</th><th>剩余可关联金额</th></tr></thead>
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

/* ---------------- 增补需求：共享到款选择弹框（跨合同关联/跨客户关联/厂商款补/其他款补共用） ----------------
 * 4 类特殊场景本质都是「从共享到款池挑一笔到款关联到当前合同」，只是默认筛选范围不同：
 * 跨合同关联默认按当前合同客户筛，其余 3 类不设默认范围，全局搜。选中后统一写入 ctx.rows，
 * 等保存时按 subType 分流进「审批中」，不在这一步立即生效。 */
let dkdlg = { uid: null, subType: '', query: {}, picked: new Set(), page: 1, pageSize: 10 };

function openDaokuanDialog(subType) {
  dkdlg = {
    subType: subType,
    query: { customer: subType === '跨合同关联' ? ctx.contract.customer : '', daokuanId: '', min: '', max: '' },
    picked: new Set(), page: 1, pageSize: 10
  };
  renderDaokuanDialog();
  const titleMap = { '跨合同关联': '选择共享到款（跨合同关联 · 同客户）', '跨客户关联': '选择共享到款（跨客户关联）',
    '厂商款补': '选择共享到款（厂商款补）', '其他款补': '选择共享到款（其他款补）' };
  showModal(titleMap[subType] || '选择共享到款', [['取消', 'modal-cancel'], ['确定', 'dkdlg-confirm']]);
}

function daokuanCandidates() {
  return D.sharedDaokuan.filter(d => {
    const st = sharedDaokuanStat(d.daokuanId);
    if (st.residue <= 0) return false;
    if (!like(d.customer, dkdlg.query.customer)) return false;
    if (!like(d.daokuanId, dkdlg.query.daokuanId)) return false;
    if (dkdlg.query.min !== '' && st.residue < cents(dkdlg.query.min)) return false;
    if (dkdlg.query.max !== '' && st.residue > cents(dkdlg.query.max)) return false;
    return true;
  });
}

function renderDaokuanDialog() {
  const all = daokuanCandidates();
  const pages = Math.max(1, Math.ceil(all.length / dkdlg.pageSize));
  if (dkdlg.page > pages) dkdlg.page = pages;
  const list = all.slice((dkdlg.page - 1) * dkdlg.pageSize, dkdlg.page * dkdlg.pageSize);
  const allChecked = list.length && list.every(d => dkdlg.picked.has(d.daokuanId));

  $('#modal-body').innerHTML = `
    <div class="dlg-filters">
      <div class="field"><label>客户名称</label><input id="dk-customer" value="${esc(dkdlg.query.customer)}" ${dkdlg.subType === '跨合同关联' ? 'readonly title="跨合同关联固定按当前合同客户筛选，不可修改；要换客户请改用「跨客户关联」"' : ''}></div>
      <div class="field"><label>到款ID</label><input id="dk-id" value="${esc(dkdlg.query.daokuanId)}"></div>
      <div class="field range"><label>剩余可用金额:</label>
        <input id="dk-min" placeholder="请输入最小金额" value="${esc(dkdlg.query.min)}"><span class="sep">-</span>
        <input id="dk-max" placeholder="请输入最大金额" value="${esc(dkdlg.query.max)}"></div>
      <div class="field ck-line"><button class="btn primary" data-act="dkdlg-query">查询</button></div>
    </div>
    <div class="table-wrap dlg-table"><table>
      <thead><tr><th><input type="checkbox" class="dkdlg-check-all" ${allChecked ? 'checked' : ''}></th>
        <th>到款ID</th><th>来源合同号</th><th>客户名称</th><th>挑款总金额</th><th>剩余可用</th></tr></thead>
      <tbody>${list.length ? list.map(d => {
        const st = sharedDaokuanStat(d.daokuanId);
        return `<tr><td><input type="checkbox" class="dkdlg-check" data-id="${esc(d.daokuanId)}" ${dkdlg.picked.has(d.daokuanId) ? 'checked' : ''}></td>
          <td>${esc(d.daokuanId)}</td><td>${esc(d.contractNo)}</td><td>${esc(d.customer)}</td>
          <td>${fmt(d.totalPickedAmount)}</td><td>${fmt(yuan(st.residue))}</td></tr>`;
      }).join('') : '<tr><td class="empty" colspan="6">暂无数据</td></tr>'}</tbody>
    </table></div>
    <div class="pager dlg-pager">
      <span>共 ${all.length} 条</span>
      <select><option>10条/页</option><option>20条/页</option></select>
      <button data-act="dkdlg-page" data-p="${dkdlg.page - 1}" ${dkdlg.page === 1 ? 'disabled' : ''}>‹</button>
      ${Array.from({ length: pages }, (_, i) => i + 1).map(n =>
        `<button class="${n === dkdlg.page ? 'page-on' : ''}" data-act="dkdlg-page" data-p="${n}">${n}</button>`).join('')}
      <button data-act="dkdlg-page" data-p="${dkdlg.page + 1}" ${dkdlg.page === pages ? 'disabled' : ''}>›</button>
      <span>前往</span><input value="${dkdlg.page}" readonly><span>页</span>
    </div>
    <div class="dkdlg-tip">${dkdlg.subType === '跨合同关联'
      ? '客户名称固定为当前合同客户，不可修改，只在同客户范围内挑到款；'
      : dkdlg.subType === '跨客户关联'
      ? '客户名称不设默认值，可按任意客户名称搜索；'
      : '以到款ID为主搜索维度，全局搜索，不限客户不限合同；'}挑款总金额是跨合同共享额度，剩余可用 = 总额 − 全部合同已占用（含审批中）。已选 ${dkdlg.picked.size} 条。</div>`;
}

function syncDkdlgSelection() {
  const boxes = $$('#modal-body .dkdlg-check');
  const all = $('#modal-body .dkdlg-check-all');
  if (all) all.checked = boxes.length > 0 && boxes.every(x => x.checked);
  const tip = $('#modal-body .dkdlg-tip');
  if (tip) tip.textContent = tip.textContent.replace(/已选 \d+ 条。$/, `已选 ${dkdlg.picked.size} 条。`);
}

// variant 为 'tools' 时把面板加宽给演示工具用；仍是带遮罩的居中弹窗，不是全屏页面
function showModal(title, actions, variant) {
  $('#modal-title').textContent = title;
  $('#modal-actions').innerHTML = actions.map(a =>
    `<button class="btn ${a[1] === 'modal-cancel' ? '' : 'primary'}" data-act="${a[1]}">${a[0]}</button>`).join('');
  $('#modal').classList.add('open');
  $('#modal').classList.toggle('tools', variant === 'tools');
  $('#modal').classList.toggle('review', variant === 'review');
  $('#modal').setAttribute('aria-hidden', 'false');
}
function closeModal() {
  $('#modal').classList.remove('open', 'tools', 'review');
  $('#modal').setAttribute('aria-hidden', 'true');
}

/* ---------------- 保存校验（方案 3.2.4.5） ---------------- */
function validateSave() {
  const normal = partitionRows().normal;
  const fl = normal.filter(r => r.correlationType === '关联返利');
  const dk = normal.filter(r => r.correlationType === '关联到款');

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
  // 合同额度校验：普通与特殊到款都计入同一个「预计返利金额」额度
  const all = sumCents(ctx.rows, r => r.theCorrelationAmount);
  if (all > cents(ctx.contract.totalRebate))
    return `本次关联合计 ${fmt(yuan(all))}，大于预计返利金额 ${fmt(ctx.contract.totalRebate)}`;
  return null;
}

// 增补需求：把 ctx.rows 拆成「普通」（关联返利 + 通用关联到款，立即生效）和「特殊」（4 类特殊到款，需走提审）
function partitionRows() {
  const normal = [], special = [];
  ctx.rows.forEach(r => {
    if (r.correlationType === '关联返利') { normal.push(r); return; }
    if (r.correlationType === '关联到款') {
      const isSpecial = addonMode && SPECIAL_DK_SUBTYPES.includes(r.subType);
      (isSpecial ? special : normal).push(r);
      return;
    }
  });
  return { normal: normal, special: special };
}

// 特殊场景校验：关联金额必须 > 0，并校验共享到款池剩余可用
function validateSpecialRows(special) {
  for (let i = 0; i < special.length; i++) {
    const r = special[i];
    if (r.saved) continue;
    if (!amountOk(r.theCorrelationAmount) || cents(r.theCorrelationAmount) <= 0)
      return `${r.subType}：第${i + 1}行关联金额必须大于 0，且最多两位小数`;
  }
  const byDk = {};
  special.filter(r => r.correlationType === '关联到款' && !r.saved).forEach(r => {
    byDk[r.daokuanId] = (byDk[r.daokuanId] || 0) + cents(r.theCorrelationAmount);
  });
  for (const id in byDk) {
    const st = sharedDaokuanStat(id);
    if (byDk[id] > st.residue)
      return `到款ID ${id} 本次关联金额合计 ${fmt(yuan(byDk[id]))}，大于剩余可用金额 ${fmt(yuan(st.residue))}`;
  }
  return null;
}

function doSave() {
  const err = validateSave();
  if (err) { toast(err, 'error'); return; }
  const { normal, special } = partitionRows();
  const err2 = validateSpecialRows(special);
  if (err2) { toast(err2, 'error'); return; }

  const today = new Date().toISOString().slice(0, 10);
  normal.filter(r => r.correlationType === '关联返利' && !r.saved && r.rebateCoding).forEach(r => {
    D.correlations.push({
      id: 'R' + nextUid(), contractId: ctx.contract.id, correlationType: '关联返利', correlationDate: today,
      rebateCoding: r.rebateCoding, rebateName: r.rebateName, alreadyBillAmount: r.alreadyBillAmount,
      theCorrelationAmount: Number(r.theCorrelationAmount), status: 1, whetherUnlock: '否', unlockReason: ''
    });
  });
  normal.filter(r => r.correlationType === '关联到款').forEach(r => {
    const old = validCorrs(ctx.contract.id).find(c => c.correlationType === '关联到款' && (!c.subType || c.subType === '通用关联') && c.daokuanId === r.daokuanId);
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

  const pendingSpecial = special.filter(r => !r.saved);
  // 增补：特殊关联先保存为“待提审”草稿，不立即进入审批；列表可勾选多个合同统一提交凭证/原因
  D.reviewDrafts = D.reviewDrafts.filter(r => r.contractId !== ctx.contract.id);
  pendingSpecial.forEach(r => D.reviewDrafts.push(Object.assign({}, r, {
    draftId: 'D' + nextUid(), contractId: ctx.contract.id, productLine: ctx.contract.productLine,
    customer: ctx.contract.customer, contractNo: ctx.contract.contractNo,
    businessDivision: ctx.contract.businessDivision, accountCate: ctx.contract.accountCate,
    theCorrelationAmount: Number(r.theCorrelationAmount)
  })));
  ctx.rows = buildEditRows(ctx.contract);
  renderDetail();

  if (pendingSpecial.length) {
    toast(`普通关联已保存生效；${pendingSpecial.length} 条特殊关联已暂存，请回列表勾选合同后提交审批`);
    backToList();
    return;
  }

  const remain = contractRebateCents(ctx.contract);
  toast(remain === 0 ? '保存成功，合同剩余返利金额为 0，已移入已关联返利合同'
    : `保存成功，合同剩余返利金额 ${fmt(yuan(remain))}，仍停留在待关联`);
  backToList();
}

/* ---------------- 增补需求：待关联列表批量提交审批 ----------------
 * 用户在待关联列表勾选合同；系统取这些合同下全部“待提审”的特殊关联明细，
 * 自动按「产品线 + 关联类型」分组。每组独立填写原因、维护凭证；凭证按原合同的客户或合同号归属。 */
let reviewState = null;
const reviewGroupKey = r => r.subType;
const reviewRelationLabel = r => r.subType || '关联到款';

function selectedPendingContractIds() {
  return $$('#tbody .row-check:checked').map(x => x.closest('tr')?.dataset.key).filter(Boolean);
}

function openBatchReviewFromList() {
  const ids = selectedPendingContractIds();
  if (!ids.length) { toast('请先勾选需要提交审批的合同', 'error'); return; }
  const rows = D.reviewDrafts.filter(r => ids.includes(r.contractId));
  if (!rows.length) { toast('所选合同无待审批明细', 'error'); return; }
  openReviewModal(rows);
}

function openReviewModal(rows) {
  const groups = {};
  rows.forEach(r => {
    const c = contractById(r.contractId) || {};
    const rel = reviewRelationLabel(r);
    const k = `${c.productLine || r.productLine || '—'}||${rel}`;
    if (!groups[k]) groups[k] = {
      key: k, productLine: c.productLine || r.productLine || '—', relationType: rel,
      rows: [], reason: '', evidences: [], expanded: Object.keys(groups).length === 0,
      scopeType: '客户', scopeValue: '', selectedContracts: []
    };
    groups[k].rows.push(Object.assign({}, r, { contract: c }));
  });
  reviewState = { groups };
  renderReviewModal();
  showModal('批量提交审批', [['取消', 'modal-cancel'], ['全部提交审批', 'submit-review']], 'review');
}

function matchingEvidencesForRow(g, row) {
  const c = row.contract || contractById(row.contractId) || {};
  return g.evidences.filter(e => {
    const values = e.scopeValues || [];
    return e.scopeType === '合同' ? values.includes(c.contractNo) : values.includes(c.customer);
  });
}

function evidenceFilesText(evidences) {
  const list = Array.isArray(evidences) ? evidences : (evidences ? [evidences] : []);
  const files = list.flatMap(e => e.files || []);
  if (!files.length) return '未关联';
  const names = files.map(f => typeof f === 'string' ? f : f.name);
  return names.length === 1 ? names[0] : `${names[0]} 等${names.length}个文件`;
}

function reviewUploadTime() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function reviewScopeValues(g) {
  if (g.scopeType === '客户') return g.scopeValue ? [g.scopeValue] : [];
  return [...(g.selectedContracts || [])];
}

function renderReviewModal() {
  const groups = Object.values(reviewState.groups);
  $('#modal-body').innerHTML = `${groups.map(g => {
    const customers = [...new Set(g.rows.map(r => r.contract?.customer).filter(Boolean))];
    const contracts = [...new Set(g.rows.map(r => r.contract?.contractNo).filter(Boolean))];
    if (!customers.includes(g.scopeValue)) g.scopeValue = customers[0] || '';
    g.selectedContracts = (g.selectedContracts || []).filter(v => contracts.includes(v));
    const missingCount = g.rows.filter(r => !matchingEvidencesForRow(g, r).length).length;
    const evidenceRows = g.evidences.length ? g.evidences.flatMap((e, eidx) => (e.files || []).map((file, fidx) => `<tr>
      <td>${esc(e.scopeType)}</td>
      <td title="${esc((e.scopeValues || []).join('、'))}">${esc((e.scopeValues || []).join('、'))}</td>
      <td title="${esc(file.name || file)}">${esc(file.name || file)}</td>
      <td>${esc(file.uploadedAt || '—')}</td>
      <td><button class="link" data-act="review-view-evidence" data-gkey="${esc(g.key)}" data-eidx="${eidx}" data-fidx="${fidx}">查看</button>
          <button class="link" data-act="review-remove-evidence-file" data-gkey="${esc(g.key)}" data-eidx="${eidx}" data-fidx="${fidx}">删除</button></td>
    </tr>`)).join('')
      : `<tr><td colspan="5" class="empty">暂未上传凭证</td></tr>`;

    const contractPicker = g.scopeType === '合同' ? `<div class="review-contract-dropdown ${g.contractDropdownOpen ? 'open' : ''}">
      <button type="button" class="review-contract-trigger" data-act="review-contract-dropdown" data-gkey="${esc(g.key)}">
        <span>${g.selectedContracts.length ? `已选择 ${g.selectedContracts.length} 个合同` : '请选择合同'}</span><span class="caret">∨</span>
      </button>
      ${g.contractDropdownOpen ? `<div class="review-contract-pop">
        <label class="review-check-all"><input type="checkbox" data-act="review-contract-all" data-gkey="${esc(g.key)}" ${contracts.length && g.selectedContracts.length === contracts.length ? 'checked' : ''}> 全选</label>
        <div class="review-contract-options">${contracts.map(v => `<label><input type="checkbox" data-act="review-contract-item" data-gkey="${esc(g.key)}" value="${esc(v)}" ${g.selectedContracts.includes(v) ? 'checked' : ''}> ${esc(v)}</label>`).join('')}</div>
      </div>` : ''}
    </div>` : `<select data-act="review-scope-value" data-gkey="${esc(g.key)}">
        ${customers.map(v => `<option value="${esc(v)}" ${v === g.scopeValue ? 'selected' : ''}>${esc(v)}</option>`).join('')}
      </select>`;

    const canUpload = g.scopeType === '客户' ? !!g.scopeValue : g.selectedContracts.length > 0;
    return `<div class="review-group ${g.expanded ? 'open' : ''}" data-gkey="${esc(g.key)}">
      <button class="review-group-head" data-act="review-toggle" data-gkey="${esc(g.key)}">
        <span class="review-arrow">${g.expanded ? '▼' : '▶'}</span>
        <b>产品线：${esc(g.productLine)}</b><span class="review-sep">|</span>
        <b>关联类型：${esc(g.relationType)}</b><span class="review-count">（${g.rows.length} 条明细）</span>
      </button>
      ${g.expanded ? `<div class="review-group-body">
        <div class="review-field"><label>原因说明 <b class="req">*</b></label>
          <textarea data-act="review-reason" data-gkey="${esc(g.key)}" placeholder="请输入本产品线 + 关联类型的原因说明">${esc(g.reason)}</textarea></div>

        <div class="review-evidence-head"><b>关联凭证 <span class="req">*</span></b></div>
        <div class="review-evidence-add">
          <select data-act="review-scope-type" data-gkey="${esc(g.key)}">
            <option value="客户" ${g.scopeType === '客户' ? 'selected' : ''}>按客户</option>
            <option value="合同" ${g.scopeType === '合同' ? 'selected' : ''}>按合同</option>
          </select>
          <div class="review-scope-picker">${contractPicker}</div>
          <label class="file-pick-btn ${canUpload ? '' : 'disabled'}">选取文件<input type="file" multiple data-act="review-file-input" data-gkey="${esc(g.key)}" ${canUpload ? '' : 'disabled'}></label>
        </div>
        <div class="table-wrap review-evidence-table"><table>
          <thead><tr><th>凭证归属</th><th>客户 / 合同</th><th>文件</th><th>上传时间</th><th>操作</th></tr></thead>
          <tbody>${evidenceRows}</tbody></table></div>

        <div class="review-evidence-head review-detail-title"><b>审批明细（${g.rows.length} 条）</b></div>
        <div class="table-wrap review-detail-table"><table>
          <thead>
            <tr><th colspan="4">原合同</th><th colspan="3">关联合同</th><th rowspan="2">关联金额</th><th rowspan="2">凭证</th></tr>
            <tr><th>合同号</th><th>合同剩余返利金额</th><th>事业部</th><th>核算大类</th><th>关联跨合同号</th><th>事业部</th><th>核算大类</th></tr>
          </thead><tbody>${g.rows.map(r => {
            const c = r.contract || contractById(r.contractId) || {};
            const linked = r.sourceContractNo ? contractByNo(r.sourceContractNo) : null;
            const evs = matchingEvidencesForRow(g, r);
            return `<tr>
              <td>${esc(c.contractNo || '—')}</td><td>${fmt(yuan(contractRebateCents(c)))}</td><td>${esc(c.businessDivision || '—')}</td><td>${esc(c.accountCate || '—')}</td>
              <td>${esc(r.sourceContractNo || '—')}</td><td>${esc(linked?.businessDivision || '—')}</td><td>${esc(linked?.accountCate || '—')}</td>
              <td>${fmt(r.theCorrelationAmount)}</td><td class="${evs.length ? '' : 'evidence-missing'}">${evs.length ? `<button class="link" data-act="review-view-row-evidence" data-gkey="${esc(g.key)}" data-draftid="${esc(r.draftId || '')}">查看</button>` : '未关联'}</td>
            </tr>`;
          }).join('')}</tbody></table></div>
        ${missingCount ? `<div class="review-warning">还有 ${missingCount} 条明细未关联凭证，请补充后再提交。</div>` : ''}
      </div>` : ''}
    </div>`;
  }).join('')}`;
}

function submitApproval() {
  const groups = Object.values(reviewState.groups);
  const missingReason = groups.find(g => !g.reason.trim());
  if (missingReason) { toast(`「${missingReason.productLine} / ${missingReason.relationType}」还没填写原因说明`, 'error'); return; }
  const missingEvidence = groups.find(g => g.rows.some(r => !matchingEvidencesForRow(g, r).length));
  if (missingEvidence) { toast(`「${missingEvidence.productLine} / ${missingEvidence.relationType}」还有明细未关联凭证`, 'error'); return; }

  const today = new Date().toISOString().slice(0, 10);
  let totalRows = 0;
  const submittedDraftIds = new Set();
  groups.forEach(g => {
    const submissionId = 'SUB' + nextUid();
    g.rows.forEach(r => {
      const evs = matchingEvidencesForRow(g, r);
      const base = {
        id: 'R' + nextUid(), contractId: r.contractId, correlationDate: today, status: 2,
        whetherUnlock: '否', unlockReason: '', submissionId, groupKey: g.key,
        reviewReason: g.reason, evidenceFile: evidenceFilesText(evs), evidenceScopeType: [...new Set(evs.map(e => e.scopeType))].join('、'), evidenceScopeValue: [...new Set(evs.flatMap(e => e.scopeValues || []))].join('、')
      };
      D.correlations.push(Object.assign(base, {
        correlationType: '关联到款', subType: r.subType, daokuanId: r.daokuanId, pickedAmount: r.pickedAmount,
        sourceContractNo: r.sourceContractNo, sourceCustomer: r.sourceCustomer, theCorrelationAmount: Number(r.theCorrelationAmount)
      }));
      if (r.draftId) submittedDraftIds.add(r.draftId);
      totalRows++;
    });
  });
  D.reviewDrafts = D.reviewDrafts.filter(r => !submittedDraftIds.has(r.draftId));
  reviewState = null;
  closeModal();
  renderList();
  toast(`已提交审批，共 ${totalRows} 条记录；审批中金额开始占用合同 / 共享到款额度`);
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
    // 金额精度：批量导入超两位小数四舍五入保留两位，不报错（与编辑页手工填写不同，方案 3.2.2.4）
    if (r.amount === '' || r.amount == null || isNaN(Number(r.amount)) || Number(r.amount) < 0) {
      errors.push(`第 ${line} 行：本次关联金额不允许负数或格式不正确`); return;
    }
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
    parsed.push({ line: line, row: { ...r, amount: round2(r.amount) }, contract: c });
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
  ['flow', '业务流程图'],
  ['quick', '方案快速说明'],
  ['versions', '版本变化'],
  ['links', '相关链接'],
  ['notes', '补充说明']
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
      <p class="prd-p">保存后重算合同剩余返利金额：大于 0 仍停留在待关联，等于 0 移入已关联。已关联需调整时由采购经理按单条记录解锁；外部数据变动导致剩余金额大于 0 时自动回到待关联。</p>
      <h3>预警邮件推送时间轴</h3>${SVG_TIMELINE}
      <p class="prd-p">收件人为产品专员、预计返利运营总、预计返利采购；升级阶段加送事业部总。</p>`;
  }

  if (drawerTab === 'quick') {
    // 方案快速说明：分组维护原型上不容易直接看出的规则；支持分组锚点与表格列宽调整
    const Q = P.quick;
    html = `<p class="prd-p">${esc(Q.intro)}</p>
      <div class="prd-anchor">${Q.sections.map((s, i) =>
        `<button data-anchor="quick-sec-${i}">${esc(s.title)}</button>`).join('')}</div>
      ${Q.sections.map((s, i) => `<section class="prd-sec" id="quick-sec-${i}">
        <h3>${esc(s.title)}</h3>
        ${s.intro ? `<p class="prd-p">${esc(s.intro)}</p>` : ''}
        ${s.type === 'table'
          ? `<div class="prd-table-wrap"><table class="prd-table" data-resizable-table>
               <colgroup>${s.columns.map(() => '<col>').join('')}</colgroup>
               <thead><tr>${s.columns.map((c, col) => `<th><span>${esc(c)}</span><button class="prd-col-resizer" data-col="${col}" aria-label="调整${esc(c)}列宽，使用左右方向键微调" title="拖动调整列宽，方向键微调"></button></th>`).join('')}</tr></thead>
               <tbody>${s.rows.map(r => `<tr>${r.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
             </table></div>`
          : `<ul class="prd-list">${s.rows.map(r => `<li>${esc(r)}</li>`).join('')}</ul>`}
      </section>`).join('')}`;
  }

  if (drawerTab === 'notes') {
    html = `<p class="prd-p">以下内容没有对应界面，原型不呈现，开发按本说明与方案实现。</p>
      ${P.notes.map(n => `<div class="prd-note"><b>${esc(n.title)}</b><p>${esc(n.text)}</p></div>`).join('')}`;
  }

  if (drawerTab === 'versions') {
    html = P.versions.length ? `<div class="ver-legend">
        <span class="tag-type add">新增</span><span class="tag-type mod">修改</span><span class="tag-type del">删除</span>
        <span class="tag-st done">已开发</span><span class="tag-st todo">待开发</span></div>
      ${P.versions.map(v => `<div class="ver-block">
        <div class="ver-head">${esc(v.version)}<span>${esc(v.date)}</span><span>${esc(v.author)}</span></div>
        <ul class="ver-list">${v.items.map(it => `<li>
          <span class="tag-type ${it.type === '新增' ? 'add' : it.type === '删除' ? 'del' : 'mod'}">${esc(it.type)}</span>
          <span class="ver-text">${esc(it.text)}</span>
          <span class="tag-st ${it.status === '已开发' ? 'done' : 'todo'}">${esc(it.status)}</span>
          <span class="ver-by">提出：${esc(it.by)}</span></li>`).join('')}</ul></div>`).join('')}`
      : `<p class="prd-p">本栏记录整体方案的版本变化，暂无记录。</p>`;
  }

  if (drawerTab === 'links') {
    html = `<p class="prd-p">链接维护在 mock-data.js 的 prd.links 中，未填写地址的条目显示为待补充。</p>
      <ul class="link-list">${P.links.map(l => l.url
        ? `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`
        : `<li><span class="muted">${esc(l.label)}（待补充链接）</span></li>`).join('')}</ul>`;
  }
  $('#drawer-body').innerHTML = html;
}

/* -------- 演示数据快照：供「还原演示数据」使用 -------- */
const DEMO_SNAPSHOT = JSON.parse(JSON.stringify({
  contracts: D.contracts, correlations: D.correlations, rebateBase: D.rebateBase, daokuanPicks: D.daokuanPicks
}));
function resetDemoData() {
  Object.keys(DEMO_SNAPSHOT).forEach(k => {
    D[k].length = 0;
    D[k].push(...JSON.parse(JSON.stringify(DEMO_SNAPSHOT[k])));
  });
}

/* -------- 演示工具（顶栏入口，仅开发模式可见；非系统功能） -------- */
function openToolsModal() {
  const contractNos = uniq(D.contracts.filter(c => !c.terminated), 'contractNo');
  const defNo = contractNos.includes('ZZWHF26070219') ? 'ZZWHF26070219' : contractNos[0];
  const opts = arr => arr.map(v => `<option value="${esc(v)}" ${v === defNo ? 'selected' : ''}>${esc(v)}</option>`).join('');
  const subs = pendingSubmissions();

  $('#modal-body').innerHTML = `
    <div class="tool-wrap">
      <p class="tool-notice">以下按钮仅用于评审演示，不是系统功能，开发无需实现。点击后会直接修改当前演示数据，可用「还原演示数据」恢复初始状态。</p>

      <div class="tool-sec">
        <h3>模拟返利变更</h3>
        <div class="tool-grid">
          <p class="tool-help flat">返利 639724 发生调整：该返利ID关联的合同明细行全部失效并释放，受影响合同自动回到待关联。</p>
          <div class="tool-right"><button class="tool-btn" data-sim="rebate">执行</button></div>
        </div>
      </div>

      <div class="tool-sec">
        <h3>模拟挑款金额变化</h3>
        <div class="tool-row">
          <div class="tool-label">新挑款金额</div>
          <input class="tool-input" id="sim-daokuan-amt" placeholder="如 8000；填 0 表示归零">
          <button class="tool-btn" data-sim="daokuan" data-daokuan="12345">到款 12345 变化</button>
          <button class="tool-btn" data-sim="daokuan" data-daokuan="54321">到款 54321 变化</button>
        </div>
        <p class="tool-help">金额可变大、变小或归零（到款系统释放挑款）：仅该到款ID关联的合同明细行失效，同合同的返利关联、以及其他已关联的到款ID明细行不受影响。</p>
      </div>

      <div class="tool-sec">
        <h3>模拟合同变更</h3>
        <div class="tool-row">
          <div class="tool-label">合同号</div>
          <select class="tool-select" id="sim-contract">${opts(contractNos)}</select>
          <button class="tool-btn" data-sim="contract" data-case="keep">不释放</button>
          <button class="tool-btn" data-sim="contract" data-case="release">释放</button>
        </div>
        <p class="tool-help">不释放：预计返利金额增大、基础数据变更；释放：预计返利金额减小、返利行新增或删除（合同终止见下方，同样释放）。</p>
      </div>

      <div class="tool-sec">
        <h3>模拟合同终止</h3>
        <div class="tool-row">
          <div class="tool-label">合同号</div>
          <select class="tool-select" id="sim-term">${opts(contractNos)}</select>
          <button class="tool-btn" data-sim="terminate">执行</button>
        </div>
        <p class="tool-help">释放全部关联，合同对用户不再可见。</p>
      </div>

      <div class="tool-sec">
        <h3>还原演示数据</h3>
        <div class="tool-grid">
          <p class="tool-help flat">把合同、关联记录、返利底表与挑款关系恢复为原型初始数据，用于反复演示。</p>
          <div class="tool-right"><button class="tool-btn" data-sim="reset">还原到初始状态</button></div>
        </div>
      </div>

      <div class="tool-sec">
        <h3>模拟审批（增补需求，2026-09-10）</h3>
        ${subs.length ? `<div class="tool-row">
            <div class="tool-label">待审批分组</div>
            <select class="tool-select" id="sim-submission">${subs.map(s =>
              `<option value="${esc(s.id)}">${esc(s.groupKey)}（${s.rows.length} 条，合计 ${fmt(yuan(sumCents(s.rows, r => r.theCorrelationAmount)))}）</option>`).join('')}</select>
            <button class="tool-btn" data-sim="approve">通过</button>
            <button class="tool-btn" data-sim="reject">驳回</button>
          </div>
          <p class="tool-help">通过：status 由 2（审批中）变为 1（有效），正常计入已关联；驳回：status 变为 0（失效），占用的共享到款额度释放回池子。审批人、审批链由其他平台配置，这里只模拟结果。</p>`
          : `<p class="tool-help flat">当前没有审批中的分组。先在待关联合同编辑页发起一笔跨合同 / 跨客户 / 厂商款补 / 其他款补，保存后按提示提交审批，再回到这里模拟。</p>`}
      </div>
    </div>`;
  // 弹窗（不是全屏）：沿用示例图的分区与控件规格，面板加宽到 1120px，右上角 × 与底部「关闭」都能关闭
  showModal('演示工具（评审演示用，非系统功能）', [['关闭', 'modal-cancel']], 'tools');
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

// 增补需求：按 submissionId 汇总当前所有「审批中」分组，供演示工具模拟通过/驳回
function pendingSubmissions() {
  const map = {};
  D.correlations.filter(c => c.status === 2 && c.submissionId).forEach(c => {
    (map[c.submissionId] = map[c.submissionId] || { id: c.submissionId, groupKey: c.groupKey, rows: [] }).rows.push(c);
  });
  return Object.values(map);
}

const simVal = id => { const el = $('#' + id); return el ? el.value.trim() : ''; };

function simulate(kind, data = {}) {
  if (kind === 'reset') {
    resetDemoData(); closeModal(); ctx = null; renderList();
    toast('演示数据已还原为初始状态');
    return;
  }

  if (kind === 'approve' || kind === 'reject') {
    const id = simVal('sim-submission');
    const list = D.correlations.filter(c => c.submissionId === id && c.status === 2);
    if (!list.length) { toast('请先选择待审批分组', 'error'); return; }
    list.forEach(c => {
      c.status = kind === 'approve' ? 1 : 0;
      if (kind === 'reject') { c.whetherUnlock = '是'; c.unlockReason = '审批驳回'; }
    });
    closeModal(); ctx = null; renderList();
    toast(kind === 'approve'
      ? `已通过 ${list.length} 条记录（${list[0].groupKey}），计入已关联返利明细`
      : `已驳回 ${list.length} 条记录（${list[0].groupKey}），占用的额度已释放回共享池`);
    return;
  }

  if (kind === 'rebate') {
    const list = D.correlations.filter(c => c.status === 1 && c.rebateCoding === '639724');
    if (!list.length) { toast('返利 639724 当前没有有效关联，可先做一笔关联再试', 'error'); return; }
    releaseAndMail(list, '返利数据调整');
  }

  if (kind === 'daokuan') {
    const id = data.daokuan, amount = simVal('sim-daokuan-amt');
    const pick = D.daokuanPicks.find(p => p.daokuanId === id);
    if (!pick) { toast('请先选择到款ID', 'error'); return; }
    if (!amountOk(amount)) { toast('请输入不小于 0 且最多两位小数的挑款金额', 'error'); return; }
    const next = Number(amount);
    const list = D.correlations.filter(c => c.status === 1 && c.daokuanId === id);
    const apply = () => {
      // 同一到款ID可能落在同合同的多个合同行上，挑款金额按到款ID统一更新；金额可变大、变小或归零
      const picks = D.daokuanPicks.filter(p => p.daokuanId === id);
      picks.forEach(p => { p.pickedAmount = next; });
      if (next > 0) {
        [...new Set(picks.map(p => p.contractNo))].forEach(no => {
          const c = D.contracts.find(x => x.contractNo === no);
          if (c) D.correlations.push({
            id: 'R' + nextUid(), contractId: c.id, correlationType: '关联到款',
            correlationDate: new Date().toISOString().slice(0, 10), daokuanId: id,
            pickedAmount: next, theCorrelationAmount: 0, status: 1, whetherUnlock: '否', unlockReason: ''
          });
        });
      }
    };
    if (!list.length) {
      apply(); closeModal(); ctx = null; renderList();
      toast(`到款 ${id} 挑款金额已改为 ${fmt(next)}，当前没有有效关联需要释放`);
      return;
    }
    releaseAndMail(list, '挑款金额变更', apply);
  }
  if (kind === 'contract') {
    const no = simVal('sim-contract');
    const c = D.contracts.find(x => x.contractNo === no);
    if (!c) { toast('请先选择合同号', 'error'); return; }
    const cur = Number(c.totalRebate);

    if (data.case !== 'release') {                   // 不释放：金额增大 / 基础数据变更
      const next = Number((cur * 2).toFixed(2));
      c.totalRebate = next;
      closeModal(); ctx = null; renderList();
      toast(`合同 ${no}：预计返利金额 ${fmt(cur)} → ${fmt(next)}（等同金额增大 / 基础数据变更），按方案不释放已有联`);
      return;
    }

    // 释放：金额减小（等同返利行新增 / 删除）
    const next = Number((cur / 2).toFixed(2));
    const list = validCorrs(c.id);
    if (!list.length) {
      c.totalRebate = next; closeModal(); ctx = null; renderList();
      toast(`合同 ${no}：预计返利金额 ${fmt(cur)} → ${fmt(next)}，当前没有有效关联需要释放`);
      return;
    }
    releaseAndMail(list, '合同变更：预计返利金额变小', () => { c.totalRebate = next; });
  }

  if (kind === 'terminate') {
    const no = simVal('sim-term');
    const c = D.contracts.find(x => x.contractNo === no);
    if (!c) { toast('请先选择合同号', 'error'); return; }
    if (c.terminated) { toast('该合同已终止，可用「还原演示数据」恢复', 'error'); return; }
    const list = validCorrs(c.id);
    if (!list.length) {
      c.terminated = true; closeModal(); ctx = null; renderList();
      toast(`合同 ${no} 已终止，对用户不再可见`);
      return;
    }
    releaseAndMail(list, '合同终止', () => { c.terminated = true; });
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

  if (e.target.closest('#tools-btn')) { openToolsModal(); return; }
  if (e.target.closest('#prd-btn')) { openDrawer(); return; }
  if (e.target.closest('#drawer-close') || e.target.id === 'drawer-mask') { closeDrawer(); return; }
  const dt = e.target.closest('[data-drawer-tab]');
  if (dt) { drawerTab = dt.dataset.drawerTab; renderDrawer(); return; }
  const anchor = e.target.closest('[data-anchor]');
  if (anchor) {                                  // 方案快速说明：分组锚点跳转
    const sec = document.getElementById(anchor.dataset.anchor);
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    $$('#drawer-body [data-anchor]').forEach(b => b.classList.toggle('on', b === anchor));
    return;
  }
  const sim = e.target.closest('[data-sim]');
  if (sim) { simulate(sim.dataset.sim, sim.dataset); return; }

  const subtype = e.target.closest('[data-subtype]');
  if (subtype) { ctx.subType = subtype.dataset.subtype; renderDetail(); return; }

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
    case 'pick-daokuan': openDaokuanDialog(ctx.subType); break;
    case 'dkdlg-query':
      dkdlg.query = { customer: $('#dk-customer').value.trim(), daokuanId: $('#dk-id').value.trim(), min: $('#dk-min').value.trim(), max: $('#dk-max').value.trim() };
      dkdlg.page = 1;
      renderDaokuanDialog();
      break;
    case 'dkdlg-page':
      dkdlg.page = Number(act.dataset.p);
      renderDaokuanDialog();
      break;
    case 'dkdlg-confirm': {
      if (!dkdlg.picked.size) { toast('请先选择到款数据', 'error'); return; }
      [...dkdlg.picked].forEach(id => {
        const d = D.sharedDaokuan.find(x => x.daokuanId === id);
        ctx.rows.push({
          uid: nextUid(), id: '', saved: false, correlationType: '关联到款', subType: dkdlg.subType,
          daokuanId: d.daokuanId, pickedAmount: d.totalPickedAmount,
          sourceContractNo: d.contractNo, sourceCustomer: d.customer, theCorrelationAmount: ''
        });
      });
      closeModal();
      renderDetail();
      break;
    }
    case 'view-source': {
      const c = contractByNo(act.dataset.contractno);
      $('#modal-body').innerHTML = c
        ? `<div class="review-group-body">
             <div class="review-group-row"><label>合同号</label><span>${esc(c.contractNo)}</span></div>
             <div class="review-group-row"><label>客户名称</label><span>${esc(c.customer)}</span></div>
             <div class="review-group-row"><label>事业部</label><span>${esc(c.businessDivision)}</span></div>
             <div class="review-group-row"><label>核算大类</label><span>${esc(c.accountCate)}</span></div>
             <div class="review-group-row"><label>产品线名称</label><span>${esc(c.productLine)}</span></div>
           </div>`
        : `<div class="review-group-body">未查询到合同 ${esc(act.dataset.contractno)} 的信息（原型演示数据未覆盖）。</div>`;
      showModal('来源合同信息', [['关闭', 'modal-cancel']]);
      break;
    }
    case 'submit-review': submitApproval(); break;
    case 'open-batch-review': openBatchReviewFromList(); break;
    case 'batch-menu-toggle': {
      const pop = act.closest('.batch-menu')?.querySelector('.batch-pop');
      if (pop) pop.hidden = !pop.hidden;
      break;
    }
    case 'review-toggle': {
      const g = reviewState.groups[act.dataset.gkey];
      g.expanded = !g.expanded;
      renderReviewModal();
      break;
    }
    case 'review-contract-dropdown': {
      const g = reviewState.groups[act.dataset.gkey];
      g.contractDropdownOpen = !g.contractDropdownOpen;
      renderReviewModal();
      break;
    }
    case 'review-view-row-evidence': {
      const g = reviewState.groups[act.dataset.gkey];
      const row = g?.rows?.find(r => String(r.draftId || '') === String(act.dataset.draftid || ''));
      if (!row) return;
      const evs = matchingEvidencesForRow(g, row);
      const files = evs.flatMap(ev => ev.files || []);
      if (!files.length) { toast('该明细暂未关联凭证', 'error'); return; }
      const names = files.map(f => f.name || f).join('、');
      if (files.length === 1 && files[0].url) window.open(files[0].url, '_blank', 'noopener');
      else toast(`该明细关联凭证：${names}`);
      break;
    }
    case 'review-view-evidence': {
      const g = reviewState.groups[act.dataset.gkey];
      const eidx = Number(act.dataset.eidx), fidx = Number(act.dataset.fidx);
      const file = g?.evidences?.[eidx]?.files?.[fidx];
      if (!file) return;
      if (file.url) window.open(file.url, '_blank', 'noopener');
      else toast(`原型中已记录文件：${file.name || file}`);
      break;
    }
    case 'review-remove-evidence-file': {
      const g = reviewState.groups[act.dataset.gkey];
      const eidx = Number(act.dataset.eidx), fidx = Number(act.dataset.fidx);
      const ev = g?.evidences?.[eidx];
      if (!ev) return;
      const file = ev.files?.[fidx];
      if (file?.url) URL.revokeObjectURL(file.url);
      ev.files.splice(fidx, 1);
      if (!ev.files.length) g.evidences.splice(eidx, 1);
      renderReviewModal();
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
    case 'modal-cancel':
      closeModal();
      if (reviewState) { reviewState = null; toast('已取消本次提交，待审批明细仍保留在待提审状态'); }
      break;
  }
});

document.addEventListener('change', e => {
  if (e.target.id === 'page-size') { pageState[currentPage].size = Number(e.target.value); pageState[currentPage].page = 1; renderList(); return; }
  if (e.target.id === 'role-select') { D.auth.role = e.target.value; ctx = null; applyDevMode(); renderList(); toast(`已切换为${perm().label}`); return; }
  if (e.target.id === 'dev-mode') { devMode = e.target.checked; applyDevMode(); ctx ? renderDetail() : renderList(); return; }
  if (e.target.id === 'addon-mode') {
    addonMode = e.target.checked;
    if (!addonMode && ctx) {                 // 关掉增补后，若当前正停在增补专属的选项上，退回基线默认值
      ctx.subType = '通用关联';
    }
    ctx ? renderDetail() : renderList();
    return;
  }
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
  if (e.target.classList.contains('dkdlg-check')) {
    e.target.checked ? dkdlg.picked.add(e.target.dataset.id) : dkdlg.picked.delete(e.target.dataset.id);
    syncDkdlgSelection();
    return;
  }
  if (e.target.classList.contains('dkdlg-check-all')) {
    const on = e.target.checked;
    $$('#modal-body .dkdlg-check').forEach(x => {
      x.checked = on;
      on ? dkdlg.picked.add(x.dataset.id) : dkdlg.picked.delete(x.dataset.id);
    });
    syncDkdlgSelection();
    return;
  }
  if (e.target.classList.contains('jcno-input')) {
    const row = ctx.rows.find(r => r.uid === e.target.dataset.uid);
    if (row) row.jcNo = e.target.value.trim();
    return;
  }
  if (e.target.dataset.act === 'review-reason') {
    reviewState.groups[e.target.dataset.gkey].reason = e.target.value;
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

// 字段说明浮层：hover 命中的表头文字直接弹出说明，position:fixed 不受表格滚动容器裁切影响
function showHintTip(target) {
  const tip = $('#hint-tip');
  const text = target.dataset.tip;
  if (!tip || !text) return;
  tip.textContent = text;
  tip.hidden = false;
  const r = target.getBoundingClientRect();
  let left = r.left, top = r.bottom + 8;
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  if (left + tw > window.innerWidth - 8) left = window.innerWidth - tw - 8;
  if (top + th > window.innerHeight - 8) top = r.top - th - 8; // 下方放不下就翻到上方
  if (left < 8) left = 8;
  if (top < 8) top = 8;
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
}
function hideHintTip() { const tip = $('#hint-tip'); if (tip) tip.hidden = true; }

document.addEventListener('mouseover', e => {
  const t = e.target.closest && e.target.closest('.th-hint');
  if (t) showHintTip(t);
});
document.addEventListener('mouseout', e => {
  const t = e.target.closest && e.target.closest('.th-hint');
  if (t) hideHintTip();
});
document.addEventListener('scroll', hideHintTip, true);

// 开发模式与角色切换
function applyDevMode() {
  $('#role-select').hidden = !devMode;
  $('#tools-btn').hidden = !devMode;
  document.body.classList.toggle('dev-off', !devMode);
  $('#nav-children').querySelector('[data-page="base"]').hidden = !perm().isAdmin;
  if (currentPage === 'base' && !perm().isAdmin) {
    currentPage = 'pending';
    $$('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.page === 'pending'));
  }
}
$('#role-select').innerHTML = Object.entries(D.roles)
  .map(([k, v]) => `<option value="${k}" ${k === D.auth.role ? 'selected' : ''}>${v.label}</option>`).join('');
applyDevMode();

$('#modal-close').onclick = closeModal;

/* PRD 说明抽屉：默认 880px，可拖动左边缘拉宽、双击恢复默认（表格列多时便于看清文字） */
const DRAWER_MIN_W = 420;
$('#drawer-resizer').addEventListener('mousedown', e => {
  e.preventDefault();
  const startX = e.clientX;
  const wrap = $('#drawer');
  const startW = wrap.getBoundingClientRect().width;
  const maxW = Math.min(1600, (window.innerWidth || 1440) - 24);
  const onMove = ev => {
    const w = Math.min(maxW, Math.max(DRAWER_MIN_W, startW + (startX - ev.clientX)));
    wrap.style.width = w + 'px';
  };
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.body.classList.remove('drawer-resizing');
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  document.body.classList.add('drawer-resizing');
});
$('#drawer-resizer').addEventListener('dblclick', () => { $('#drawer').style.width = ''; });

function preparePrdTable(table) {
  if (table.dataset.columnsSized === 'true') return;
  const widths = [...table.querySelectorAll('thead th')].map(th => Math.max(96, Math.round(th.getBoundingClientRect().width)));
  [...table.querySelectorAll('col')].forEach((col, i) => { col.style.width = widths[i] + 'px'; });
  table.style.width = widths.reduce((sum, width) => sum + width, 0) + 'px';
  table.dataset.columnsSized = 'true';
}

function setPrdColumnWidth(handle, width) {
  const table = handle.closest('[data-resizable-table]');
  if (!table) return;
  preparePrdTable(table);
  const cols = [...table.querySelectorAll('col')];
  const col = cols[Number(handle.dataset.col)];
  if (!col) return;
  col.style.width = Math.max(96, Math.round(width)) + 'px';
  table.style.width = cols.reduce((sum, item) => sum + parseFloat(item.style.width || 96), 0) + 'px';
}

document.addEventListener('mousedown', e => {
  const handle = e.target.closest('.prd-col-resizer');
  if (!handle) return;
  e.preventDefault();
  const startX = e.clientX;
  const startWidth = handle.closest('th').getBoundingClientRect().width;
  const onMove = ev => setPrdColumnWidth(handle, startWidth + ev.clientX - startX);
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.body.classList.remove('column-resizing');
    handle.focus();
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  document.body.classList.add('column-resizing');
});


// 批量审批弹窗：先选归属/对象，再选文件；选中文件后自动加入凭证表
 document.addEventListener('change', e => {
  if (!reviewState) return;
  const act = e.target.dataset.act;
  const g = e.target.dataset.gkey ? reviewState.groups[e.target.dataset.gkey] : null;
  if (!g) return;
  if (act === 'review-scope-type') {
    g.scopeType = e.target.value;
    g.scopeValue = '';
    g.selectedContracts = [];
    renderReviewModal();
  } else if (act === 'review-scope-value') {
    g.scopeValue = e.target.value;
  } else if (act === 'review-contract-all') {
    const contracts = [...new Set(g.rows.map(r => r.contract?.contractNo).filter(Boolean))];
    g.selectedContracts = e.target.checked ? contracts : [];
    renderReviewModal();
  } else if (act === 'review-contract-item') {
    const v = e.target.value;
    const set = new Set(g.selectedContracts || []);
    e.target.checked ? set.add(v) : set.delete(v);
    g.selectedContracts = [...set];
    renderReviewModal();
  } else if (act === 'review-file-input') {
    const scopeValues = reviewScopeValues(g);
    if (!scopeValues.length) { toast('请先选择凭证对应的客户或合同', 'error'); e.target.value = ''; return; }
    const files = [...e.target.files];
    if (!files.length) return;
    const uploadedAt = reviewUploadTime();
    const fileRecords = files.map(f => ({ name: f.name, uploadedAt, url: URL.createObjectURL(f) }));
    const existed = g.evidences.find(ev => ev.scopeType === g.scopeType && JSON.stringify(ev.scopeValues || []) === JSON.stringify(scopeValues));
    if (existed) existed.files.push(...fileRecords);
    else g.evidences.push({ scopeType: g.scopeType, scopeValues: [...scopeValues], files: fileRecords });
    e.target.value = '';
    renderReviewModal();
    toast(`已上传 ${files.length} 个凭证文件`);
  }
});
document.addEventListener('keydown', e => {
  const handle = e.target.closest('.prd-col-resizer');
  if (!handle || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  e.preventDefault();
  const current = handle.closest('th').getBoundingClientRect().width;
  setPrdColumnWidth(handle, current + (e.key === 'ArrowRight' ? 16 : -16));
});
$('#file-input').onchange = e => { if (e.target.files[0]) { importFileName = e.target.files[0].name; importPick = 'ok'; openImportModal(importFileName); e.target.value = ''; } };
$('#user-name').textContent = D.auth.userName;
renderList();
