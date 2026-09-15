/*
 * 预计返利管理原型｜唯一演示数据源
 *
 * 字段名与现有 Vue 页面 / 后端实体保持一致，使用 lowerCamelCase。
 * 数据粒度遵循方案核心口径：合同行 = 合同号 + 核算大类 + 币种。
 * 列表的「合同剩余返利金额」「关联类型」「已关联金额」均由 app.js 实时派生，
 * 不在本文件中写死，避免与关联记录不一致。
 */
window.rebateMockData = {

  /* 合同行：waiting_correlation_rebate_view */
  contracts: [
    {
      id: 'C1', applyDate: '2026-08-09', contractNo: 'LXXAF26080021',
      businessDivision: '大客户事业部', customer: '西安志诚电子有限公司', salerName: '解楠',
      prevIdStr: '合同变更', contractAmount: 2000.00, outboundAmount: 2000.00,
      productLine: 'ThinkSystem产品线', accountCate: 'ThinkSystem-WW',
      totalRebate: 500.00, currency: 'CNY', estimatedRebateTime: '2026-08-31'
    },
    {
      id: 'C2', applyDate: '2026-08-08', contractNo: 'LXXAF26080020',
      businessDivision: '大客户事业部', customer: '西安志诚电子有限公司', salerName: '解楠',
      prevIdStr: '合同变更', contractAmount: 2000.00, outboundAmount: 0,
      productLine: 'ThinkSystem产品线', accountCate: 'ThinkSystem-WW',
      totalRebate: 500.00, currency: 'IDR', estimatedRebateTime: '2026-08-31'
    },
    {
      id: 'C3', applyDate: '2026-07-31', contractNo: 'TXYYSHF2607008',
      businessDivision: '通讯与云解决方案事业部', customer: '上海清渔科技有限公司', salerName: '芦格格',
      prevIdStr: '合同申请', contractAmount: 498.00, outboundAmount: 0,
      productLine: '腾讯云产品线', accountCate: '腾讯云',
      totalRebate: 29.88, currency: 'CNY', estimatedRebateTime: '2026-10-31'
    },
    {
      id: 'C4', applyDate: '2026-07-31', contractNo: 'ZZWHF26030045',
      businessDivision: '增值产品事业部', customer: '武汉吧哒科技股份有限公司', salerName: '童祚国',
      prevIdStr: '合同变更', contractAmount: 251000.00, outboundAmount: 251000.00,
      productLine: '增值产品RD产品线', accountCate: '增值产品RD',
      totalRebate: 9060.00, currency: 'CNY', estimatedRebateTime: '2026-09-15'
    },
    {
      id: 'C5', applyDate: '2026-07-31', contractNo: 'ZZWHF26030045',
      businessDivision: '增值产品事业部', customer: '武汉吧哒科技股份有限公司', salerName: '童祚国',
      prevIdStr: '合同变更', contractAmount: 251000.00, outboundAmount: 251000.00,
      productLine: '增值产品EMC产品线', accountCate: '增值产品EMC',
      totalRebate: 6000.00, currency: 'CNY', estimatedRebateTime: '2026-09-15'
    },
    {
      id: 'C6', applyDate: '2026-07-31', contractNo: 'ZZWHF26070219',
      businessDivision: '增值产品事业部', customer: '武汉融信智达科技有限公司', salerName: '童祚国',
      prevIdStr: '合同申请', contractAmount: 531800.00, outboundAmount: 531800.00,
      productLine: '增值产品ZStack产品线', accountCate: '增值产品ZStack',
      totalRebate: 31908.00, currency: 'CNY', estimatedRebateTime: '2026-08-20'
    },
    {
      id: 'C7', applyDate: '2026-07-28', contractNo: 'ZZSHF25010022',
      businessDivision: '增值产品事业部', customer: '北京纳恩恒泰科技有限公司', salerName: '钱雷珏',
      prevIdStr: '合同申请', contractAmount: 75000.00, outboundAmount: 75000.00,
      productLine: '增值产品EMC产品线', accountCate: '增值产品EMC',
      totalRebate: 4500.00, currency: 'CNY', estimatedRebateTime: '2026-08-05'
    },
    {
      id: 'C8', applyDate: '2026-07-30', contractNo: 'ZZGZF26010057',
      businessDivision: '增值产品事业部', customer: '广州市融久信息技术有限公司', salerName: '尹丽琼',
      prevIdStr: '合同申请', contractAmount: 768200.00, outboundAmount: 768200.00,
      productLine: '增值产品EMC产品线', accountCate: '增值产品EMC',
      totalRebate: 38410.00, currency: 'CNY', estimatedRebateTime: '2026-09-22'
    },
    {
      id: 'C9', applyDate: '2026-07-29', contractNo: 'ZZFZF26010025',
      businessDivision: '增值产品事业部', customer: '福州友合计算机有限公司', salerName: '王世英',
      prevIdStr: '合同申请', contractAmount: 69598.10, outboundAmount: 69598.10,
      productLine: '增值产品EMC产品线', accountCate: '增值产品EMC',
      totalRebate: 2400.00, currency: 'CNY', estimatedRebateTime: '2026-09-18'
    },
    {
      id: 'C10', applyDate: '2026-07-28', contractNo: 'ZZXAF26010003',
      businessDivision: '增值产品事业部', customer: '西安凯旋电子科技发展有限公司', salerName: '王文庆',
      prevIdStr: '合同申请', contractAmount: 150000.00, outboundAmount: 0,
      productLine: '增值产品RD产品线', accountCate: '增值产品RD',
      totalRebate: 2200.00, currency: 'CNY', estimatedRebateTime: '2026-10-08'
    },
    {
      id: 'C11', applyDate: '2026-07-27', contractNo: 'ZZSYF26120218',
      businessDivision: '增值产品事业部', customer: '大连泽远科技有限公司', salerName: '孟祥华',
      prevIdStr: '合同申请', contractAmount: 79846.60, outboundAmount: 79846.60,
      productLine: '增值产品ZStack产品线', accountCate: '增值产品ZStack',
      totalRebate: 2280.00, currency: 'CNY', estimatedRebateTime: '2026-09-26'
    },
    {
      id: 'C12', applyDate: '2026-07-26', contractNo: 'ZZFZF26030030',
      businessDivision: '增值产品事业部', customer: '厦门时代新能源科技有限公司', salerName: '王世英',
      prevIdStr: '合同变更', contractAmount: 37066.71, outboundAmount: 37066.71,
      productLine: '增值产品EMC产品线', accountCate: '增值产品EMC',
      totalRebate: 1860.00, currency: 'CNY', estimatedRebateTime: '2026-08-29'
    },
    {
      id: 'C13', applyDate: '2026-07-25', contractNo: 'ZZSHF26120207',
      businessDivision: '增值产品事业部', customer: '上海连商信息技术有限公司', salerName: '张晓丽',
      prevIdStr: '合同申请', contractAmount: 18208.40, outboundAmount: 18208.40,
      productLine: '增值产品RD产品线', accountCate: '增值产品RD',
      totalRebate: 1740.00, currency: 'CNY', estimatedRebateTime: '2026-09-12'
    },
    {
      id: 'C14', applyDate: '2026-07-24', contractNo: 'ZZGZF26120190',
      businessDivision: '增值产品事业部', customer: '深圳市河汉计算机有限公司', salerName: '肖晨昕',
      prevIdStr: '合同变更', contractAmount: 19000.00, outboundAmount: 0,
      productLine: '增值产品ZStack产品线', accountCate: '增值产品ZStack',
      totalRebate: 660.00, currency: 'CNY', estimatedRebateTime: '2026-10-16'
    },
    {
      id: 'C15', applyDate: '2026-07-23', contractNo: 'ZZCDF26120170',
      businessDivision: '增值产品事业部', customer: '重庆市鸸鹋哨信息技术有限责任公司', salerName: '魏浮E',
      prevIdStr: '合同申请', contractAmount: 40000.00, outboundAmount: 40000.00,
      productLine: '增值产品EMC产品线', accountCate: '增值产品EMC',
      totalRebate: 1500.00, currency: 'CNY', estimatedRebateTime: '2026-08-26'
    },
    {
      id: 'C16', applyDate: '2026-07-22', contractNo: 'ZZNJF26120111',
      businessDivision: '增值产品事业部', customer: '江苏迈步信息技术有限公司', salerName: '程安东',
      prevIdStr: '合同申请', contractAmount: 30758.00, outboundAmount: 30758.00,
      productLine: '增值产品RD产品线', accountCate: '增值产品RD',
      totalRebate: 1600.00, currency: 'CNY', estimatedRebateTime: '2026-09-05'
    },
    {
      id: 'C17', applyDate: '2026-07-21', contractNo: 'LXXBJ26070031',
      businessDivision: '大客户事业部', customer: '北京中科智远科技有限公司', salerName: '解楠',
      prevIdStr: '合同申请', contractAmount: 86000.00, outboundAmount: 86000.00,
      productLine: 'ThinkSystem产品线', accountCate: 'ThinkSystem-SE',
      totalRebate: 3200.00, currency: 'CNY', estimatedRebateTime: '2026-08-28'
    },
    {
      id: 'C18', applyDate: '2026-07-20', contractNo: 'LXXSH26070044',
      businessDivision: '大客户事业部', customer: '上海鼎盛信息系统有限公司', salerName: '解楠',
      prevIdStr: '合同变更', contractAmount: 125000.00, outboundAmount: 0,
      productLine: 'ThinkSystem产品线', accountCate: 'ThinkSystem-WW',
      totalRebate: 4800.00, currency: 'USD', estimatedRebateTime: '2026-10-20'
    },
    {
      id: 'C19', applyDate: '2026-07-19', contractNo: 'TXYYSH26070102',
      businessDivision: '通讯与云解决方案事业部', customer: '沈阳信路商科技有限公司', salerName: '芦格格',
      prevIdStr: '合同申请', contractAmount: 10672.00, outboundAmount: 10672.00,
      productLine: '腾讯云产品线', accountCate: '腾讯云',
      totalRebate: 640.00, currency: 'CNY', estimatedRebateTime: '2026-08-23'
    },
    {
      id: 'C20', applyDate: '2026-07-18', contractNo: 'TXYYGZ26070118',
      businessDivision: '通讯与云解决方案事业部', customer: '上海有为信息技术有限公司', salerName: '芦格格',
      prevIdStr: '合同申请', contractAmount: 6255.00, outboundAmount: 6255.00,
      productLine: '腾讯云产品线', accountCate: '腾讯云',
      totalRebate: 380.00, currency: 'CNY', estimatedRebateTime: '2026-09-08'
    },
    {
      id: 'C21', applyDate: '2026-07-17', contractNo: 'CCWHF26120008',
      businessDivision: '高性能数据方案事业部', customer: '南京佰盛昌光电科技有限公司', salerName: '李嘉利',
      prevIdStr: '合同申请', contractAmount: 1000000.00, outboundAmount: 1000000.00,
      productLine: '增值产品ZStack产品线', accountCate: '增值产品ZStack',
      totalRebate: 26000.00, currency: 'CNY', estimatedRebateTime: '2026-08-19'
    },
    {
      id: 'C22', applyDate: '2026-07-16', contractNo: 'CCWHF26120015',
      businessDivision: '高性能数据方案事业部', customer: '杭州弘毅数据技术有限公司', salerName: '李嘉利',
      prevIdStr: '合同申请', contractAmount: 420000.00, outboundAmount: 0,
      productLine: 'ThinkSystem产品线', accountCate: 'ThinkSystem-SE',
      totalRebate: 12600.00, currency: 'IDR', estimatedRebateTime: '2026-10-25'
    },
    {
      id: 'C23', applyDate: '2026-07-15', contractNo: 'ZZWHF26070217',
      businessDivision: '增值产品事业部', customer: '上海源威电子有限公司', salerName: '方力',
      prevIdStr: '合同申请', contractAmount: 36702.50, outboundAmount: 36702.50,
      productLine: '增值产品RD产品线', accountCate: '增值产品RD',
      totalRebate: 1100.00, currency: 'CNY', estimatedRebateTime: '2026-09-02'
    }
  ],

  /* 关联记录：already_correlation_rebate。status 1=有效 0=失效 */
  correlations: [
    { id: 'R01', contractId: 'C1', correlationType: '关联返利', correlationDate: '2026-08-10', rebateCoding: '629793', rebateName: '2024071900054', alreadyBillAmount: 442038.50, theCorrelationAmount: 33.20, status: 1, whetherUnlock: '否', unlockReason: '' },
    { id: 'R02', contractId: 'C1', correlationType: '关联返利', correlationDate: '2026-08-10', rebateCoding: '629793', rebateName: '2024071900054', alreadyBillAmount: 442038.50, theCorrelationAmount: 33.11, status: 1, whetherUnlock: '否', unlockReason: '' },
    { id: 'R03', contractId: 'C1', correlationType: '关联返利', correlationDate: '2026-08-10', rebateCoding: '629793', rebateName: '2024071900054', alreadyBillAmount: 442038.50, theCorrelationAmount: 33.00, status: 1, whetherUnlock: '否', unlockReason: '' },
    { id: 'R04', contractId: 'C1', correlationType: '关联返利', correlationDate: '2026-08-10', rebateCoding: '629793', rebateName: '2024071900054', alreadyBillAmount: 442038.50, theCorrelationAmount: 200.00, status: 1, whetherUnlock: '否', unlockReason: '' },
    { id: 'R05', contractId: 'C1', correlationType: '关联返利', correlationDate: '2026-08-11', rebateCoding: '639724', rebateName: '2024090500138', alreadyBillAmount: 119856.00, theCorrelationAmount: 100.00, status: 1, whetherUnlock: '否', unlockReason: '' },
    { id: 'R06', contractId: 'C1', correlationType: '关联到款', correlationDate: '2026-08-11', daokuanId: 'DK20260809001', pickedAmount: 400.00, theCorrelationAmount: 100.00, status: 1, whetherUnlock: '否', unlockReason: '' },

    { id: 'R07', contractId: 'C4', correlationType: '关联返利', correlationDate: '2026-08-05', rebateCoding: '765995', rebateName: '2026年3月保单补款返利', alreadyBillAmount: 152750.00, theCorrelationAmount: 4000.00, status: 1, whetherUnlock: '否', unlockReason: '' },

    { id: 'R08', contractId: 'C6', correlationType: '关联返利', correlationDate: '2026-08-12', rebateCoding: '639724', rebateName: '2024090500138', alreadyBillAmount: 119856.00, theCorrelationAmount: 20000.00, status: 1, whetherUnlock: '否', unlockReason: '' },
    { id: 'R09', contractId: 'C6', correlationType: '关联到款', correlationDate: '2026-08-12', daokuanId: 'DK20260812007', pickedAmount: 20000.00, theCorrelationAmount: 11908.00, status: 1, whetherUnlock: '否', unlockReason: '' },

    { id: 'R10', contractId: 'C7', correlationType: '关联返利', correlationDate: '2026-08-01', rebateCoding: '763297', rebateName: '预计返利EMC', alreadyBillAmount: 15000.00, theCorrelationAmount: 4500.00, status: 1, whetherUnlock: '否', unlockReason: '' },
    { id: 'R11', contractId: 'C7', correlationType: '关联返利', correlationDate: '2026-07-20', rebateCoding: '763297', rebateName: '预计返利EMC', alreadyBillAmount: 15000.00, theCorrelationAmount: 1200.00, status: 0, whetherUnlock: '是', unlockReason: '返利数据调整' },
    { id: 'R12', contractId: 'C8', correlationType: '关联返利', correlationDate: '2026-08-02', rebateCoding: '763297', rebateName: '预计返利EMC', alreadyBillAmount: 15000.00, theCorrelationAmount: 9300.00, status: 1, whetherUnlock: '否', unlockReason: '' },
    { id: 'R13', contractId: 'C11', correlationType: '关联返利', correlationDate: '2026-08-03', rebateCoding: '766845', rebateName: 'ZStack季度返利', alreadyBillAmount: 80000.00, theCorrelationAmount: 2280.00, status: 1, whetherUnlock: '否', unlockReason: '' },
    { id: 'R14', contractId: 'C13', correlationType: '关联返利', correlationDate: '2026-08-04', rebateCoding: '765995', rebateName: '2026年3月保单补款返利', alreadyBillAmount: 152750.00, theCorrelationAmount: 900.00, status: 1, whetherUnlock: '否', unlockReason: '' },
    { id: 'R15', contractId: 'C17', correlationType: '关联返利', correlationDate: '2026-08-06', rebateCoding: '639724', rebateName: '2024090500138', alreadyBillAmount: 119856.00, theCorrelationAmount: 3200.00, status: 1, whetherUnlock: '否', unlockReason: '' },
    { id: 'R16', contractId: 'C19', correlationType: '关联返利', correlationDate: '2026-08-07', rebateCoding: '766820', rebateName: '腾讯云经销商奖励', alreadyBillAmount: 40603.16, theCorrelationAmount: 640.00, status: 1, whetherUnlock: '否', unlockReason: '' },
    { id: 'R17', contractId: 'C21', correlationType: '关联到款', correlationDate: '2026-08-08', daokuanId: 'DK20260805021', pickedAmount: 30000.00, theCorrelationAmount: 26000.00, status: 1, whetherUnlock: '否', unlockReason: '' }
  ],

  /* 返利数据底表：rebate_base_data。alreadyCorrelationAmount / residueCorrelationAmount 由 app.js 派生 */
  rebateBase: [
    { generateDate: '2026-07-19', productLine: 'ThinkSystem产品线', accountCate: 'ThinkSystem-WW', rebateCoding: '629793', rebateName: '2024071900054', rebateCashPoolNumber: 'XJC202407190', rebatePoolAmount: 442038.50, cashPoolAmount: 442038.50, alreadyBillAmount: 442038.50 },
    { generateDate: '2026-09-05', productLine: 'ThinkSystem产品线', accountCate: 'ThinkSystem-SE', rebateCoding: '639724', rebateName: '2024090500138', rebateCashPoolNumber: 'XJC202409050', rebatePoolAmount: 119856.00, cashPoolAmount: 119856.00, alreadyBillAmount: 119856.00 },
    { generateDate: '2026-03-18', productLine: '增值产品RD产品线', accountCate: '增值产品RD', rebateCoding: '765995', rebateName: '2026年3月保单补款返利', rebateCashPoolNumber: 'XJC202603180', rebatePoolAmount: 152750.00, cashPoolAmount: 152750.00, alreadyBillAmount: 152750.00 },
    { generateDate: '2026-07-28', productLine: '增值产品EMC产品线', accountCate: '增值产品EMC', rebateCoding: '763297', rebateName: '预计返利EMC', rebateCashPoolNumber: 'XJC202607280', rebatePoolAmount: 15000.00, cashPoolAmount: 15000.00, alreadyBillAmount: 15000.00 },
    { generateDate: '2026-07-22', productLine: '腾讯云产品线', accountCate: '腾讯云', rebateCoding: '766820', rebateName: '腾讯云经销商奖励', rebateCashPoolNumber: 'XJC202607220', rebatePoolAmount: 40603.16, cashPoolAmount: 40603.16, alreadyBillAmount: 40603.16 },
    { generateDate: '2026-07-22', productLine: '增值产品ZStack产品线', accountCate: '增值产品ZStack', rebateCoding: '766845', rebateName: 'ZStack季度返利', rebateCashPoolNumber: 'XJC202607221', rebatePoolAmount: 80000.00, cashPoolAmount: 80000.00, alreadyBillAmount: 80000.00 },
    { generateDate: '2026-07-26', productLine: '增值产品EMC产品线', accountCate: '增值产品EMC-2', rebateCoding: '763304', rebateName: '语音通讯AVAYA返利', rebateCashPoolNumber: 'XJC202607260', rebatePoolAmount: 4000.00, cashPoolAmount: 4000.00, alreadyBillAmount: 4000.00 }
  ],

  /* 到款系统挑款关系：按合同号绑定，编辑页据此自动带出到款行 */
  daokuanPicks: [
    { contractNo: 'LXXAF26080021', daokuanId: 'DK20260809001', pickedAmount: 400.00 },
    { contractNo: 'LXXAF26080021', daokuanId: 'DK20260809002', pickedAmount: 150.00 },
    { contractNo: 'ZZWHF26070219', daokuanId: 'DK20260812007', pickedAmount: 20000.00 },
    { contractNo: 'ZZWHF26030045', daokuanId: 'DK20260801015', pickedAmount: 5000.00 },
    { contractNo: 'CCWHF26120008', daokuanId: 'DK20260805021', pickedAmount: 30000.00 },
    { contractNo: 'ZZGZF26010057', daokuanId: 'DK20260802009', pickedAmount: 40000.00 },
    { contractNo: 'LXXBJ26070031', daokuanId: 'DK20260806003', pickedAmount: 8000.00 }
  ],

  /* 字典 */
  dicts: {
    cmn_currency_code: { CNY: '人民币', IDR: '印尼盾', USD: '美元' }
  },

  /* 当前登录人权限：readWrit 可编辑，read 仅查看；unlockRole 控制解锁入口 */
  /* 当前登录人：角色可在原型顶部切换，用于演示权限差异 */
  auth: { role: 'manager', userName: '张茜彤' },

  /* 批量导入的内置示例数据，字段顺序与导出模板一致 */
  importSamples: {
    ok: {
      label: '示例一：全部合规',
      desc: '把 LXXAF26080021 剩余的 0.69 关联完，并为 ZZWHF26030045 关联一笔到款。导入后前者移入已关联。',
      rows: [
        { contractNo: 'LXXAF26080021', type: '关联返利', rebateCoding: '629793', daokuanId: '', amount: '0.69', accountCate: 'ThinkSystem-WW', currency: 'CNY' },
        { contractNo: 'ZZWHF26030045', type: '关联到款', rebateCoding: '', daokuanId: 'DK20260801015', amount: '3000', accountCate: '增值产品RD', currency: 'CNY' }
      ]
    },
    bad: {
      label: '示例二：逐行校验失败',
      desc: '第 3 行返利编码不存在，第 4 行金额小数位超限。逐行校验不通过时直接整批回滚，不再执行合并校验。',
      rows: [
        { contractNo: 'LXXAF26080021', type: '关联返利', rebateCoding: '629793', daokuanId: '', amount: '0.69', accountCate: 'ThinkSystem-WW', currency: 'CNY' },
        { contractNo: 'TXYYSHF2607008', type: '关联返利', rebateCoding: '620001', daokuanId: '', amount: '10', accountCate: '腾讯云', currency: 'CNY' },
        { contractNo: 'ZZWHF26030045', type: '关联返利', rebateCoding: '765995', daokuanId: '', amount: '33.456', accountCate: '增值产品RD', currency: 'CNY' }
      ]
    },
    merge: {
      label: '示例三：合并校验失败',
      desc: '逐行看都合规：到款 DK20260801015 挑款金额 5000，两行分别 3000 和 2500 均未超。但同属合同 ZZWHF26030045，合计 5500 超出挑款金额，整批回滚。',
      rows: [
        { contractNo: 'ZZWHF26030045', type: '关联到款', rebateCoding: '', daokuanId: 'DK20260801015', amount: '3000', accountCate: '增值产品RD', currency: 'CNY' },
        { contractNo: 'ZZWHF26030045', type: '关联到款', rebateCoding: '', daokuanId: 'DK20260801015', amount: '2500', accountCate: '增值产品EMC', currency: 'CNY' }
      ]
    }
  },

  /* 外挂 PRD 说明：原型无法直接呈现的内容 */
  prd: {
    links: [
      { label: '方案文档（飞书）', url: 'https://xcnripxx1nkp.feishu.cn/docx/HcoDd5eaWoDxjqxIkPGcHEUfnAh' },
      { label: '测试用例（飞书）', url: '' },
      { label: '待办清单与差异', url: '' }
    ],
    notes: [
      { title: '系统间同步', text: '合同来自项目管理平台，返利来自返利池，到款来自到款系统，出库金额由数仓每日推送。定时频率由调度配置表维护，原型不呈现。' },
      { title: '返利变更追溯', text: '返利池不修改记录，任何变更都先删后增并生成新返利ID，新记录的关联ID指向上一条。采购系统沿链追溯，历史ID上的关联全部失效。' },
      { title: '数据迁移', text: '上线时全量迁移项目管理平台该模块数据，金额沿用原系统值不重算，无并行期。' },
      { title: '币种', text: '返利底表无币种字段，系统不校验返利与合同币种是否一致，由业务自行判断。' },
      { title: '并发', text: 'ToB 系统并发低，暂不做并发控制。' }
    ],
    versions: [
      {
        version: 'V1.2', date: '2026-09-14', author: '产品',
        items: [
          { type: '修改', text: '取消「相同合同仅支持一种关联类型」，同一合同可同时关联返利与到款', by: '业务评审', status: '待开发' },
          { type: '修改', text: '关联到款改为按挑款记录自动带出，校验口径统一为挑款金额并按合同合并', by: '业务评审', status: '待开发' },
          { type: '修改', text: '导入金额精度由四舍五入改为超过两位直接报错', by: '后端现状', status: '已开发' },
          { type: '新增', text: '新增第六章「方案与现有实现的差异」，共 12 项待调整实现', by: '产品', status: '待开发' },
          { type: '修改', text: '预警第三阶段窗口由到期后 4–8 周改为 5–7 周', by: '业务评审', status: '待开发' }
        ]
      },
      {
        version: 'V1.1', date: '2026-09-11', author: '产品',
        items: [
          { type: '新增', text: '补充合同状态流转、自动释放规则、手工解锁与释放通知邮件', by: '产品', status: '已开发' },
          { type: '新增', text: '补充已关联返利合同详情与解锁页、已关联返利明细页面规则', by: '产品', status: '已开发' },
          { type: '删除', text: '删除旧版导入模板描述，统一以 3.2.2.4 版本为准', by: '业务评审', status: '已开发' }
        ]
      }
    ]
  },

  /* 角色 → 权限映射，对应方案 3.2.1 / 3.3.1 */
  roles: {
    viewer:  { label: '仅查看（read）',        canEdit: false, canUnlock: false, isAdmin: false },
    editor:  { label: '可编辑（readWrit）',    canEdit: true,  canUnlock: false, isAdmin: false },
    manager: { label: '采购经理',              canEdit: true,  canUnlock: true,  isAdmin: false },
    admin:   { label: '超级管理员',            canEdit: true,  canUnlock: true,  isAdmin: true  }
  }
};
