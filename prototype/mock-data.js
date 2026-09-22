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
    { id: 'R17', contractId: 'C21', correlationType: '关联到款', correlationDate: '2026-08-08', daokuanId: 'DK20260805021', pickedAmount: 30000.00, theCorrelationAmount: 26000.00, status: 1, whetherUnlock: '否', unlockReason: '' },
    { id: 'R18', contractId: 'C4', correlationType: '关联到款', correlationDate: '2026-08-10', daokuanId: '12345', pickedAmount: 5000.00, theCorrelationAmount: 3000.00, status: 1, whetherUnlock: '否', unlockReason: '' }
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

  /* 到款系统挑款关系：按合同号绑定，编辑页据此自动带出到款行（通用关联到款场景，同合同强绑定，不受增补需求影响） */
  daokuanPicks: [
    { contractNo: 'LXXAF26080021', daokuanId: 'DK20260809001', pickedAmount: 400.00 },
    { contractNo: 'LXXAF26080021', daokuanId: 'DK20260809002', pickedAmount: 150.00 },
    { contractNo: 'ZZWHF26070219', daokuanId: 'DK20260812007', pickedAmount: 20000.00 },
    { contractNo: 'ZZWHF26030045', daokuanId: 'DK20260801015', pickedAmount: 5000.00 },
    { contractNo: 'CCWHF26120008', daokuanId: 'DK20260805021', pickedAmount: 30000.00 },
    { contractNo: 'ZZGZF26010057', daokuanId: 'DK20260802009', pickedAmount: 40000.00 },
    { contractNo: 'LXXBJ26070031', daokuanId: 'DK20260806003', pickedAmount: 8000.00 },
    /* 演示用挑款：同一到款ID落在两个合同上，用于演示挑款金额变化与跨合同行合并校验 */
    { contractNo: 'TXYYSHF2607008', daokuanId: '12345', pickedAmount: 20.00 },
    { contractNo: 'ZZWHF26030045', daokuanId: '12345', pickedAmount: 5000.00 },
    { contractNo: 'TXYYSHF2607008', daokuanId: '54321', pickedAmount: 9.88 },
    { contractNo: 'ZZWHF26030045', daokuanId: '54321', pickedAmount: 2000.00 }
  ],

  /* ============ 以下为「返利关联场景系统优化」增补需求的演示数据（2026-09-10 会议纪要 + 运营总确认邮件） ============ */

  /* 共享到款池：供 关联到款 的 4 类特殊场景（跨合同/跨客户/厂商款补/其他款补）使用。
   * 挑款总金额是跨合同共享额度，不像 daokuanPicks 那样跟单个合同强绑定——
   * 谁先关联谁先占用（口径与返利编码「剩余可关联金额」一致），已用金额由 D.correlations 里
   * subType 命中这 4 类特殊场景的有效/审批中记录实时汇总，见 app.js sharedDaokuanStat()。
   * contractNo/customer 是这笔到款「原本」挂靠的合同和客户，用于编辑页「来源合同信息」展示与筛选。 */
  sharedDaokuan: [
    { daokuanId: 'YWDK20260901001', contractNo: 'LXXAF26080020', customer: '西安志诚电子有限公司', totalPickedAmount: 300.00 },
    { daokuanId: 'YWDK20260901002', contractNo: 'ZZSHF25010022', customer: '北京纳恩恒泰科技有限公司', totalPickedAmount: 1200.00 },
    { daokuanId: 'CBDK20260901003', contractNo: 'ZZGZF26010057', customer: '广州市融久信息技术有限公司', totalPickedAmount: 5000.00 },
    { daokuanId: 'QTDK20260901004', contractNo: 'ZZFZF26010025', customer: '福州友合计算机有限公司', totalPickedAmount: 2000.00 }
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
      desc: '把 LXXAF26080021 剩余的 0.69 关联完（金额填 0.694，批量导入按四舍五入取 0.69，不报错），并为 ZZWHF26030045 关联一笔到款。导入后前者移入已关联。',
      rows: [
        { contractNo: 'LXXAF26080021', type: '关联返利', rebateCoding: '629793', daokuanId: '', amount: '0.694', accountCate: 'ThinkSystem-WW', currency: 'CNY' },
        { contractNo: 'ZZWHF26030045', type: '关联到款', rebateCoding: '', daokuanId: 'DK20260801015', amount: '3000', accountCate: '增值产品RD', currency: 'CNY' }
      ]
    },
    bad: {
      label: '示例二：逐行校验失败',
      desc: '第 3 行返利编码不存在，第 4 行金额为负数。逐行校验不通过时直接整批回滚，不再执行合并校验。',
      rows: [
        { contractNo: 'LXXAF26080021', type: '关联返利', rebateCoding: '629793', daokuanId: '', amount: '0.69', accountCate: 'ThinkSystem-WW', currency: 'CNY' },
        { contractNo: 'TXYYSHF2607008', type: '关联返利', rebateCoding: '620001', daokuanId: '', amount: '10', accountCate: '腾讯云', currency: 'CNY' },
        { contractNo: 'ZZWHF26030045', type: '关联返利', rebateCoding: '765995', daokuanId: '', amount: '-5', accountCate: '增值产品RD', currency: 'CNY' }
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
      { label: '方案文档（飞书）', url: 'https://xcnripxx1nkp.feishu.cn/docx/L0rHd0s2UoBX8VxJNYMcQHdXnVb' },
      { label: '测试用例（飞书）', url: 'https://xcnripxx1nkp.feishu.cn/wiki/HO64wYLpmiH7IukGPdWc5x90nzc?sheet=70f6b7' },
      { label: '待办清单与差异', url: 'https://xcnripxx1nkp.feishu.cn/wiki/TkuHwZQi7iPDbykJ6tIcZftUnYb' }
    ],
    /* 方案快速说明：原型画面上不容易直接看出的业务规则，按分组维护 */
    quick: {
      intro: '本页集中说明原型画面上不容易直接看出的业务规则。原型画面上已有的内容不重复罗列；校验顺序与实现方式由开发评估，本页只列需要覆盖的场景。',
      sections: [
        {
          id: 'save', title: '保存校验（编辑页点「保存」）', type: 'table',
          intro: '本组只列需要校验的场景，共六项，任一不通过整单不保存；已保存的关联返利行金额不可修改，仅支持删除，同一合同行下同一返利编码可存在多行。',
          columns: ['校验项', '规则', '失败提示'],
          rows: [
            ['返利编码', '关联返利行必须先选择返利', '关联返利：第N行请先选择返利信息'],
            ['本次关联金额', '关联返利行必填且大于 0；关联到款行 = 0 表示未关联，或失效历史关联金额；两者均最多两位小数', '关联返利：第N行本次关联金额必须大于 0，且最多两位小数'],
            ['到款ID重复', '同一「合同 + 核算大类 + 币种」下同一到款ID不允许多行', '同一合同、核算大类、币种下到款ID重复：xxx'],
            ['返利剩余额度', '同一返利编码本次新增金额合计 ≤ 剩余可关联金额，已保存行不参与', '返利编码 xxx 本次关联金额合计 A，大于剩余可关联金额 B'],
            ['挑款额度', '同一合同下（跨合同行）对同一到款ID的关联金额合计 ≤ 挑款金额', '到款ID xxx 在本合同下关联金额合计 A，大于挑款金额 B'],
            ['合同额度', '本次新增返利 + 本次到款 + 已保存有效关联 ≤ 预计返利金额', '关联返利与关联到款合计 A，大于预计返利金额 B']
          ]
        },
        {
          id: 'import', title: '批量导入校验', type: 'list',
          intro: '模板字段顺序：合同号、关联方式、返利编码、关联到款ID、本次关联金额、核算大类、币种；首行为填写说明，数据从第 2 行开始。只列校验场景，校验先后由开发评估。现状与原型一致的行为：任一行不通过则整批回滚、不再执行合并校验，错误提示定位到具体行号。',
          rows: [
            '逐行校验一：合同号 + 核算大类 + 币种 的组合必须存在。',
            '逐行校验二：关联方式只能是「关联返利」或「关联到款」。',
            '逐行校验三：本次关联金额不允许负数；超过两位小数时四舍五入保留两位（与编辑页手工填写「超两位直接报错」不同，以方案文档为准）。',
            '逐行校验四：关联返利必须能在返利底表查到返利编码，且与合同行的核算大类或产品线至少一项一致。',
            '逐行校验五：关联到款必须填写该合同号下已挑款的到款ID。',
            '合并校验一：同一返利编码的关联金额合计 ≤ 剩余可关联金额。',
            '合并校验二：同一「合同 + 到款ID」的关联金额合计 ≤ 挑款金额（跨合同行合并）。',
            '合并校验三：同一合同行的（本次金额 + 已保存的有效返利关联）≤ 预计返利金额。',
            '关联返利为新增记录；关联到款按到款ID逐条替换，未出现在文件中的到款ID不做处理，= 0 表示未关联，或失效历史关联金额。'
          ]
        },
        {
          id: 'unlock', title: '解锁规则（已关联合同调整）', type: 'list',
          intro: '已关联状态下的调整只能靠解锁释放金额，解锁后合同回到待关联重新关联。',
          rows: [
            '入口：已关联返利合同列表行操作「编辑」，仅采购经理可见，且需要配置对应产品线的权限。',
            '校验：至少勾选一条「是否解锁 = 是」的记录，且被勾选记录必须填写解锁原因。',
            '结果：所选记录置为失效并释放金额，合同剩余返利金额大于 0 时回到待关联列表；后台记录解锁原因、操作人、操作时间。',
            '到款解锁：若到款系统最新挑款金额不为 0，同时新增一条关联金额为 0 的待关联到款记录。',
            '解锁邮件：保存后即发送释放通知邮件，复用 3.5.1 模板与收件人，「释放原因」为用户填写的解锁原因，无论解锁前合同是否已关联完成都发送。'
          ]
        },
        {
          id: 'perm', title: '权限矩阵', type: 'table',
          intro: '行权限统一按产品线控制；read / readWrit 由权限标识控制，解锁仅采购经理（cgjl），超级管理员不含解锁权限；返利数据底表仅超级管理员可见。「导出查询结果」对 read 开放已纳入当前方案；现有代码里 read 只保证查看列表与详情，开发落地前需核对这一差异。',
          columns: ['能力', 'read 仅查看', 'readWrit 可编辑', '采购经理', '超级管理员'],
          rows: [
            ['查看列表与详情', '支持', '支持', '支持', '支持'],
            ['导出查询结果', '支持', '支持', '支持', '支持'],
            ['编辑待关联合同并保存', '不支持', '支持', '支持', '支持'],
            ['导出待关联模板 / 批量导入', '不支持', '支持', '支持', '支持'],
            ['已关联列表行操作「编辑」（解锁）', '不支持', '不支持', '支持', '不支持'],
            ['返利数据底表菜单', '不支持', '不支持', '不支持', '支持'],
            ['查看审批状态 / 审批记录', '支持', '支持', '支持', '支持']
          ]
        },
        {
          id: 'scope', title: '列表展示条件', type: 'table',
          intro: '合同状态由「合同剩余返利金额」实时推导：大于 0 停留在待关联，等于 0 移入已关联；外部数据变动导致剩余金额大于 0 时自动回到待关联，不需要解锁。增补需求生效后另有例外：合同下只要还挂着 status=2（审批中）的记录，哪怕算出来剩余为 0，也继续停留在待关联，不移入已关联，等审批全部走完（通过或驳回）再重新判断。',
          columns: ['列表 / 页面', '展示条件', '补充说明'],
          rows: [
            ['待关联返利合同', '合同剩余返利金额 > 0', '按产品线权限过滤；已终止合同不展示'],
            ['已关联返利合同', '合同剩余返利金额 = 0', '已终止合同不展示；行操作「编辑」即解锁入口'],
            ['已关联返利明细', '关联记录 status = 1 或 2（有效 + 审批中），一条记录一行，审批中的记录带状态标注', '失效记录与已终止合同的记录不展示；仅查看与导出，无编辑'],
            ['返利数据底表', '仅超级管理员可见', '按产品线权限过滤'],
            ['合同详情', '该合同行的全部关联记录', '默认只显示有效记录，可切换失效 / 全部']
          ]
        },
        {
          id: 'derive', title: '关键字段计算口径', type: 'table',
          intro: '以下字段的计算口径如下：保存关联、解锁、自动释放等任一操作发生后都要重新计算；是否落库、具体实现方式由开发自行判断。',
          columns: ['字段', '算法口径'],
          rows: [
            ['合同剩余返利金额', '预计返利金额 − 同合同行下 status = 1 或 2（有效 + 审批中）的关联金额合计（关联返利 / 关联到款）；增补需求生效后，审批中金额也要扣减，见「关联方式扩展」组'],
            ['剩余可关联金额', '返利底表已上账金额 − 该返利编码被全部合同有效关联的金额之和（含本合同）；新增返利时默认 = 已上账金额'],
            ['已关联金额', '该返利编码当前有效（status = 1）关联金额合计；新增返利时默认 = 0'],
            ['关联类型', '有效记录中出现关联返利则展示「关联返利」；出现关联到款且金额大于 0 才展示「关联到款」，金额为 0 或空不计入']
          ]
        },
        {
          id: 'amount', title: '金额与精度', type: 'list',
          rows: [
            '金额一律按「分」做整数运算后再展示，禁止直接对小数做加减，避免浮点误差。',
            '手工填写场景（编辑页、解锁页）：最多两位小数，超过两位直接报错，不做四舍五入。',
            '批量导入场景例外：超过两位小数时四舍五入保留两位，不报错（见「批量导入校验」组）。',
            '返利底表没有币种字段，系统不校验返利与合同币种是否一致，由业务自行判断。',
            '删除、解锁、自动释放、覆盖替换均把原记录置为失效（status = 0），不物理删除，保留可追溯记录。'
          ]
        },
        {
          id: 'warning', title: '预警规则', type: 'table',
          intro: '原型没有预警页面，这一组只有现状事实：推送条件为合同出库金额大于 0 且合同剩余返利金额大于 0，阶段按预计返利时间实时推算、不累计发送次数；推送频率见「业务流程图」页签的时间轴。现有代码的第三阶段窗口是到期后第 4–8 周，与本表不符，已记录为待修正项。',
          columns: ['阶段', '窗口', '收件人', '频率'],
          rows: [
            ['未到期预警', '到期前 4 周 至 到期日', '产品专员、预计返利运营总、预计返利采购', '每周 1 次'],
            ['已到期未关联预警', '到期后第 1–4 周', '产品专员、预计返利运营总、预计返利采购', '每周 1 次'],
            ['升级预警', '到期后第 5–7 周', '上述收件人 + 事业部总', '每周 1 次'],
            ['停止推送', '到期后第 8 周起', '不再推送', '—']
          ]
        },
        {
          id: 'trace', title: '返利变更追溯', type: 'table',
          intro: '返利池系统不修改已有记录：金额或名称任意变更都先删除原记录、再新增记录并生成新返利ID，新记录的「关联ID」指向上一条返利ID。采购系统按时间范围同步上次同步以来新增、变更、失效的数据，沿关联ID链追溯到历史返利ID，按下表分类处理；名称变更同样按「更新」处理，原关联无法迁移到新ID，业务需重新关联。',
          columns: ['类型', '场景', '采购系统处理'],
          rows: [
            ['新增', '新产生的返利，无关联ID', '新增返利ID，已关联金额 = 0，剩余可关联金额 = 已上账金额'],
            ['更新', '返利金额或名称等字段变更，返利池生成新返利ID', '新增新返利ID；删除关联ID链上的历史返利ID；历史返利ID关联的合同全部失效并释放金额，发送释放通知邮件，受影响合同自动回到待关联，无需采购经理解锁'],
            ['失效', '返利作废，返利池生成负数记录', '新增新返利ID且上账金额置 0；删除历史返利ID；历史返利ID关联的合同全部失效并释放金额，发送释放通知邮件，受影响合同自动回到待关联，无需采购经理解锁']
          ]
        },
        {
          id: 'addon', title: '关联方式扩展（增补需求，2026-09-10 会议纪要）', type: 'table',
          intro: '本组内容仅在顶栏「场景优化（增补）」开关打开时生效，关掉即为改动前的基线方案。范围：返利主流程不变，仅在「关联到款」下新增 4 类特殊场景；4 类特殊场景需要走审批，原有关联返利、通用关联到款不受影响、不走审批。',
          columns: ['规则项', '内容'],
          rows: [
            ['结构', '「关联方式」保留：关联返利 / 关联到款；「关联到款」下二级「关联类型」：通用关联（默认）/ 跨合同关联（同客户）/ 跨客户关联 / 厂商款补 / 其他款补'],
            ['数据来源', '4 类特殊到款场景数据仍来自到款系统，但改为跨合同共享的到款池（见「共享到款额度」）'],
            ['弹窗交互', '跨合同关联默认按「客户名称=当前合同客户」筛选到款池，跨客户不设默认筛选；厂商款补 / 其他款补以到款ID为主搜索维度，全局搜索，不先选合同；4 类共用同一个到款池，仅筛选方式不同'],
            ['共享到款额度', '挑款总金额是跨合同共享的池子，口径与返利编码「剩余可关联金额」一致：已用金额 = 全部合同对该到款ID的有效（status=1）+ 审批中（status=2）关联金额之和，谁先关联谁先占用'],
            ['来源合同信息', '4 类特殊到款行需展示「来源合同号」，做成表格固定列（吸附右侧，不随横向滚动移出视口），点击可查看来源合同的客户名称等信息'],
            ['关联原因与凭证', '关联原因、上传凭证均不在编辑页填写，统一挪到保存后的分组提审页面：按「产品线 + 二级关联类型」分组，一组填一次原因、传一次凭证；凭证为 zip 包，按压缩包内文件夹层级（一级=合同号，二级=合同号-到款ID）自动绑定到对应记录'],
            ['保存拆分两条路径', '编辑页点「保存」：关联返利 + 通用关联到款按原逻辑立即生效；4 类特殊到款先保存为待提审明细，返回待关联返利合同列表后勾选合同，点击「提交审批」，系统按产品线 + 关联类型自动拆分，填写原因并上传凭证后统一提交审批'],
            ['审批中状态', '关联记录新增 status=2（审批中），介于有效（1）与失效（0）之间：占用共享到款额度；计入「合同剩余返利金额」的扣减；合同即使算出来剩余为 0，只要还有审批中记录也停留在待关联列表，不移入已关联；已关联返利明细展示时一并显示，但带「审批中」状态标注'],
            ['审批结果', '通过：status 由 2 变为 1，正常留在已关联明细，标注消失；驳回：status 由 2 变为 0，占用的到款额度释放回池子，记录不再展示（与现有失效记录规则一致）'],
            ['权限', '发起特殊场景关联不设额外门槛，复用「编辑待关联合同并保存」现有权限；新增「查看审批状态/审批记录」一行，四个角色均支持；审批人/审批链角色由其他平台配置，本原型只提供提审入口与页面，不做审批人列表']
          ]
        }
      ]
    },
    /* 补充说明：没有对应界面的内容 */
    notes: [
      { title: '系统间同步', text: '合同来自项目管理平台，返利来自返利池，到款来自到款系统，出库金额来自数仓。上述均为采购系统主动调用，定时频率由调度配置表维护，原型不呈现。' },
      { title: '数据迁移', text: '上线时全量迁移项目管理平台该模块数据，金额沿用原系统值不重算，无并行期。' },
      { title: '币种', text: '返利底表无币种字段，系统不校验返利与合同币种是否一致，由业务自行判断。' }
    ],
    /* 本栏记录整体方案的版本变化，暂清空；原型自身的改动见 git 提交与 docs/CHANGELOG.md */
    versions: []
  },

  /* 角色 → 权限映射，对应方案 3.2.1 / 3.3.1 */
  roles: {
    viewer:  { label: '仅查看（read）',        canEdit: false, canUnlock: false, isAdmin: false },
    editor:  { label: '可编辑（readWrit）',    canEdit: true,  canUnlock: false, isAdmin: false },
    manager: { label: '采购经理',              canEdit: true,  canUnlock: true,  isAdmin: false },
    admin:   { label: '超级管理员',            canEdit: true,  canUnlock: false, isAdmin: true  }
  }
};
