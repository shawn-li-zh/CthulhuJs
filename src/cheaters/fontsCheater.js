import Utils from "../kits/utils";

import {functionCall, proxyFunc, proxyGetter} from "../kits/proxy";

const WindowsFonts = {
    // https://docs.microsoft.com/en-us/typography/fonts/windows_11_font_list
    '7': [
        'Cambria Math',
        'Lucida Console',
    ],
    '8': [
        'Aldhabi',
        'Gadugi',
        'Myanmar Text',
        'Nirmala UI',
    ],
    '8.1': [
        'Leelawadee UI',
        'Javanese Text',
        'Segoe UI Emoji',
    ],
    '10': [
        'HoloLens MDL2 Assets',
        'Segoe MDL2 Assets',
        'Bahnschrift',
        'Ink Free', // 10 (v1803) +-
    ],
    '11': ['Segoe Fluent Icons'],
};
const MacOSFonts = {
    // Mavericks and below
    '10.9': [
        'Helvetica Neue',
        'Geneva', // mac (not iOS)
    ],
    // Yosemite
    '10.10': [
        'Kohinoor Devanagari Medium',
        'Luminari',
    ],
    // El Capitan
    '10.11': [
        'PingFang HK Light',
    ],
    // Sierra: https://support.apple.com/en-ie/HT206872
    '10.12': [
        'American Typewriter Semibold',
        'Futura Bold',
        'SignPainter-HouseScript Semibold',
    ],
    // High Sierra: https://support.apple.com/en-me/HT207962
    // Mojave: https://support.apple.com/en-us/HT208968
    '10.13-10.14': [
        'InaiMathi Bold',
    ],
    // Catalina: https://support.apple.com/en-us/HT210192
    // Big Sur: https://support.apple.com/en-sg/HT211240
    '10.15-11': [
        'Galvji',
        'MuktaMahee Regular',
    ],
    // Monterey: https://support.apple.com/en-us/HT212587
    '12': [
        'Noto Sans Gunjala Gondi Regular',
        'Noto Sans Masaram Gondi Regular',
        'Noto Serif Yezidi Regular'
    ],
    // Ventura: https://support.apple.com/en-us/HT213266
    '13': [
        'Apple SD Gothic Neo ExtraBold',
        'STIX Two Math Regular',
        'STIX Two Text Regular',
        'Noto Sans Canadian Aboriginal Regular',
    ],
};
const DesktopAppFonts = {
    // docs.microsoft.com/en-us/typography/font-list/ms-outlook
    'Microsoft Outlook': ['MS Outlook'],
    // https://community.adobe.com/t5/postscript-discussions/zwadobef-font/m-p/3730427#M785
    'Adobe Acrobat': ['ZWAdobeF'],
    // https://wiki.documentfoundation.org/Fonts
    'LibreOffice': [
        'Amiri',
        'KACSTOffice',
        'Liberation Mono',
        'Source Code Pro',
    ],
    // https://superuser.com/a/611804
    'OpenOffice': [
        'DejaVu Sans',
        'Gentium Book Basic',
        'OpenSymbol',
    ],
};
const APPLE_FONTS = Object.keys(MacOSFonts).map((key) => MacOSFonts[key]).flat();
const WINDOWS_FONTS = Object.keys(WindowsFonts).map((key) => WindowsFonts[key]).flat();
const DESKTOP_APP_FONTS = (Object.keys(DesktopAppFonts).map((key) => DesktopAppFonts[key]).flat());
const LINUX_FONTS = [
    'Arimo',
    'Chilanka',
    'Cousine',
    'Jomolhari',
    'MONO',
    'Noto Color Emoji',
    'Ubuntu', // ubuntu (not TB)
];
const ANDROID_FONTS = [
    'Dancing Script',
    'Droid Sans Mono',
    'Roboto', // Android, Chrome OS
];
const FONT_LIST = new Set([
    ...APPLE_FONTS,
    ...WINDOWS_FONTS,
    ...LINUX_FONTS,
    ...ANDROID_FONTS,
    ...DESKTOP_APP_FONTS,
]);

