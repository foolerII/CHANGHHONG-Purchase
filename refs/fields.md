# 字段与校验摘录

```text
待关联查询：applyDateRange, contractNo, customer, accountCate,
businessDivision, salerName, outboundAmount, estimatedRebateDateRange

待关联列表：applyDate, contractNo, businessDivision, customer, salerName,
prevIdStr, contractAmount, outboundAmount, productLine, accountCate,
totalRebate, contractRebate, currency, estimatedRebateTime, theType

已关联列表：与待关联一致，不含 contractRebate

关联明细：correlationDate, contractNo, outboundAmount, businessDivision,
customer, productLine, accountCate, currency, totalRebate, correlationType,
rebateCoding, rebateName, alreadyBillAmount, residueCorrelationAmount,
daokuanId, pickedAmount, theCorrelationAmount

返利底表：generateDate, productLine, accountCate, rebateCoding, rebateName,
rebateCashPoolNumber, rebatePoolAmount, cashPoolAmount, alreadyBillAmount,
alreadyCorrelationAmount, residueCorrelationAmount

编辑页关联返利列：rebateCoding, rebateName, alreadyBillAmount,
residueCorrelationAmount, theCorrelationAmount
编辑页关联到款列：daokuanId, pickedAmount, theCorrelationAmount

详情页：whetherUnlock, unlockReason, status
```

前端已确认校验：未选择 `rebateCoding` 时禁止保存；候选返利查询使用 `isNotZeroSurplus: true`；
金额输入组件精度为两位小数。完整保存校验口径见 `backend.md`。
