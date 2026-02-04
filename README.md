
# CthulhuJs 🐙

[简体中文](README.zh.md) | English

**CthulhuJs** is a powerful framework for browser fingerprint obfuscation and masquerading. By hooking low-level browser APIs, it allows for customized modification or randomization of various hardware and software fingerprints. It is designed to protect user privacy, bypass anti-bot detections, or be used in automated testing environments.

### 📦 Extension Link
[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-Install_Extension-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/CthulhuJs%20%28Anti-Fingerprint%29/pmcpffnpjncfplinfnjebjoonbncnjfl?utm_source=ext_app_menu)

## ✨ Core Features

CthulhuJs provides comprehensive browser environment simulation and fingerprint obfuscation, covering dimensions from low-level rendering to high-level interaction.

### 🎨 Graphics & Rendering
*   **Canvas Fingerprinting**: Dynamically interferes with `HTMLCanvasElement` and `CanvasRenderingContext2D` data (toDataURL/getImageData) while maintaining visual consistency.
*   **WebGL & WebGPU**: Obfuscates GPU renderer info (Vendor/Renderer), parameters, and WebGL context. Supports the latest WebGPU fingerprint protection.
*   **DOM Rects (ClientRects)**: Introduces micro-perturbations to `getBoundingClientRect` and `getClientRects` to counter geometric measurement fingerprinting.
*   **Font Metrics**: Obfuscates the system font list and measurement results (width/height) of font rendering to prevent tracking via font enumeration.
*   **Screen & Window**: Customizes screen resolution, color depth, Device Pixel Ratio (DPR), and window dimensions.
*   **CSS Media**: Spoofs `matchMedia` query results (e.g., dark mode, high contrast).

### 🔊 Media & Network
*   **Audio Context**: Interferes with the audio processing pipeline (DynamicsCompressor/Oscillator) and modifies the audio fingerprint hash.
*   **WebRTC**: Intercepts WebRTC connections to prevent IP leaks and spoofs or hides ICE Candidates.
*   **Voice/Speech**: Handles fingerprints related to the `SpeechSynthesis` API.

### 🛡️ Evasion & Protection
*   **Native Masquerading**: **Core Feature**. Based on Proxy hijacking, it ensures that all hooked functions possess the same characteristics as native functions.
*   **Object Trace & Hijack**: Intercepts and tracks access to sensitive objects, allowing for custom logic when specific conditions are triggered.
*   **Iframe Injection**: Recursive injection mechanism that automatically identifies and handles dynamically created Iframes, ensuring fingerprint consistency between subframes and the main frame.
*   **Worker Interception**: Intercepts and handles communication within `Web Workers` to ensure fingerprint synchronization in worker threads.

### 🆔 Identity & Environment
*   **Navigator**: Deeply customizes `UserAgent`, `Platform`, `HardwareConcurrency`, `DeviceMemory`, `Languages`, and other basic attributes.
*   **Plugins & MimeTypes**: Spoofs `navigator.plugins` and `navigator.mimeTypes` with support for custom plugin data.
*   **Geolocation**: Simulates Geolocation APIs with custom latitude and longitude coordinates.
*   **Date & Timezone**: Spoofs system timezone offset and `Date` object behavior to align with the target geographic location.

### 🤖 Behavior & Automation Evasion
- **Human-Like Behavior**:
  - **Event Trust**: Fixes the `isTrusted` property for events triggered by automation scripts.
  - **WebDriver Hiding**: Removes or spoofs the `navigator.webdriver` property.
  - **Visibility**: Simulates normal page visibility states (Page Visibility API).
- **Driver Evasion** ⚠️ *Experimental*:
  - Attempts to hide low-level driver traces (e.g., `CDC_` variables) left by Selenium, Puppeteer, or Playwright.
  - *Note: This feature is experimental and may cause instability in some environments.*
- **Feature Alignment** ⚠️ *Experimental*:
  - Automatically adjusts browser API features (Blink/Gecko differences) based on the UserAgent version.
  - *Note: It is recommended to ignore this when `Safe Mode` is enabled to avoid logic conflicts.*

## 🛠 Development & Build

### Requirements
* Node.js (v14+ recommended)
* npm

### Installation
```bash
npm install
```

### Build
The project provides build commands for development and production. Compiled files will be generated in `public/dev` or `public/build`.

```bash
# Development Mode (uncompressed code for debugging)
npm run "script dev"

# Production Mode (compressed and obfuscated code)
npm run "script build"
```

### Build Artifacts
| Filename | Description |
| :--- | :--- |
| `window.js` | **Core Engine**. Provides the `SCOPE_CHEATER` object responsible for receiving configuration and executing injection. |
| `generator.js` | **Config Generator**. Provides the `generateBrowser` function to generate config objects based on UserAgent or Seed. |
| `randomTest.js` | **Auto-test Script**. Integrates generation and injection logic for quick randomization of the current environment. |

