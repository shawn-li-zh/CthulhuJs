import Utils from "./kits/utils";
import {brandMapCompany, specialKeys} from "./const";

const Date = self.Date;
const LOG = console.log

function cache(fn) {
    return (...args) => {
        if (fn.__called) {
            return fn.__cache
        }
        let v = fn(...args);
        fn.__called = 1
        fn.__cache = v;
        return v
    }
}

export function fill(browser) {
    if (browser.device?.dpr) {
        let dpr = browser.device.dpr.toFixed(2)
        if (window.devicePixelRatio.toFixed(2) === dpr) {
            browser.device.dpr = undefined
        } else {
            browser.device.dpr = dpr / 1
        }
    }
    if (browser.userAgent) {
        if (browser.userAgent.startsWith(navigator.userAgent)) {
            browser.uaInfo = undefined
        } else {
            browser.appVersion = browser.userAgent.replace("Mozilla/", "")
        }
    } else {
        browser.uaInfo = undefined
    }
    const enables = browser.enables || {}
    browser.functionTrace = browser.functionTrace || (enables['functionTrace'] === undefined || enables['functionTrace'])
    let date = new Date();
    browser.start = date.getTime()
    //
    if (browser.language) {
        browser.languages = (browser.language + "").split(",").map(item => item.split(";")[0])
        browser.languageCode = browser.languages.join(",")
    }
    if (browser.timezone) {
        let dateTemp = new Date(date.toLocaleString("en", {timeZone: browser.timezone}));
        browser.timezoneOffset = Math.round((dateTemp - date))
    }

    let ua = navigator.userAgent.toLowerCase()
    if (ua.includes('firefox')) {
        browser.memoryCapacity = navigator.deviceMemory
    }
    browser.getPlatform = (ov,) => {
        let uaInfo = browser.uaInfo;
        if (!uaInfo) return ov
        let osName = uaInfo.os?.name.toString().toLowerCase() || '';
        switch (osName) {
            case 'ios':
                if (uaInfo.device.type === 'mobile') return 'iPhone'
                return 'iPad'
            case "windows": {
                if (ov.toLowerCase().includes('win')) return ov
            }
        }
        return uaInfo.os?.name || ov
    }
    let uaInfo = browser.uaInfo;
    if (uaInfo) {
        let name = browser.uaInfo?.engine?.name
        if (!name) {
            if (/iphone|ipad/i.test(browser.userAgent || '')) {
                name = 'Webkit'
            } else {
                let bn = browser.uaInfo?.product?.name.toLowerCase() || '';
                if (bn === 'firefox') name = 'Gecko'
                else if (bn === 'safari') name = 'Webkit'
                else name = 'Blink'
            }
        }
        browser.uaInfo.engine.name = name
        if (uaInfo.engine) {
            let name = uaInfo.engine.name
            if (/blink.*/i.test(name)) browser.browserVendor = 'Google Inc.'
            else if (/webkit.*/i.test(name)) browser.browserVendor = 'Apple Computer, Inc.'
            else if (/gecko.*/i.test(name)) browser.browserVendor = ''
        }
        let product = uaInfo.product || uaInfo.browser;
        if (product) {
            //只有谷歌系支持
            if (navigator.userAgentData) {
                let brands = [...navigator.userAgentData.brands]
                let browserName = product.name || ''
                for (let k in brandMapCompany) {
                    if (browserName.toUpperCase().includes(k.toUpperCase())) {
                        let newBrands = [
                            {brand: brandMapCompany[k] + " " + browserName, version: product.major},
                            {brand: 'Not=A?Brand', version: '8'},]
                        if (brands[2]) {
                            newBrands.push({brand: brands[2].brand, version: product.major})
                        }
                        brands = newBrands;
                        break
                    }
                }
                browser.brands = brands
            }
            browser.uaFullVersion = product.version
        }
        let getBv = () => {
            let brands = browser.brands || [];
            if (!brands.length) return undefined
            let isObj = !!brands[0].brand
            if (isObj) {
                brands = brands.filter((obj) => !/Not/.test(obj.brand))
                    .map((obj) => `${obj.brand} ${obj.version}`)
            } else if (uaInfo.product) {
                brands = brands.map(brand => {
                    if (brand.toString().startsWith("Not;")) return brand + " 24"
                    return brand + " " + uaInfo.product.major
                })
            }
            if (brands.length > 1) {
                brands = brands.filter((brand) => !/Chromium/.test(brand));
            }
            return brands
        }
        browser.brandsVersion = getBv()
        if (uaInfo.device) {
            browser.mobile = uaInfo.device.type === 'mobile'
        }
        if (browser.brands) {
            browser.fullVersionList = browser.brands.map(brand => {
                return {
                    brand: brand.brand,
                    version: brand.version + ".0.0.0",
                }
            })
        }
        if (uaInfo.cpu || uaInfo.os) {
            let osName = uaInfo.os?.name.toLowerCase() || "";
            if (osName.includes("win")) {
                browser.arch = Utils.randomItem(browser.seed || 0, ["x86", 'x64'])
            } else {
                browser.arch = (uaInfo.cpu || {}).architecture
            }
        }
        browser.bitness = (browser.arch || "").toString().includes('32') ? '32' : '64'
        if (uaInfo.os) {
            let split = uaInfo.os.version.split('.')
            if (split.length > 3) split = split.slice(0, 3)
            else if (split.length < 3) {
                if (split.length === 1) split.push('0.0')
                else if (split.length === 2) split.push('0')
            }
            browser.platformVersion = split.join('.')
        }
    }

    // browser.trace=1
    // browser.dev=1
}

export function getBrowserFromEnv() {
    let scopeBrowser = self[specialKeys.SCOPE_BROWSER];
    if (scopeBrowser) {
        if (self.top === self || !self.top) LOG("browser from background")
        return scopeBrowser
    }
    let item = sessionStorage.getItem(specialKeys.SCOPE_BROWSER);
    if (!item) return undefined;
    try {
        scopeBrowser = JSON.parse(item)
        self[specialKeys.SCOPE_BROWSER] = scopeBrowser
        if (self.top === self || !self.top) LOG("browser from session")
        return scopeBrowser
    } catch (e) {
        return undefined
    }
}
