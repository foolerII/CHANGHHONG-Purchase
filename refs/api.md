# 接口摘录

```text
POST /waitingCorrelationRebateView/queryPage
POST /waitingCorrelationRebateView/exportData
POST /waitingCorrelationRebateView/exportWaitingTemplate
POST /waitingCorrelationRebateView/importWaitingFl
POST /alreadyCorrelationRebate/queryPage
POST /alreadyCorrelationRebate/queryDetailList
POST /alreadyCorrelationRebate/createList
POST /alreadyCorrelationRebate/unlock
POST /alreadyCorrelationRebate/queryPageRebateDetail
POST /rebateBaseData/queryPage
```

来源：`src/api/rebate/*.js`。上述接口在现有代码中均以 POST + `data` 调用。
