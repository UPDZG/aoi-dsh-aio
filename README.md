# AOI Workbench

DeepSeek Harness 的主题皮肤插件。安装后右下角出现一枚悬浮瓷片，点开可切换皮肤、管理归档对话。

## 功能

### 主题皮肤（全局生效）

- **GUNDAM EXIA · 夜战** — 深蓝黑装甲 + 眼瞳青 `#3EE4FF`
- **GUNDAM EXIA · 昼战** — 柔和米白 + 高达蓝 `#1878C8`
- **翡翠绿渐变** — 翠绿 → 青绿双色渐变（免费皮肤）
- **恢复官方默认** — 一键还原

皮肤通过官方 CSS 变量（`--dsw-alias-*`）应用，**不修改官方任何布局**。关闭插件后界面立即恢复原样。

### 归档管理

列出已归档的对话，支持批量恢复（调用官方 `workspaces.unarchiveSession`）。

## 安装

### 方式一：本地安装

```bash
dsh plugin --profile desktop add <本包路径或 tgz>
```

### 方式二：插件市场

在 DSH「设置 → 插件」页搜索安装。

装完重启 DSH，右下角出现 AOI 瓷片即成功。

## 使用

1. 点右下角 **AOI 圆形瓷片**
2. 弹出面板有三个页签：**工作台 / 皮肤 / 归档**
3. 点皮肤卡片即可切换，**整个界面立刻生效**
4. 点面板外或按 `Esc` 收起

## 皮肤开发规范

新增皮肤只需在 `lib/client.js` 的 `SKINS` 数组加一项：

```js
{
  id: "my-skin",
  name: "我的皮肤",
  mode: "dark",              // "dark" | "light"
  desc: "一句话说明",
  wallpaper: 'url("data:image/jpeg;base64,...")',  // 可选：壁纸
  gradient: "linear-gradient(135deg, ...)",        // 可选：渐变（与 wallpaper 二选一）
  colors: {
    brand: "#3EE4FF",        // 品牌色（按钮、徽标、发光）
    brand2: "#1899CC",       // 品牌深阶（悬停）
    bgBase: "#060A12",       // 画布底色
    text1: "#E6F7FF",        // 正文
    text2: "#9DC4D8",        // 次要文字
    text3: "#6B8FA3",        // 辅助文字
    border: "rgba(...)",     // 主边框
    border2: "rgba(...)"     // 细边框
  },
  surfaces: {                // 各层不透明度（0-1，越小越透）
    canvas: 0.09,            // 画布（背景图最明显）
    sidebar: 0.20,           // 侧栏
    panel: 0.16,             // 面板
    input: 0.52,             // 输入框（要够实，保证可读）
    bubble: 0.26,            // 消息气泡
    card: 0.30,              // 卡片
    menu: 0.88               // 菜单（浮层要实）
  },
  deco: {                    // 可选：机械装饰
    hexPattern: true,        // 六边形网格
    cutCorners: true,        // 切角
    seamGlow: true,          // 接缝光
    topLine: true            // 顶部发光线
  }
}
```

系统会自动推导：

| 推导项 | 公式 |
|---|---|
| 徽标反色 | `label-primary-inverted = bgBase` |
| 按钮底色 | `brand` + 10-20% 透明度 |
| 弹出面板 | `bgBase` 实心化（0.995） |
| 标题栏按钮 | `sidebar-fill` + `label-primary` |

## 技术说明

### 不修改官方布局

插件只做两件事：
1. 往 `body` 写 CSS 变量（官方 ThemePresenter 自己也用这个通道）
2. 在 `body` 末尾追加浮层元素

**不使用** padding / margin / grid / transform 推挤官方布局。

### 已知限制

- Electron 原生窗口按钮（最小化/最大化/关闭）的颜色由官方 preload 探针同步，插件通过写 `--dsw-specific-sidebar-fill` 和 `--dsw-alias-label-primary` 间接控制。
- 插件面板是浮层，会盖住右下角一小块官方内容（点外面即收起）。

## 许可

MIT
