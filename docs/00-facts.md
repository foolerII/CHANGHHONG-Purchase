# 事实清单（从现有代码提取）

> 仅记录已在当前代码中得到证实的信息；本文件是原型字段和业务规则的唯一事实依据。
> 前端来源：`src/views/rebate/**`。后端来源：`chit-purchase-service` 的 `com/chit/rebate` 包，细节见 `refs/backend.md`。

## 页面与路由

| 页面 | 路由 | 源文件 |
|---|---|---|
| 待关联返利合同 | `/rebate/pending` | `pending/index.vue` |
| 待关联返利合同详情/编辑 | `/rebate/pending/detail` | `pending/detail.vue` |
| 已关联返利合同 | `/rebate/linked` | `linked/index.vue` |
| 已关联返利合同详情/解锁 | `/rebate/linked/detail` | `linked/detail.vue` |
| 已关联返利明细 | `/rebate/details` | `details/index.vue` |
| 返利数据底表 | `/rebate/base` | `base/index.vue` |

## 核心口径

| 名称 | 口径 | 证据 |
|---|---|---|
| 数据粒度 | 合同行 = 合同号 + 核算大类 + 币种 | `selectListFilterByCorrelation` 的 `GROUP BY` |
| 合同剩余返利金额 | `total_rebate` − 同合同行下 `status = 1` 的关联金额合计，关联返利与关联到款合并计算 | 同上 SQL 的 `contract_rebate` 表达式 |
| 剩余可关联金额 | `already_bill_amount` − 该返利编码被全部合同有效关联的金额之和（含本合同） | `validateRebateCodingAmount` |
| 挑款金额 | ERP 到款金额 `ZRM_AMOUNT`，同步时写入关联记录 `picked_amount` | `RebateBaseDataTask.syncDaokuai` |
| 有效 / 失效 | `status` 1 有效、0 失效；删除、解锁、自动释放、覆盖替换均置 0 | `processUnlockRecord` |
| 金额精度 | 最多两位小数，超过两位报错，不四舍五入 | `validateBasicFields` |

## 列表事实

### 待关联返利合同

- 展示条件：`total_rebate > 0`，且有效关联金额合计 < `total_rebate`，或无关联记录。
- 行权限：按用户产品线权限过滤。
- 查询条件：`applyDateRange`、`contractNo`、`customer`、`estimatedRebateDateRange`、`accountCate`、`businessDivision`、`salerName`、`outboundAmount`。
- 列表字段：`applyDate`、`contractNo`、`businessDivision`、`customer`、`salerName`、`prevIdStr`、`contractAmount`、`outboundAmount`、`productLine`、`accountCate`、`totalRebate`、`contractRebate`、`currency`、`estimatedRebateTime`、`theType`。
- `theType` 取值：关联返利 / 关联到款 / 关联返利、关联到款。到款行金额为 0 或为空时不计入。
- 操作：导出待关联模板（需先勾选）、批量导入、导出查询结果、查询、重置；行操作为查看详情、编辑。

### 已关联返利合同

- 展示条件：合同剩余返利金额 = 0。已终止合同不展示。
- 查询条件：`applyDateRange`、`contractNo`、`customer`、`accountCate`、`businessDivision`、`salerName`。
- 列表字段：同待关联，不含 `contractRebate`。
- 行操作：查看详情；编辑（即解锁，仅采购经理可见）。

### 已关联返利明细

- 展示条件：`status = 1` 的关联记录，每条一行。失效记录与已终止合同的记录不展示。
- 查询条件：`correlationDateRange`、`contractNo`、`customer`、`accountCate`、`rebateCoding`。
- 列表字段：`correlationDate`、`contractNo`、`outboundAmount`、`businessDivision`、`customer`、`productLine`、`accountCate`、`currency`、`totalRebate`、`correlationType`、`rebateCoding`、`rebateName`、`alreadyBillAmount`、`residueCorrelationAmount`、`daokuanId`、`pickedAmount`、`theCorrelationAmount`。
- 仅支持查看与导出，无编辑操作。

### 返利数据底表

- 仅超级管理员可见。
- 查询条件：`accountCate`、`rebateCoding`、`rebateName`、`generateDateRange`。
- 列表字段：`generateDate`、`productLine`、`accountCate`、`rebateCoding`、`rebateName`、`rebateCashPoolNumber`、`rebatePoolAmount`、`cashPoolAmount`、`alreadyBillAmount`、`alreadyCorrelationAmount`、`residueCorrelationAmount`。

## 编辑页事实

