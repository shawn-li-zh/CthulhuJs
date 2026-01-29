
# CthulhuJs 🐙

**CthulhuJs** 是一个强大的浏览器指纹混淆与伪装框架。它通过 Hook 浏览器底层 API，对各类硬件和软件指纹进行定制化修改或随机化处理，旨在保护用户隐私、绕过反爬虫检测或用于自动化测试环境。

[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-Install_Extension-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/CthulhuJs%20%28Anti-Fingerprint%29/pmcpffnpjncfplinfnjebjoonbncnjfl?utm_source=ext_app_menu)

## ✨ 核心特性 (Features)

CthulhuJs 提供了全方位的浏览器环境模拟与指纹混淆能力，涵盖了从底层渲染到上层交互的各个维度。

### 🎨 图形与渲染 (Graphics & Rendering)
*   **Canvas Fingerprint**: 动态干扰 `HTMLCanvasElement` 和 `CanvasRenderingContext2D` 的导出数据（toDataURL/getImageData），并在视觉上保持不可见差异。
*   **WebGL & WebGPU**: 混淆 GPU 渲染器信息（Vendor/Renderer）、参数及 WebGL 上下文，支持最新的 WebGPU 指纹保护。
*   **DOM Rects (ClientRects)**: 对 `getBoundingClientRect` 和 `getClientRects` 进行微小的数值扰动，对抗几何测量指纹。
*   **Fonts Metrics**: 混淆系统字体列表及字体渲染测量的宽度/高度，防止基于字体枚举的追踪。
*   **Screen & Window**: 自定义屏幕分辨率、色深 (Color Depth)、设备像素比 (DPR) 及窗口尺寸。
*   **CSS Media**: 伪造 `matchMedia` 查询结果（如深色模式、高对比度等）。

### 🔊 媒体与网络 (Media & Network)
*   **Audio Context**: 干扰音频处理管道（DynamicsCompressor/Oscillator），修改音频指纹哈希。
*   **WebRTC**: 拦截 WebRTC 连接，处理 IP 泄露问题，伪造或隐藏候选设备 (ICE Candidates)。
*   **Voice/Speech**: 针对 `SpeechSynthesis` 和 `SpeechRecognition` API 的指纹进行处理。

### 🛡️ 核心对抗与防护 (Evasion & Protection)
*   **Native Masquerading (Native 伪装)**: **核心功能**。基于 Proxy 劫持，确保所有被 Hook 的函数具备和正常native函数相同的特征。
*   **Object Trace & Hijack**: 对敏感对象进行访问拦截与跟踪，可以检测当对象触发某些条件时，进行拦截处理。
*   **Iframe Injection**: 递归注入机制，自动识别并处理动态创建的 Iframe，确保子框架环境指纹与主框架一致。
*   **Worker Interception**: 拦截并处理 `Web Worker` 之间的通讯，确保 Worker 线程内的指纹同步。

### 🆔 身份与环境 (Identity & Environment)
*   **Navigator**: 深度定制 UserAgent、Platform、HardwareConcurrency、DeviceMemory、Languages 等基础属性。
*   **Plugins & MimeTypes**: 伪造 `navigator.plugins` 和 `navigator.mimeTypes` 列表，支持自定义插件数据。
*   **Geolocation**: 模拟地理位置 API，支持自定义经纬度坐标。
*   **Date & Timezone**: 伪造系统时区偏移量及 `Date` 对象行为，使其与目标地理位置一致。

### 🤖 行为模拟与自动化对抗 (Behavior & Automation)
*   **Human Like (拟人化)**:
  *   **Event Trust**: 修复自动化脚本触发事件的 `isTrusted` 属性。
  *   **WebDriver Hiding**: 移除或伪造 `navigator.webdriver` 属性。
  *   **Visibility**: 模拟正常的页面可见性状态 (Page Visibility API)。
*   **Driver Evasion (驱动隐藏)** ⚠️ *Experimental*:
  *   尝试隐藏 Selenium/Puppeteer/Playwright 留下的底层驱动特征（如 CDC_ 变量）。
  *   *注：此功能尚不成熟，可能导致部分环境不稳定，建议慎用。*
*   **Feature Alignment (版本特征对齐)** ⚠️ *Experimental*:
  *   尝试根据 UserAgent 的版本自动调整浏览器支持的 API 特征（Blink/Gecko 特性差异）。
  *   *注：建议开启 `Safe Mode` (安全模式) 时忽略此功能，以免产生逻辑冲突。*

## 🛠 开发与编译

### 环境要求
* Node.js (推荐 v14+)
* npm

### 安装依赖
```bash
npm install
```

### 编译构建
项目提供了开发模式和生产模式的构建命令。编译后的文件将生成在 `public/dev` 或 `public/build` 目录下。

```bash
# 开发模式 (生成未压缩代码，便于调试)
npm run "script dev"

# 生产模式 (生成压缩混淆代码)
npm run "script build"
```

### 编译产物说明
| 文件名 | 描述 |
| :--- | :--- |
| `window.js` | **核心引擎**。提供 `SCOPE_CHEATER` 对象，负责接收配置并执行指纹注入。 |
| `generator.js` | **配置生成器**。提供 `generateBrowser` 函数，用于根据 UserAgent 或 Seed 生成指纹配置对象。 |
| `randomTest.js` | **全自动测试脚本**。集成了生成与注入逻辑，直接运行即可随机修改当前环境指纹。 |