function isFontOSBad(userAgentOS, fonts) {
    if (!userAgentOS || !fonts || !fonts.length) {
        return false;
    }
    const fontMap = fonts.reduce((acc, x) => {
        acc[x] = true;
        return acc;
    }, {});
    const isLikeWindows = ('Cambria Math' in fontMap ||
        'Nirmala UI' in fontMap ||
        'Leelawadee UI' in fontMap ||
        'HoloLens MDL2 Assets' in fontMap ||
        'Segoe Fluent Icons' in fontMap);
    const isLikeApple = ('Helvetica Neue' in fontMap ||
        'Luminari' in fontMap ||
        'PingFang HK Light' in fontMap ||
        'Futura Bold' in fontMap ||
        'InaiMathi Bold' in fontMap ||
        'Galvji' in fontMap ||
        'Chakra Petch' in fontMap);
    const isLikeLinux = ('Arimo' in fontMap ||
        'MONO' in fontMap ||
        'Ubuntu' in fontMap ||
        'Noto Color Emoji' in fontMap ||
        'Dancing Script' in fontMap ||
        'Droid Sans Mono' in fontMap ||
        'Roboto' in fontMap);
    let os = userAgentOS.toLowerCase();
    if (isLikeWindows && os !== 'windows' /* PlatformClassifier.WINDOWS */) {
        return true;
    } else if (isLikeApple && os !== 'apple' /* PlatformClassifier.APPLE */) {
        return true;
    } else if (isLikeLinux && os !== 'linux' /* PlatformClassifier.LINUX */) {
        return true;
    }
    return false;
}

const fonts = {
    android: ['Dancing Script',
        'Droid Sans Mono',
        'Roboto', // Android, Chrome OS
    ],
    linux: [
        'Arimo',
        'Chilanka',
        'Cousine',
        'Jomolhari',
        'MONO',
        'Noto Color Emoji',
        'Ubuntu', // ubuntu (not TB)
    ],
    apple: [
        'Helvetica Neue',
        'Geneva', // mac (not iOS)
        'Kohinoor Devanagari Medium',
        'Luminari',
        'PingFang HK Light',
        'American Typewriter Semibold',
        'Futura Bold',
        'SignPainter-HouseScript Semibold',
        'InaiMathi Bold',
        'Galvji',
        'MuktaMahee Regular',
        'Bai Jamjuree',
        'Chakra Petch',
        'Charmonman',
        'Kodchasan',
    ],
    windows: [
        'Cambria Math',
        'Lucida Console',
        'Aldhabi',
        'Gadugi',
        'Myanmar Text',
        'Nirmala UI',
        'Leelawadee UI',
        'Javanese Text',
        'Segoe UI Emoji',
        'HoloLens MDL2 Assets',
        'Segoe MDL2 Assets',
        'Bahnschrift',
        'Ink Free', // 10 (v1803) +-
        'Segoe Fluent Icons',
    ]
}

function endsWithFontName(str = '', fontNames = []) {
    if (!str) return false
    let strings = str.split(" ");
    let font = (strings[strings.length - 1] || '').toUpperCase();
    return fontNames.find(fontName => fontName.toUpperCase() === font);
}

//检测字体是否可用
const defaultFonts = ["monospace", "sans-serif", "serif"]

let getterW = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth").get;
let getterH = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight").get;

function spanSize(fontFamily) {
    try {
        const testDiv = document.createElement('span');
        testDiv.textContent = "lLmMwWiI0O&18"
        testDiv.style.visibility = 'hidden';
        testDiv.style.fontFamily = fontFamily
        document.body.appendChild(testDiv);
        let offsetWidth = functionCall(getterW, testDiv, []);
        let offsetHeight = functionCall(getterH, testDiv, []);
        document.body.removeChild(testDiv);
        return {width: offsetWidth, height: offsetHeight}
    } catch (e) {
        return -1;
    }
}

const defaultSize = spanSize(defaultFonts.join(","))
const cache = {}

function isFontLoaded(fontFamily) {
    if (cache[fontFamily] !== undefined) return cache[fontFamily]
    let {width} = spanSize(fontFamily);
    cache[fontFamily] = width !== defaultSize.width;
    return cache[fontFamily];
}

