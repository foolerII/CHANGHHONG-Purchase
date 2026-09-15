# 后端事实摘录

> 来源：`chit-purchase-service`，包路径 `src/main/java/com/chit/rebate`，Mapper 位于 `src/main/resources/mapper/rebate`。
> 本文件与 `refs/` 下其他文件一样为只读摘录，仅记录定位信息和口径结论，不做产品判断。

## 核心表

| 表 | 用途 |
|---|---|
| `waiting_correlation_rebate_view` | 合同行视图，粒度为 合同号 + 核算大类 + 币种 |
| `already_correlation_rebate` | 关联记录，关联返利与关联到款共用一张表，`correlation_type` 区分 |
| `rebate_base_data` | 返利数据底表 |
| `contract_outbound_amount_cache` | 合同出库金额缓存，数仓每日同步 |

## 关键字段

| 字段 | 含义 | 说明 |
|---|---|---|
| `total_rebate` | 预计返利金额 | 合同行级 |
| `the_correlation_amount` | 本次关联金额 / 关联金额 | 两种关联方式共用该字段，字符串存储 |
| `status` | 1 有效 / 0 失效 | 删除、解锁、自动释放、覆盖替换均置 0 |
| `whether_unlock` | 是 / 否 | 解锁标记，与 `status` 各自独立 |
| `picked_amount` | 挑款金额 | 来源 ERP 到款金额 `ZRM_AMOUNT` |
| `verify_amount` | 核销金额 | 同步时与 `picked_amount` 赋同一个值 |
| `rebate_coding` | 返利编码 | 关联返利使用 |
| `daokuan_id` | 到款ID | 关联到款使用 |

## 口径

- 合同剩余返利金额 = `total_rebate` − 同「合同 + 核算大类 + 币种」下 `status = 1` 的 `the_correlation_amount` 合计，两种关联方式合并计算。
- 返利剩余可关联金额 = `already_bill_amount` − 该返利编码被全部合同有效关联的金额之和，含本合同已保存的关联。
- 待关联列表展示条件：`total_rebate > 0`，且有效关联合计 < `total_rebate`，或无关联记录。
  见 `WaitingCorrelationRebateViewMapper.xml` → `selectListFilterByCorrelation` 的 `HAVING` 子句。
- 关联类型列：到款行 `the_correlation_amount` 为 0 或为空时不计入 `the_type`。
  见同文件 `GROUP_CONCAT` 表达式。

## 保存链路

`AlreadyCorrelationRebateServiceImpl`

| 方法 | 作用 |
|---|---|
| `createList` | 保存入口 |
| `validateCorrelationAmount` | 按 合同 + 核算大类 + 币种 分组校验；到款ID 重复拦截 |
| `daokuanIdCheck` | 校验关联金额 ≤ `picked_amount` |
| `validateRebateCodingAmount` | 返利编码额度校验，会扣减库中同维度已关联金额 |
| `unlock` | 手工解锁；到款解锁后按 ERP 最新挑款金额决定是否新增待关联记录 |
| `sendUnlockEmail` | 解锁邮件，仅在解锁前该合同行已关联完成时发送 |

## 导入链路

`WaitingCorrelationRebateViewServiceImpl`

| 方法 | 作用 |
|---|---|
| `importWaitingFl` | 导入入口，任一行失败整批回滚 |
| `validateBasicFields` | 必填、非负、小数位 ≤ 2（超过直接报错，不四舍五入） |
| `checkImportWaitingFl` | 维度校验：返利编码需命中合同行核算大类或产品线之一 |
| `validateRebateCodings` | 文件内按返利编码合并求和后与底表剩余可关联金额比较 |
| `processPaymentImport` | 关联到款按到款ID逐条替换，原记录置失效后新增 |

## 同步与释放

`RebateBaseDataTask` / `RebateBaseDataAsync` / `RebateBaseDataUtils`

| 场景 | 位置 | 处理 |
|---|---|---|
| 返利变更 | `syncRebateBaseData` | 沿关联ID链追溯历史返利ID，历史ID上的关联全部失效 |
| 挑款金额变化 | `syncDaokuai` | 仅该到款ID记录失效；新挑款金额不为 0 时新增关联金额为 0 的记录 |
| 合同变更、合同终止 | `RebateBaseDataAsync` | 通过 `contractOrRebate` 传递 `isUnlock` 标记后调用 `unlockAuto` |
| 预警邮件 | `pushMailRebateExpireOne/Two/Therr` | 三段窗口：到期前 4 周至到期、到期后 0 至 4 周、到期后 4 至 8 周 |

定时频率由调度配置表维护，代码中无硬编码。

## 已提出的实现差异

详见《预计返利闭环管理方案 V1.2》第六章与待办清单，本文件不重复记录。