## 🚀 Usage Guide / Injection Methods

**⚠️ Core Principle:** Scripts must be executed **before the webpage loads (Document Start)**.
If using Puppeteer/Playwright, use `page.evaluateOnNewDocument`. If using a Chrome Extension, inject at the `run_at: document_start` stage in `content_scripts`.

### Method 1: Quick Random Fingerprint (Recommended for Testing)
Inject `randomTest.js` directly. The script will automatically generate and apply a random fingerprint.

```javascript
// Puppeteer Example
const fs = require('fs');
const randomTestScript = fs.readFileSync('./public/build/randomTest.js', 'utf8');

await page.evaluateOnNewDocument(randomTestScript);
```

### Method 2: Customizing via Generator
This method allows for consistency (via Seed) or specifying a particular UserAgent.

1. **Inject Generator** (`generator.js`).
2. **Generate Config**: Call `BROWSER_GENERATOR`.
3. **Inject Engine** (`window.js`).
4. **Apply Config**: Call `SCOPE_CHEATER.run()`.

```javascript
// Pseudocode Flow
const generatorCode = fs.readFileSync('./public/build/generator.js', 'utf8');
const windowCode = fs.readFileSync('./public/build/window.js', 'utf8');

// 1. Inject generator code
await page.evaluateOnNewDocument(generatorCode);
// 2. Inject engine code
await page.evaluateOnNewDocument(windowCode);

await page.evaluateOnNewDocument(() => {
    // 3. Generate fingerprint config (supports UA, seed, safeMode, etc.)
    const config = self.BROWSER_GENERATOR({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
        seed: 123456, // Same seed generates the same fingerprint
        safeMode: true
    });
    // 4. Pass config to global variable
    self.SCOPE_BROWSER = config;
    // 5. Start obfuscation
    self.SCOPE_CHEATER.run();
});
```

### Method 3: Fully Manual Parameters
If you have your own fingerprint library (JSON data), you can skip the generator and inject `window.js` directly.

```javascript
const windowCode = fs.readFileSync('./public/build/window.js', 'utf8');
const myFingerprintData = { ... }; // JSON object matching the generator structure

await page.evaluateOnNewDocument(windowCode);
await page.evaluateOnNewDocument((data) => {
    self.SCOPE_BROWSER = data; // Assign data
    self.SCOPE_CHEATER.run(); // Run engine
}, myFingerprintData);
```

## 📂 Project Structure

```text
CthulhuJs/
├── src/
│   ├── cheaters/          # 🎭 [Core] Obfuscation modules
│   │   ├── audioCheater.js
│   │   ├── canvasCheater.js
│   │   ├── navigatorCheater.js
│   │   └── ... (more modules)
│   ├── generate/            # 🎲 Generation logic & databases
│   │   ├── devices.json     #    - Real device UA & screen database
│   │   ├── webglInfos.json  #    - Real WebGL renderer/vendor database
│   │   ├── types.js         #    - Type definitions
│   │   └── index.js         #    - Generator entry
│   ├── jsons/               # 🗃️ Browser engine feature libraries
│   │   ├── blink.features.json
│   │   └── gecko.features.json
│   ├── kits/                # 🛠️ Utilities
│   │   ├── objects.js       #    - Object manipulation
│   │   ├── proxy.js         #    - Core Proxy hijacking & Native Masquerading
│   │   └── utils.js         #    - Helper functions
│   ├── browserFill.js       # 🧩 Browser environment polyfills
│   ├── const.js             # 📌 Constants
│   ├── generator.js         # ⚙️ [Entry] Fingerprint generator
│   ├── randomTest.js        # 🧪 [Entry] Random test script
│   ├── window.js            # 🚪 [Entry] Main window injection (Window Scope)
│   └── worker.js            # 👷 [Entry] Worker thread injection (Worker Scope)
├── public/                  # 📦 (GitIgnored) Build output (dev/build)
├── webpack.config.js        # 🏗️ Webpack configuration
├── babel.config.js          # 🧬 Babel configuration
├── type.d.ts                # 📝 TypeScript type definitions
└── package.json             # 📦 Dependencies & scripts
```

## ⚖️ Disclaimer

This project (**CthulhuJs**) is for **security research, academic exchange, and defensive testing** only.
* The developer is not responsible for any legal consequences or service interruptions caused by the use of this project.
* Do not use this project for any illegal purposes (e.g., malicious attacks, fraud, bypassing legitimate access controls).
* By using this project, you agree to comply with all applicable laws and regulations.

## 📄 License

MIT License.