export function cheat(scope, browser) {
    const factor = browser.factors.fonts
    if (!factor) return false;
    const HTMLElement = scope.HTMLElement;
    const temp = Utils.randomInt(factor, 5, 20);
    let osName
    if (!browser.uaInfo) {
        let ua = scope.navigator.userAgent.toLowerCase();
        if (ua.includes("windows")) {
            osName = 'windows'
        } else if (ua.includes("ios") || ua.includes("macintosh")) {
            osName = 'apple'
        } else if (ua.includes("android")) {
            osName = 'android'
        } else if (ua.includes("linux")) {
            osName = 'linux'
        }
    } else {
        osName = ((browser.uaInfo.os || {}).name || "").toLowerCase();
    }
    let fontK = osName
    if (osName === 'ios' || osName === 'mac') {
        fontK = 'apple'
    }
    let targetFonts = fonts[fontK] || []
    if (!targetFonts.length) return false
    let notEnableFonts = Object.keys(fonts).filter(v => v !== fontK)
        .map(v => fonts[v]).flat() || [];

    const hashCache = {}

    function isFontLoadFail(family) {
        let isNot = endsWithFontName(family, notEnableFonts);
        if (isNot) return true
        let isBad = isFontOSBad(fontK, [family]);
        if (isBad) {
            return true
        }
        let isMatch = endsWithFontName(family, targetFonts);
        if (isMatch) return false
        let hash = hashCache[family];
        if (!hash) {
            hashCache[family] = Utils.hashcode(family)
            hash = hashCache[family]
        }
        // 没匹配到就随机成功和失败
        return Utils.randomInt(factor + hash, 1, 4) === 1
    }

    const curDefaultWidth = {}
    if (HTMLElement) {
        function offset(target, self, args) {
            let value = functionCall(target, self, args);
            let fontFamilies = Utils.getStyle(self, 'font-family')
            let fontSize = Utils.getStyle(self, 'font-size')
            if (!fontFamilies || !fontSize) return value
            let size = fontSize.match(/\d+/g)?.map(Number)[0] || 0;
            if (size > 200) return value
            let familyList = fontFamilies.split(",").map(v => v.trim());
            for (let fontFamily of familyList) {
                if (defaultFonts.includes(fontFamily)) {
                    curDefaultWidth[fontFamily] = value
                    return value
                }
                if (isFontLoadFail(fontFamily)) {
                    continue
                }
                //宽度和默认的不同视为加载成功
                let isFontLoaded = !Object.values(curDefaultWidth).includes(value);
                if (isFontLoaded) return value
                let hashcode = Math.abs(Utils.hashcode(fontFamily));
                const noiseSize = Utils.randomInt(factor + hashcode, 1, 50) / 100;
                return value + noiseSize;
            }
            //返回缓存的默认字体宽度
            return Object.values(curDefaultWidth)[0] || value
        }

        // proxyGetter(HTMLElement.prototype, "offsetHeight", offset, {skipAbsent: false});
        proxyGetter(HTMLElement.prototype, "offsetWidth", offset, {skipAbsent: false});
    }
    const TextMetrics = scope.TextMetrics;
    if (TextMetrics) {
        proxyGetter(TextMetrics.prototype, "width", (target, self, args) => {
            let originValue = functionCall(target, self, args);
            if (!originValue) return originValue
            if ((originValue) % temp === 0) {
                return originValue
            }
            const noise = (Utils.randomNum(factor, 5000) - 2500) / 5000
            return originValue + noise;
        });
    }
    const SVGTextContentElement = scope.SVGTextContentElement;
    if (SVGTextContentElement) {
        proxyFunc(SVGTextContentElement.prototype, "getComputedTextLength", (target, self, args) => {
            let originValue = functionCall(target, self, args);
            if (!originValue) return originValue
            if (originValue % temp === 0) {
                return originValue
            }
            const noise = (Utils.randomNum(factor, 5000) - 2500) / 5000
            return originValue + noise;
        });
    }
    const FontFace = scope.FontFace;
    let LOAD = FontFace.prototype.load;


    const FontFaceSet = Object.getPrototypeOf(scope.document.fonts);
    if (FontFace) {
        function load(load, family) {
            const font = new FontFace(load, `local(${load})`);
            return LOAD.call(font).then(f => {
                // console.log('load-ok:' + load + ' --- ' + family)
                Object.defineProperty(f, 'family', {value: family})
                return f
            }).catch(e => {
                // console.log('load-failed:' + load + ' --- ' + family)
                throw e;
            })
        }

        proxyFunc(FontFace.prototype, "load", (target, self, args) => {
            const fontFamily = self["family"]
            let originValue = functionCall(target, self, args);
            if (!(originValue instanceof scope.Promise)) return originValue;
            if (fontFamily === 'CTHULHU_JS') return originValue;
            if (defaultFonts.includes(fontFamily)) return originValue
            if (isFontLoadFail(fontFamily)) {
                return load("CTHULHU_JS", fontFamily)
            }
            return originValue.then(v => {
                // console.log('real-load-ok:' + fontFamily)
                return v
            }).catch(e => {
                // console.log('real-load-failed:' + fontFamily)
                return load('Arial', fontFamily)
            })
        });
    }
    if (FontFaceSet)
        proxyFunc(FontFaceSet, "check", (target, self, args) => {
            let originValue = functionCall(target, self, args);
            let font = args[0]
            if (!font) return originValue;
            let matches = /".+"/.exec(font);
            if (!matches) return originValue
            let fontFamily = matches[1]
            if (!fontFamily) return originValue;
            if (defaultFonts.includes(fontFamily)) return originValue
            return !isFontLoadFail(fontFamily)
        });

    return true

}
