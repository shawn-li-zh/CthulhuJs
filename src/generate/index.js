import {UAParser} from "ua-parser-js";
import Utils from "../kits/utils";
import devices from './devices.json'
import webglInfos from './webglInfos.json'

function uaParse(ua) {
    let uaParser = new UAParser(ua).getResult();
    let obj = {};
    // ["product", "os", "device", "cpu", "engine"].forEach(key => {
    //     obj[key] = uaParser[key]
    // });
    ["browser", "os", "device", "cpu", "engine"].forEach(key => {
        obj[key] = uaParser[key]
    });
    obj["product"] = obj.browser;
    delete obj.browser
    return obj
}

//Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Mobile Safari/537.36
function createUserAgent(info = {}) {
    // const getVersion = (x) => (/\d+/.exec(x) || [])[0];
    const androidPlatform = (osVersion, device) => {
        return `Linux; Android ${osVersion}; ${device}`
    }
    const applePlatform = (deviceType, osVersion = "") => {
        osVersion = osVersion.replace(".", "_")//apple设备的版本是下划线
        if (deviceType === "Macintosh") return `Macintosh; Intel Mac OS X ${osVersion}`
        return `${deviceType}; CPU ${deviceType !== "iPad" ? "iPhone " : ""}OS ${osVersion} like Mac OS X`
    }
    const winPlatform = (osVersion) => {
        return `Windows NT ${osVersion}; Win64; x64`
    }
    const linuxPlatform = () => {
        return `X11; Linux x86_64`
    }
    const pcBrowser = (browserName = "", browserVersion, engineVersion) => {
        engineVersion = engineVersion || "537.36"
        browserName = browserName.toLowerCase();
        if (browserName === "safari") {
            //webkit engine
            return `AppleWebKit/${engineVersion} (KHTML, like Gecko) Version/${browserVersion} Safari/${engineVersion}`;
        }
        if (browserName === "chrome") {
            //blink v>28|webkit v<=28 engine
            return `AppleWebKit/${engineVersion} (KHTML, like Gecko) Chrome/${browserVersion} Safari/${engineVersion}`;
        }
        if (browserName === "firefox") {
            //gecko engine
            engineVersion = engineVersion || browserVersion
            return `Gecko/${engineVersion} Firefox/${browserVersion}`;
        }
        return `AppleWebKit/${engineVersion} (KHTML, like Gecko) Chrome/${engineVersion} Safari/${engineVersion} ${browserName}/${browserVersion}`;
    }
    const phoneBrowser = (browserName, browserVersion, engineVersion) => {
        engineVersion = engineVersion || '534.46'
        browserName = browserName.toLowerCase();
        if (browserName === "safari") {
            //webkit engine
            return `AppleWebKit/${engineVersion} (KHTML, like Gecko) Version/5.1 Mobile/9A334 Safari/${engineVersion}`;
        }
        if (browserName === "chrome") {
            //blink v>28|webkit v<=28 engine
            return `AppleWebKit/${engineVersion} (KHTML, like Gecko) CriOS/${browserVersion} Mobile/10B350 Safari/${engineVersion}`;
        }
        if (browserName === "firefox") {
            //gecko engine
            engineVersion = engineVersion || browserVersion
            return `Gecko/${engineVersion} Mobile Firefox/${browserVersion}`;
        }
        return `AppleWebKit/${engineVersion} (KHTML, like Gecko) Chrome/${engineVersion} Mobile/10B351 Safari/${engineVersion} ${browserName}/${browserVersion}`;
    }
    const platform = (osName, osVersion, deviceName = "") => {
        osName = osName.toLowerCase();
        if (osName === "windows") return winPlatform(osVersion)
        if (osName === "linux") return linuxPlatform(osVersion)
        if (osName === "macos") return applePlatform("Macintosh", osVersion)
        if (osName === "ios") {
            deviceName = deviceName.toLowerCase();
            if (deviceName === ("tablet")) return applePlatform("iPad", osVersion)
            if (deviceName === ("phone")) return applePlatform("iPhone", osVersion)
            return applePlatform("iPhone", osVersion)
        }
        if (osName === "android") return androidPlatform(osVersion, deviceName)
        return `${osName} ${osVersion}; ${deviceName} `
    }
    const browser = (osName, browserName, browserVersion, engineVersion) => {
        osName = osName.toLowerCase();
        if (osName === "windows" || osName === "linux" || osName === "macos") return pcBrowser(browserName, browserVersion, engineVersion)
        if (osName === "ios" || osName === "android") return phoneBrowser(browserName, browserVersion, engineVersion)
        return pcBrowser(browserName, browserVersion, engineVersion)
    }

    let {
        osName = "unknown",
        deviceName = "unknown",
        browserName = "unknown",
        osVersion = "1.0.0",
        browserVersion = "1.0.0",
        engineVersion = "",
    } = info;

    let platStr = platform(osName, osVersion, deviceName);
    let browserStr = browser(osName, browserName, browserVersion, engineVersion);
    return `Mozilla/5.0 (${platStr}) ${browserStr}`
}

