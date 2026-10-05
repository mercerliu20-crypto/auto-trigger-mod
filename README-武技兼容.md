# Auto Trigger 与精力武技兼容修复

发布版本：Auto Trigger 1.5.2；配合 Stamina & Martial Arts 1.0.13。发布日期：2026-10-05。

## 一个物品绑定多个活动

打开 Trigger Settings，保留原来的攻击类型、命中/未命中及骰点范围设置，在 Linked Activities 中勾选一个或多个活动并保存。一个物品的这些活动共用上述触发条件。

符合条件的攻击完成时，原来的 Auto-Trigger List 会把各个已绑定活动分别列出，仍由你勾选本次想执行的活动。确认后按清单顺序逐个施展；每个武技活动分别使用原生精力消耗，不把多个活动合并成一次免费施展。取消或不勾选不会执行。

旧版 `triggerActivityId` 配置自动读为单项，无须重新设置。保存后写入 `triggerActivityIds` 数组，并保留首项在 `triggerActivityId`，兼顾读取旧字段的宏。多选数组存在时以它为准；删除的活动跳过，重复 ID 去重。清空所有勾选并保存可禁用，取消面板保留现有设置。

## 为什么法术页面有，特性或武技入口没有

原版只监听 `dnd5e.getItemContextOptions`。dnd5e 5.2.5 与 Tidy 12.5.4 的活动行菜单使用另外的 `dnd5e.getItemActivityContext(activity, target, options)` 钩子。因此原版无法向特性等页面的活动菜单加入 Trigger Settings。

此外，原版要求 `activities.size > 0` 才加入入口，空白武技草稿没有入口；Stamina 1.0.12 及更早的 Tidy 自定义武技行还缺少原生菜单识别标记，必须同步至 1.0.13。

## 当前行为

- 同时接入物品与活动菜单。活动菜单的设置写回 `activity.item`，与物品菜单打开的是同一个配置面板。
- 支持特性、法术、武器及自定义武技，不依靠物品类型白名单或旧 `isOwned` 属性判断。
- 物品须属于角色、当前用户有编辑权限，并支持活动数据。空白草稿能看到菜单项，点击时提示先创建活动；不会直接施展或扣精力。
- 一个菜单只添加一个 Trigger Settings。打开后会复核物品编辑权限。
- 保存沿用 `flags.auto-trigger-mod.all`，取消保留原设置，清空所有活动勾选清除此项设置。其他 flags 保留。
- 实际触发仍调用所选活动的 `activity.use()`。武技继续经过精力模组的流派前提与原生资源消耗，不额外由 Auto Trigger 计算精力。
- 命中、攻击类型、d20区间筛选及触发提示逻辑沿用原实现。本次没有全面重写 Auto Trigger 的 Midi 流程，仍需在实际世界检查反应及多人流程。

## 更新到服务器

1. 在 Foundry 模组管理中更新，或下载 [1.5.2 安装包](https://github.com/mercerliu20-crypto/auto-trigger-mod/releases/download/v1.5.2/auto-trigger-mod.zip)，将包内文件解压至服务器 `Data/modules/auto-trigger-mod`。清单安装地址：[module.json](https://raw.githubusercontent.com/mercerliu20-crypto/auto-trigger-mod/main/module.json)。
2. 确认服务器 Stamina 模组为 1.0.13，并具有更新后的 `templates/tidy-split-view.hbs`。从1.0.12更新还应同步 `src/tidy-ui.js` 和 `module.json`；更旧版本按其更新说明一起同步运行文件。
3. 重新加载世界和全部客户端，再重开角色卡。
4. 特性页分别右键物品行和活动行；武技页右键武技名称/行；法术页检查原入口仍可用。菜单出现后选择 Trigger Settings。
5. 勾选两个活动，保存、重开面板并刷新页面，确认选择保持；进行一次匹配攻击，确认两活动分别出现。只勾选一项时只执行一项，两项都执行时分别消耗；清空绑定后不再提示此物品。

安装包包含运行文件与说明文档，不包含 tests/ 或 Git 数据；无需向服务器上传测试文件。更新说明见 [CHANGELOG.md](CHANGELOG.md) 与 [GitHub Release](https://github.com/mercerliu20-crypto/auto-trigger-mod/releases/tag/v1.5.2)。

## 本地验证与边界

运行：

```powershell
node auto-trigger-mod/tests/compat.test.mjs
$env:SMA_CHROME='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
node stamina-martial-arts/tests/tidy.browser.mjs
```

18项逻辑检查：物品/活动菜单、四类物品、空白草稿、权限、菜单去重、设置保存/取消/禁用、原头部入口，以及旧单项兼容、多选保存、单项/多项执行、删除/重复活动、原有条件筛选、跨物品统一清单、无Midi后备入口、各武技活动分别扣费及不足/流派不符时不扣费。

45项浏览器检查：包含原有39项、PC/NPC × Classic/Quadrone四组联合加载检查，以及两种Tidy布局的实际多选勾选、保存回调、重开、取消、清空与触发时单项选择。使用本地Tidy 12.5.4实际物品/活动菜单源码与两个模组的运行代码，验证菜单到所属物品、配置面板打开与flags保存；保持原来的SP编辑、拖拽、布局与菜单操作回归。

2026-10-05 发布前重新运行上面的18+45项，共63项通过，并检查 `main.js` 语法。浏览器套件需要相邻的精力模组、dnd5e 与 Tidy 参考文件，具体依赖见 [tests/README.md](tests/README.md)。Foundry文档、数据库、菜单渲染器及Midi工作流环境为模拟；未连接实际世界，线上持久化、完整Svelte和多人反应需要实测。
