# 发布指南 — AOI Workbench

## 一、DeepSeek Harness 插件生态现状（2026-11 核实）

**DSH 官方当前没有「审核制」的插件商店。** 插件分发走 npm 生态，发现渠道靠 GitHub topic。

### 三个真实渠道

| 渠道 | 方式 | 门槛 | 效果 |
|---|---|---|---|
| **GitHub topic** | 仓库加 `dsh-plugin` 标签 | 公开仓库 | 多个市场**自动扫描收录** |
| **npm publish** | `npm publish` | npm 账号 | 市场解锁「一键安装」 |
| **awesome-dsh-plugin** | 提 PR 加一个 YAML | 仓库创建满 1 天 | 人工精选目录 |

> 参考：[上架插件市场完整指南](https://cdn.jsdelivr.net/npm/dsh-document-view@1.1.1/docs/PUBLISHING.md)、[官方插件要求](https://raw.githubusercontent.com/Srien11/dsh-sidecar/f117975a291550a3d0c193f8e7c7174e73b1d68f/docs/research/official-plugin-requirements.md)

### 关于「官方有没有接入说明」

官方 README 里只提了一句：**给仓库加 `dsh-plugin` topic**。完整的市场列表其实来自社区仓库 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) —— 一个插件一个 YAML 文件。

市场（如 dshmarket）每次打开都会拉取 `https://awesome-dsh-plugin.com/plugins.json`。

---

## 二、发布步骤

### 第 1 步：建 GitHub 公开仓库

```bash
cd aoi-dsh-plugin
git init
git add .
git commit -m "feat: AOI Workbench 93.0.0 — Gundam EXIA skins + floating tile"
git branch -M main
git remote add origin https://github.com/<你的用户名>/aoi-dsh-aio.git
git push -u origin main
```

**然后到 GitHub 仓库页 → About → Topics，加上 `dsh-plugin`。**

这是最重要的一步：加上 topic 后，多个市场会自动扫描收录。

### 第 2 步：发布到 npm（解锁一键安装）

```bash
npm login
npm publish --access public
```

包名 `@aoi/dsh-aio` 是 scope 包，需要先 [创建 @aoi 组织](https://www.npmjs.com/org/create)，或者改成无 scope 的名字（如 `dsh-aoi-workbench`）。

### 第 3 步：提交到 awesome-dsh-plugin（可选，人工精选）

1. Fork [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)
2. 新建 `data/plugins/<用户名>__aoi-dsh-aio.yml`：

```yaml
name: "@aoi/dsh-aio"
title: "AOI Workbench"
description: "GUNDAM EXIA 主题皮肤（夜战/昼战/翡翠绿），通过官方 CSS 变量全局生效，不修改官方布局。"
repo: "<用户名>/aoi-dsh-aio"
category: "ui"
npm: "@aoi/dsh-aio"
```

3. 提 PR

**收录要求**（CI 会查）：
- ✅ 仓库 `package.json` 声明了 `dsh.bundle.patch`
- ✅ `cordis.patch.yml` 存在于默认分支
- ✅ 有真实可运行代码
- ✅ 仓库创建满 **1 天**
- ✅ 仓库有 `dsh-plugin` topic
- ✅ `category` 取固定清单里的值（`ui` 对应主题皮肤）

---

## 三、关于「手机和电脑分开连接」

你提到的这个问题，指的是 DSH 的 **desktop（桌面端）和 web（浏览器端）两个 profile**。

### 现在的状况

| profile | 位置 | 用途 |
|---|---|---|
| `desktop` | `~/.dsh/profiles/desktop` | DeepSeek Harness 桌面应用 |
| `web` | `~/.dsh/profiles/web` | 浏览器里跑 `dsh web` |

**两个 profile 的插件需要分别安装**：

```bash
# 桌面端
dsh plugin --profile desktop add <插件>

# Web 端
dsh plugin --profile web add <插件>
```

### 手机访问

DSH 的 Web 端可以在**同一局域网的手机上访问**：

1. 电脑上运行 `dsh web`
2. 记下启动时显示的地址（形如 `http://192.168.x.x:端口`）
3. 手机浏览器打开这个地址

**但插件是装在 profile 里的**，所以手机访问的是电脑上那个 web profile，插件会自动生效。

> 如果你想让手机也能用桌面端的配置，目前官方没有「同步 profile」的机制，需要手动把插件装到 web profile。

---

## 四、插件维护

### 更新皮肤

只需改 `lib/client.js` 的 `SKINS` 数组（见 README），然后：

```bash
# 1. 改 build/p3.js
# 2. 重新构建
node build/build.cjs
# 3. 升版本号
# 4. 重新打包
npm pack
```

### 版本兼容

`package.json` 里声明了 `peerDependencies: { "react": ">=18.2.0" }`，这是官方唯一要求的 peer。

**DSH 仍处于 developer preview**，官方明确警告会有破坏性变更。建议：

```json
"peerDependencies": {
  "@deepseek-ai/dsh": ">=0.2.0 <0.3.0"
}
```

锁定大版本，避免 DSH 升级后插件出问题。

---

## 五、当前插件状态

| 项 | 值 |
|---|---|
| 包名 | `@aoi/dsh-aio` |
| 版本 | 93.0.0 |
| 大小 | 1.2 MB（11 个文件） |
| 许可证 | MIT |
| 皮肤 | 夜战 / 昼战 / 翡翠绿 / 恢复默认 |
| 官方布局修改 | **零** |

打包产物：`aoi-dsh-aio-93.0.0.tgz`