/**
 *
 * @param option {{osName?:string, osVersion?:string, browserVersion?:string, browserName?:string,deviceName?:string,engineVersion?:string}}
 * @param random
 * @returns {string}
 */
function randomUserAgent(option = {}, random = new Random(Math.random())) {
    const winVersion = () => {
        return random.item(["10.0", "5.1", "6.1", "6.2", "6.3"])
    }
    const appleVersion = () => {
        let a = random.int(6, 15);
        let b = random.int(0, 15);
        let c = random.int(0, 9);
        let v = a + "_" + b;
        if (c !== 0) {
            v += ("_" + c)
        }
        return v
    }
    const androidVersion = () => {
        let a = random.int(4, 16);
        if (a < 9) {
            let b = random.item(["0", "1", "0.0", "1.0", "1.1", "0.1", "1.2"]);
            return a + "." + b
        }
        //没有小版本
        return a + ""
    }
    const randomVersion = (min = 1, max = 10) => {
        let a = random.int(min, max);
        let b = random.int(0, 10);
        let c = random.int(0, 20);
        return [a, b, c].join(".")
    }
    let {osName, osVersion, browserVersion, browserName} = option
    osName = osName.toLowerCase();
    if (!osVersion) {
        if (osName === "windows") osVersion = winVersion()
        else if (osName === "mac" || osName === "ios") osVersion = appleVersion()
        else if (osName === "android") osVersion = androidVersion()
        else if (osName === "linux") osVersion = "";
    }
    if (!browserVersion) {
        let bName = browserName.toLowerCase();
        if (bName === "chrome" || bName === "edge") browserVersion = randomVersion(76, 123)
        else if (bName === "safari") browserVersion = randomVersion(1, 15)
        else if (bName === "firefox") browserVersion = randomVersion(71, 112)
        else browserVersion = randomVersion()
    }
    return createUserAgent({...option, osName, osVersion, browserVersion, browserName})
}


const fpTags =
    ['canvas', 'audio', 'webgl', 'webgpu', 'voice', 'plugins', 'fonts', 'clientRect'];

function isAuto(value) {
    return (value === 'auto' || value === 'dynamic' || value === '-1' || value === -1)
}

/**
 * @typedef {}
 */
/**
 *
 * @param template {typeof import("./types").TEMPLATE}
 * @param REAL_INFO {typeof import("./types").INFO}
 */