## 🚀 使用指南 / 注入方式

**⚠️ 核心原则：** 脚本必须在 **网页加载之前 (Document Start)** 执行。
如果使用 Puppeteer/Playwright，请使用 `page.evaluateOnNewDocument`；如果使用 Chrome 扩展，请在 `content_script` 的 `run_at: document_start` 阶段注入。

### 方式一：快速随机指纹 (推荐测试用)
直接将 `randomTest.js` 注入浏览器，脚本会自动生成随机指纹并应用。

```javascript
// Puppeteer 示例
const fs = require('fs');
const randomTestScript = fs.readFileSync('./public/build/randomTest.js', 'utf8');

await page.evaluateOnNewDocument(randomTestScript);
```

### 方式二：使用生成器定制指纹
此方法允许你控制指纹的一致性（通过 Seed）或指定特定的 UserAgent。

1. **注入生成器** (`generator.js`)。
2. **生成配置**：调用 `BROWSER_GENERATOR`。
3. **注入引擎** (`window.js`)。
4. **应用配置**：调用 `SCOPE_CHEATER.run()`。

```javascript
// 伪代码流程
const generatorCode = fs.readFileSync('./public/build/generator.js', 'utf8');
const windowCode = fs.readFileSync('./public/build/window.js', 'utf8');

await page.evaluateOnNewDocument((gen, win) => {
    // 1. 执行生成器代码
    eval(gen); 
    
    // 2. 生成指纹配置 (支持指定 UA, seed, 安全模式等)
    const config = self.BROWSER_GENERATOR({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
        seed: 123456, // 相同的 seed 生成相同的指纹
        safeMode: true
    });

    // 3. 执行核心引擎代码
    eval(win);

    // 4. 将配置传递给全局变量
    self.SCOPE_BROWSER = config;

    // 5. 启动指纹干扰
    self.SCOPE_CHEATER.run();

}, generatorCode, windowCode);
```

### 方式三：完全自定义参数
如果你已有现成的指纹库（Json 数据），可以跳过生成器，直接注入 `window.js` 并赋值。

```javascript
const windowCode = fs.readFileSync('./public/build/window.js', 'utf8');
const myFingerprintData = { ... }; // 符合 generator 输出结构的 JSON 对象

await page.evaluateOnNewDocument((code, data) => {
    eval(code); // 注入 window.js
    self.SCOPE_BROWSER = data; // 赋值
    self.SCOPE_CHEATER.run(); // 运行
}, windowCode, myFingerprintData);
```

## 📂 项目结构

```text
CthulhuJs/
├── src/
│   ├── cheaters/          # 🎭 [核心] 各类指纹干扰模块
│   │   ├── audioCheater.js
│   │   ├── canvasCheater.js
│   │   ├── navigatorCheater.js
│   │   └── ... (更多模块)
│   ├── generate/            # 🎲 参数生成逻辑与指纹库
│   │   ├── devices.json     #    - 真实设备 UserAgent 与屏幕数据数据库
│   │   ├── webglInfos.json  #    - 真实 WebGL 渲染器/供应商数据数据库
│   │   ├── types.js         #    - 类型定义
│   │   └── index.js         #    - 生成器逻辑入口
│   ├── jsons/               # 🗃️ 浏览器引擎特征库 (用于版本特征对齐)
│   │   ├── blink.features.json
│   │   └── gecko.features.json
│   ├── kits/                # 🛠️ 通用工具箱
│   │   ├── objects.js       #    - 对象操作工具
│   │   ├── proxy.js         #    - 核心 Proxy 劫持与 Native 伪装逻辑
│   │   └── utils.js         #    - 通用辅助函数
│   ├── browserFill.js       # 🧩 浏览器环境参数补齐
│   ├── const.js             # 📌 常量定义
│   ├── generator.js         # ⚙️ [编译入口] 指纹配置生成器 (导出 generateBrowser)
│   ├── randomTest.js        # 🧪 [编译入口] 随机指纹测试脚本 (开箱即用)
│   ├── window.js            # 🚪 [编译入口] 主窗口注入脚本 (Window Scope)
│   └── worker.js            # 👷 [编译入口] Worker 线程注入脚本 (Worker Scope)
├── public/                  # 📦 (GitIgnored) 编译输出目录 (dev/build)
├── webpack.config.js        # 🏗️ Webpack 构建配置
├── babel.config.js          # 🧬 Babel 转译配置
├── type.d.ts                # 📝 浏览器环境参数 TypeScript 类型声明
└── package.json             # 📦 项目依赖与脚本配置
```
## ⚖️ 免责声明 (Disclaimer)

本项目 (**CthulhuJs**) 仅供**安全研究、学术交流及防御性测试**使用。
* 开发者不对任何因使用本项目而导致的法律后果或服务中断负责。
* 请勿将本项目用于任何非法用途（如恶意攻击、欺诈、绕过合法访问控制等）。
* 使用本项目即代表你同意遵守相关法律法规。

## 📄 License

MIT License.
