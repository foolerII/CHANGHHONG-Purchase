# 长虹佳华采购项目｜预计返利管理原型

## 1. 产物说明

- 原型入口：`prototype/index.html`
- 页面样式：`prototype/styles.css`
- 交互逻辑：`prototype/app.js`
- 演示数据：`prototype/mock-data.js`（唯一数据源）
- 品牌素材：`prototype/assets/logo.png`、`prototype/assets/avatar.png`
- 使用方式：双击 `prototype/index.html` 即可在浏览器中打开，无需安装依赖或启动服务。

## 2. 目录约定

`AGENTS.md` 放置 AI 协作规范；`docs/` 包含事实、PRD、状态和变更记录；`refs/` 是从已有代码整理出的只读参考摘录。字段和规则以 `docs/00-facts.md` 为准，后端口径见 `refs/backend.md`。

## 3. 事实来源

| 来源 | 范围 |
|---|---|
| 前端 | `src/views/rebate/**`、`src/api/rebate/*.js`、`src/router/index.js` |
| 后端 | `chit-purchase-service` 的 `com/chit/rebate` 包及 `resources/mapper/rebate` |
| 方案 | 《预计返利闭环管理方案 V1.2》 |

## 4. PRD 说明抽屉

顶部「PRD 说明」按钮打开右侧抽屉，放置原型无法直接呈现的内容：合同状态流转图与预警时间轴、无界面的补充说明、带颜色标记的版本变化记录、演示工具、飞书链接。抽屉内的「演示工具」仅用于评审演示，不是系统功能，开发无需实现。

版本记录、补充说明与链接均维护在 `prototype/mock-data.js` 的 `prd` 字段中。

## 5. 版本管理

项目已初始化为 git 仓库，历史提交随包附带。推送到自有远端：

```bash
git remote add origin <你的仓库地址>
git push -u origin main
```

## 6. 原型覆盖范围

四个列表页：待关联返利合同、已关联返利合同、已关联返利明细、返利数据底表。

两个整页视图：

- 待关联详情 / 编辑：表头切换关联方式、返利选择弹框、增加一行、删除所选、六项保存校验。
- 已关联详情 / 解锁：有效与失效筛选、按单条记录解锁并填写原因。

已实现的演示交互：

- 左侧菜单切换页面并同步面包屑
- 查询、重置、导出反馈
- 批量导入选择文件并展示模板说明与整批失败的逐行错误
- 关联返利多选、关联到款按挑款记录自动带出
- 保存后按合同剩余返利金额提示流转结果
- 解锁后释放金额并回到待关联
- 响应式布局，兼容窄屏查看

## 7. 数据模型

演示数据按后端表结构组织：

| 集合 | 对应 | 说明 |
|---|---|---|
| `contracts` | `waiting_correlation_rebate_view` | 合同行，粒度为合同号 + 核算大类 + 币种 |
| `correlations` | `already_correlation_rebate` | 关联记录，`status` 区分有效与失效 |
| `rebateBase` | `rebate_base_data` | 返利底表 |
| `daokuanPicks` | 到款系统挑款关系 | 编辑页据此自动带出到款行 |

合同剩余返利金额、关联类型、已关联金额、剩余可关联金额均由 `app.js` 实时派生，不在数据文件中写死，避免与关联记录不一致。

## 8. 原型与生产系统边界

本文件夹是产品评审与开发沟通用的高保真前端原型，使用本地模拟数据，不连接后端接口；导入、导出、查询、保存、解锁均以交互反馈模拟。正式开发时应复用现有 API、权限、字典、上传、导出和路由体系。

## 9. 现有接口清单

- `POST /waitingCorrelationRebateView/queryPage`
- `POST /waitingCorrelationRebateView/exportData`
- `POST /waitingCorrelationRebateView/exportWaitingTemplate`
- `POST /waitingCorrelationRebateView/importWaitingFl`
- `POST /waitingCorrelationRebateView/getCurrentNamePermissionsId`
- `POST /alreadyCorrelationRebate/queryPage`
- `POST /alreadyCorrelationRebate/exportData`
- `POST /alreadyCorrelationRebate/queryDetailList`
- `POST /alreadyCorrelationRebate/unlock`
- `POST /alreadyCorrelationRebate/createList`
- `POST /alreadyCorrelationRebate/queryPageRebateDetail`
- `POST /alreadyCorrelationRebate/exportRebateDetailData`
- `POST /rebateBaseData/queryPage`

## 10. 与现有实现的差异

原型按方案 V1.2 呈现目标形态，其中若干校验后端尚未实现（两种关联方式合并校验、挑款额度按合同合并、预警第三阶段窗口等），差异清单见方案第六章与《预计返利闭环管理待办清单》。