export function generateBrowser(template, REAL_INFO) {
    const seed = template.seed || Math.random()

    let random = new Utils.Random(seed);
    //
    const safeMode = template.safeMode
    let userAgent = template.userAgent
    let deviceType = REAL_INFO.deviceType;
    //
    let location = template.location || {};
    if (isAuto(userAgent)) {
        if (safeMode) {
            userAgent = navigator.userAgent + ' ' + (random.int(11111, 99999))
        } else {
            let osName = REAL_INFO.osName;
            let browserName = REAL_INFO.browserName;
            if (deviceType !== REAL_INFO.deviceType) {
                osName = '';
                browserName = ""
            }
            if (!deviceType) deviceType = random.item(["desktop", "tablet", "mobile"]);
            if (!osName) {
                if (deviceType === "desktop") osName = random.item(["macos", "windows", "linux"])
                else osName = random.item(["ios", "android"])
            }
            if (!browserName) browserName = random.item(["Chrome", "Safari", "Firefox", "Edge"])
            let deviceNames = ((devices[deviceType] || {}) [osName]) || [];
            let deviceName = random.item(deviceNames)
            userAgent = randomUserAgent({osName, browserName, deviceName}, random)
        }
    }
    const uaInfo = uaParse(userAgent || navigator.userAgent);
    deviceType = deviceType || uaInfo.device.type
    let screen = template.screen || {};

    if (isAuto(screen.noise)) {
        screen.noise = random.int(0, 5000) / 1000
        screen.height = 0
        screen.width = 0
    }
    if (isAuto(screen.dpr)) {
        screen.dpr = random.int(100, 300) / 100
    }
    if (isAuto(screen.maxTouchPoints)) {
        if (deviceType === 'desktop') {
            // baseWidth = tabInfo.width || 1536
            // baseHeight = tabInfo.height || 864
            screen.maxTouchPoints = 0
        } else if (deviceType === 'mobile') {
            // baseWidth = tabInfo.width || 540
            // baseHeight = tabInfo.height || 960
            screen.maxTouchPoints = random.int(2, 10)
        } else if (deviceType === 'tablet') {
            // baseWidth = tabInfo.width || 1024
            // baseHeight = tabInfo.height || 768
            screen.maxTouchPoints = random.int(2, 10)
        } else {
            screen.maxTouchPoints = 0
        }
    }
    if (isAuto(screen.colorDepth)) {
        screen.colorDepth = random.item([4, 6, 8, 10, 16, 24])
    }
    if (isAuto(screen.pixelDepth)) {
        screen.pixelDepth = random.item([4, 6, 8, 10, 16, 24])
    }
    if (isAuto(screen.scheme)) {
        screen.scheme = random.item(["no-preference", "light", "dark"])
    }
    const webglInfo = {}
    if (isAuto(template.webglInfo)) {
        if (template.webglSafeMode) {
            webglInfo.UNMASKED_VENDOR_WEBGL = REAL_INFO.webglInfo?.vendor
            const version = random.int(1, 1000)
            //匹配第一个版本号，然后在版本号末尾加上小版本
            webglInfo.UNMASKED_RENDERER_WEBGL = REAL_INFO.webglInfo?.renderer.replace(/\d+(\.\d+)+/, (match) => {
                return match + "." + version;
            })
        } else {
            const webglInfoConfig = random.item(webglInfos)
            for (let key of Object.keys(webglInfoConfig)) {
                const val = webglInfoConfig[key]
                if (val instanceof Array) {
                    const item = random.item(val)
                    webglInfo[key] = item
                } else {
                    webglInfo[key] = val
                }
            }
        }
    }
    let factors = {};
    fpTags.forEach(key => {
        let f = template.factors || {}
        if (!f[key]) return
        factors[key] = isAuto(f[key]) ? (random.int(0, 5000) / 1000) : f[key] || 0;
    });
    let iceServers = template.iceServers || []
    if (!iceServers.length) {
        iceServers.push({urls: 'stun:stun.l.google.com:19302'})
    }
    let browser = {
        ...template,
        id: template.id,
        name: template.name,
        safeMode,
        userAgent,
        webglInfo,
        customProtos: template.customProtos || [],
        customVars: template.customVars || [],
        webrtc: isAuto(template.webrtc) ? REAL_INFO.webrtc : template.webrtc,
        timezone: isAuto(template.timezone) ? REAL_INFO.timezone : template.timezone,
        language: isAuto(template.language) ? REAL_INFO.language : template.language,
        location: {
            lat: isAuto(location.lat) ? REAL_INFO.location?.lat : location.lat,
            lng: isAuto(location.lng) ? REAL_INFO.location?.lng : location.lng,
        },
        factors: factors,
        screen: screen,
        memoryCapacity: isAuto(template.memoryCapacity) ? random.item([0.25, 0.5, 1, 2, 4, 8]) : template.memoryCapacity || 0,
        processors: isAuto(template.processors) ? random.item([1, 2, 4, 8, 16]) : template.processors || 0,
        uaInfo,
        enables:{},
        iceServers: iceServers,
        "javaEnabled": template.javaEnabled,
        "doNotTrack": template.doNotTrack,
        "hideFlash": template.hideFlash,
    };
    if (deviceType === 'mobile' || deviceType === 'tablet') {
        let touchEvents = ['ontouchstart', 'ontouchend', 'ontouchmove', 'ontouchcancel']
        touchEvents.forEach(e => {
            browser.customVars.push({path: 'HTMLElement.prototype.' + e, value: null})
            browser.customVars.push({path: 'window.' + e, value: null})
        })
    }
    return browser
}

