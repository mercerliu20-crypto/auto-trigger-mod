# Changelog / 更新说明

## 1.5.2 — 2026-10-05

### 中文

- **一个物品绑定多个活动**：Trigger Settings 的单项下拉改为复选列表，可同时绑定多个 Activity，共用原有攻击类型、命中／未命中和自然骰点范围条件。
- **按需选择本次触发**：各活动分别进入统一 Auto-Trigger List，仅执行用户本次勾选的项，依次调用原生 `activity.use()`；各活动独立处理资源与精力消耗。
- **包含 1.5.1 右键兼容修复**：同时支持物品和活动菜单，覆盖特性、法术、武器及自定义武技；活动入口配置所属物品。入口检查编辑权限并去重，空白草稿提示先创建活动。
- **兼容旧配置**：旧 `triggerActivityId` 自动作为单项读取，保存多选时写入 `triggerActivityIds` 并保留首项旧字段；无需迁移或重新设置。清空选择并保存禁用触发，取消保留设置，重复或已删除的活动 ID 安全去重／跳过。
- **发布与安装**：提供 `auto-trigger-mod.zip`、独立 `module.json` 及中英文说明；清单下载地址更新至 v1.5.2。

**升级**：通过 Foundry 模组管理更新，或将 ZIP 内文件解压到 `Data/modules/auto-trigger-mod`；重新加载世界与全部客户端。使用精力武技的 Tidy 自定义页时，精力模组需为 1.0.13 或更新版本，以获得对应右键入口修复。原有单活动绑定继续生效。

**验证范围**：发布前重新运行 18 项逻辑检查、45 项浏览器 fixture 检查并检查 JavaScript 语法，全部通过。参考环境为 dnd5e 5.2.5 / Tidy5e 12.5.4；Foundry 文档、持久化、窗口和 Midi 工作流均有模拟，实际服务器持久化、完整角色卡与多人反应仍需世界内实测。清单原有兼容版本声明保持不变。

### English

- **Multiple Activities per item**: checkbox selection replaces the single-Activity dropdown. Linked Activities share the existing attack-type, hit/miss, and natural d20 filters.
- **Choose follow-up actions per attack**: each linked Activity appears separately in the consolidated checklist. Only checked entries execute, sequentially through native `activity.use()`, with individual resource consumption.
- **Includes the 1.5.1 context-menu fix**: Trigger Settings is available from both item and activity menus for features, spells, weapons, and custom martial arts. Activity entries configure their owning Item; permission checks, duplicate prevention, and empty-draft guidance are included.
- **Backward-compatible configuration**: existing `triggerActivityId` flags work without migration. Saving also writes `triggerActivityIds` while retaining the first ID in the old field. Clearing all selections disables the trigger; cancel preserves settings; duplicate or deleted IDs are safely ignored.
- **Release packaging**: includes an installable ZIP, standalone manifest, bilingual documentation, and the v1.5.2 download URL.

**Upgrade**: update in Foundry's module manager or extract the ZIP into `Data/modules/auto-trigger-mod`, then reload the world and every client. The custom Stamina & Martial Arts Tidy tab needs version 1.0.13 or newer for its corresponding context-menu fix. Existing single-Activity bindings continue to work.

**Validation**: 18 logic checks, 45 browser fixture checks, and JavaScript syntax checks passed again before release. Reference fixtures use dnd5e 5.2.5 / Tidy5e 12.5.4. Foundry documents, persistence, windows, and Midi workflows are simulated; live server persistence, full sheets, and multiplayer reactions remain unverified. Existing manifest compatibility declarations are retained.

## 1.5.1 — 本地补丁 / Local patch, included in 1.5.2

- 同时接入物品和活动菜单钩子，活动入口配置所属物品；支持可编辑角色内的特性、法术、武器与自定义武技。
- 空白活动草稿显示入口并提示先配置活动，菜单项去重，保留原有筛选、确认及原生执行流程。
- Added Trigger Settings to item and activity context menus while preserving the original filters, confirmation, and native execution flow.