- 关联方式下拉位于表头，取值为关联返利、关联到款。同一合同可同时存在两种关联，可在同一次保存中一并提交。
- 关联返利列：`rebateCoding`（弹框选择）、`rebateName`、`alreadyBillAmount`、`residueCorrelationAmount`、`theCorrelationAmount`。
- 关联到款列：`daokuanId`、`pickedAmount`、`theCorrelationAmount`。到款行由到款系统挑款记录自动带出，每个到款ID一行，用户只填关联金额。
- 关联返利只能新增或删除，已保存记录的金额不可修改；同一合同行下同一返利编码可出现多行。
- 关联到款按到款ID替换：原记录置失效，新增一条本次金额的记录；金额填 0 表示取消关联，不新增。
- 增加一行、删除所选仅在关联返利下展示。
- 返利选择弹框：查询条件为返利编码、返利名称、剩余可关联金额区间；默认按合同行核算大类过滤；勾选「按产品线查询」后去掉核算大类条件改按产品线查询，范围更大；表格首列支持全选与多选，底部带分页。

### 保存校验

| 校验项 | 规则 | 校验端 |
|---|---|---|
| 返利编码 | 关联返利行必须选择返利 | 前端 |
| 本次关联金额 | 关联返利行必填，> 0，最多两位小数 | 前端 |
| 到款ID重复 | 同一「合同 + 核算大类 + 币种 + 到款ID」不允许多行 | 后端 |
| 返利剩余额度 | 同一返利编码本次新增合计 ≤ 剩余可关联金额；已保存行不参与 | 前端 + 后端 |
| 挑款额度 | 同一合同下所有合同行对同一到款ID合计 ≤ 挑款金额 | 后端 |
| 合同额度 | 本次新增返利 + 本次到款 + 已保存有效关联 ≤ 预计返利金额 | 后端 |

返利底表无币种字段，系统不校验币种一致性，由业务自行判断。

## 详情与解锁事实

- 详情页展示该合同行的全部关联记录，右上角提供「有效 / 失效」筛选，默认有效，清空可看全部。
- 解锁由采购经理执行，按单条关联记录选择「是否解锁」，选是时解锁原因必填。
- 解锁后记录置失效并释放金额，合同回到待关联列表，后台记录原因、操作人、操作时间。
- 到款解锁时，ERP 最新挑款金额不为 0 的，会新增一条关联金额为 0 的待关联记录。
- 解锁邮件仅在解锁前该合同行已关联完成时发送。

## 自动释放事实

| 场景 | 处理 | 释放范围 |
|---|---|---|
| 返利变更 | 历史返利ID上的关联失效 | 该返利ID关联的全部合同行 |
| 挑款金额变化 | 原记录失效；新挑款金额不为 0 时新增关联金额为 0 的记录 | 仅该到款ID |
| 合同变更，新金额 ≥ 原金额 | 不释放，仅更新合同信息 | — |
| 合同变更，新金额 < 原金额 | 关联失效 | 该合同下全部关联 |
| 合同行被删除 | 该合同行关联失效并移除 | 该合同行 |
| 合同终止 | 从待关联表删除，释放全部关联，合同对用户不可见 | 该合同全部关联 |

外部数据变动导致合同剩余返利金额 > 0 时，合同自动回到待关联列表，不需要采购经理解锁。

## 预警邮件事实

| 阶段 | 窗口 | 收件人 |
|---|---|---|
| 未到期预警 | 到期前 4 周至到期日 | 产品专员、预计返利运营总、预计返利采购 |
| 已到期未关联预警 | 到期后第 1 至 4 周 | 同上 |
| 升级预警 | 到期后第 5 至 7 周 | 同上 + 事业部总 |

推送条件：合同出库金额 > 0 且合同剩余返利金额 > 0。阶段按预计返利时间实时推算，不累计发送次数。

> 代码现状为第三阶段窗口是到期后第 4 至 8 周，与上表不一致，已记录为待修正项。

## 权限事实

| 状态 | 含义 |
|---|---|
| `read` | 仅查看列表与详情 |
| `readWrit` | 查看、编辑待关联合同 |
| 解锁 | 仅采购经理（`cgjl`），并需配置对应产品线 |

## 已确认接口

| 用途 | 方法与地址 |
|---|---|
| 待关联分页 | `POST /waitingCorrelationRebateView/queryPage` |
| 待关联导出 | `POST /waitingCorrelationRebateView/exportData` |
| 待关联模板 | `POST /waitingCorrelationRebateView/exportWaitingTemplate` |
| 批量导入 | `POST /waitingCorrelationRebateView/importWaitingFl` |
| 已关联分页 | `POST /alreadyCorrelationRebate/queryPage` |
| 已关联详情 | `POST /alreadyCorrelationRebate/queryDetailList` |
| 建立关联 | `POST /alreadyCorrelationRebate/createList` |
| 解锁 | `POST /alreadyCorrelationRebate/unlock` |
| 关联明细分页 | `POST /alreadyCorrelationRebate/queryPageRebateDetail` |
| 返利底表分页 | `POST /rebateBaseData/queryPage` |

## 素材事实

- 左上角品牌图与 `src/assets/images/logo.png` 一致，111×34 PNG。
- 个人中心头像使用 `src/assets/images/avatar.png` 作为本地可打开的等效素材。

## 已废弃

- `correlationType` 的 `关联收款` 分支为历史遗留，方案不再使用，原型不予呈现。
- 「相同合同仅支持一种关联类型」的限制已取消。
