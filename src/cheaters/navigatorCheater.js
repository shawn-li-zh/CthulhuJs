import {functionCall, proxyFunc, proxyGetter, proxyValue} from "../kits/proxy";


export function infoHandler(browser) {
    let handlers = [];
    if (browser.timezone) {
        handlers.push({
            check: (key, val) => key === "timezoneOffset" && typeof val == "number",
            handle: (key, val) => browser.timezoneOffset || val,
        });
        handlers.push({
            check: (key, val) => {
                if (!(key.includes("time") && typeof val == "string" && val)) return false
                let areas = ['Africa', 'America', 'Antarctica', 'Asia', 'Atlantic', 'Australia', 'Europe', 'Indian', 'Pacific'];
                for (let area of areas) {
                    if (val.startsWith(area + "/")) return true;
                }
                return false
            },
            handle: (key, val) => browser.timezone || val,
        });
    }
    if (browser.memoryCapacity && deviceMemoryGet) {
        handlers.push({
            check: (key, val) => key === "deviceMemory" && typeof val == "number",
            handle: (key, val) => browser.memoryCapacity || val,
        });
    }

    if (browser.processors) {
        handlers.push({
            check: (key, val) => key === "hardwareConcurrency" && typeof val == "number",
            handle: (key, val) => browser.processors || val,
        });
    }
    if (browser.language) {
        handlers.push({
            check: "language",
            handle: (key, val) => browser.languageCode || val,
        });
        handlers.push({
            check: "languages",
            handle: (key, val) => browser.languages || val,
        });
    }
    const getWebglRenderer = (k, ov) => {
        return browser.webglInfo?.UNMASKED_RENDERER_WEBGL || ov
    }
    const getWebglVendor = (k, ov) => {
        return browser.webglInfo?.UNMASKED_VENDOR_WEBGL || ov
    }
    if (browser.webglInfo?.UNMASKED_VENDOR_WEBGL) {
        handlers.push({
            check: (key, val) => {
                return key.toString().match(/.*((webgl|unmasked)(R|_r)(enderer)).*/) && typeof val == "string" && val;
            },
            handle: getWebglRenderer,
        });
    }
    if (browser.webglInfo?.UNMASKED_RENDERER_WEBGL) {
        handlers.push({
            check: (key, val) => {
                return key.toString().match(/.*((webgl|unmasked)(V|_v)(endor|ender)).*/) && typeof val == "string" && val;
            },
            handle: getWebglVendor,
        });
    }
    if (browser.userAgent) {
        handlers.push({
            check: (key, val) => {
                if (!(key.toString().match(/.*(((user)(A|_a)(gent))|ua|Ua|UA).*/) && typeof val == "string" && val)) return false
                return val.startsWith("Mozilla");
            },
            handle: (key, val) => browser.userAgent || val,
        });
        handlers.push({
            check: "appVersion",
            handle: (key, val) => browser.appVersion || val,
        });
    }
    handlers.push({
        check: "platform",
        handle: (key, val) => browser.getPlatform(val) || val,
    });
    if (browser.uaInfo) {
        handlers.push({
            check: (key, val) => {
                return key.toString().includes('vendor') && typeof val == "string" && val.endsWith("Inc.");
            },
            handle: (key, val) => browser.browserVendor || val,
        });
        handlers.push({
            check: /brands|brand_list|brandList/,
            handle: (key, val) => browser.brands || val,
        });
        handlers.push({
            check: "brandsVersion",
            handle: (key, val) => browser.brandsVersion || val,
        });
        handlers.push({
            check: (key, val) => {
                return key.toLowerCase().includes('mobile') && typeof val == "boolean";
            },
            handle: (key, val) => browser.mobile === undefined ? val : browser.mobile,
        });
        handlers.push({
            check: /arch(itecture)*/,
            handle: (key, val) => browser.arch || val,
        });
        handlers.push({
            check: (key, val) => {
                return key.toLowerCase().includes('bit') && typeof val == "number" && [16, 32, 64].some(v => v == val);//==
            },
            handle: (key, val) => browser.bitness || val,
        });
        handlers.push({
            check: "uaFullVersion",
            handle: (key, val) => browser.uaFullVersion || val,
        });
        handlers.push({
            check: "platformVersion",
            handle: (key, val) => browser.platformVersion || val,
        });
        handlers.push({
            check: "fullVersionList",
            handle: (key, val) => browser.fullVersionList || val,
        });
    }

    return handlers
}

const deviceMemoryGet = (Object.getOwnPropertyDescriptor(Navigator.prototype, 'deviceMemory') || {}).get;

function cheatNavigator(scope, browser) {
    const Navigator = scope.Navigator || scope.WorkerNavigator;
    if (!Navigator) return

    if (typeof browser.doNotTrack === "boolean") {
        proxyGetter(Navigator.prototype, "doNotTrack", (target, self, args) => {
            functionCall(target, self, args);//触发Illegal invocation
            return browser.doNotTrack ? "1" : "0"
        }, {skipAbsent: true})
    }
    if (typeof browser.javaEnabled === "boolean") {
        proxyFunc(Navigator.prototype, "javaEnabled", (target, self, args) => {
            functionCall(target, self, args);//触发Illegal invocation
            return browser.javaEnabled
        }, {skipAbsent: true})
    }
    if (browser.screen?.maxTouchPoints) {
        proxyGetter(Navigator.prototype, "maxTouchPoints", (target, self, args) => {
            let ov = functionCall(target, self, args);//触发Illegal invocation
            return browser.screen?.maxTouchPoints || ov
        }, {skipAbsent: true})
    }
    if (browser.userAgent) {
        proxyGetter(Navigator.prototype, "appVersion", (target, self, args) => {
            let ov = functionCall(target, self, args);//触发Illegal invocation
            return browser.appVersion || ov
        }, {skipAbsent: true})
        proxyGetter(Navigator.prototype, "userAgent", (target, self, args) => {
            let ov = functionCall(target, self, args);//触发Illegal invocation
            return browser.userAgent || ov
        }, {skipAbsent: true})
    }
    if (browser.uaInfo) {
        proxyGetter(Navigator.prototype, "vendor", (target, self, args) => {
            let ov = functionCall(target, self, args);//触发Illegal invocation
            return browser.browserVendor || ov
        }, {skipAbsent: true})
        proxyGetter(Navigator.prototype, "platform", (target, self, args) => {
            let ov = functionCall(target, self, args);//触发Illegal invocation
            return browser.getPlatform(ov) || ov
        }, {skipAbsent: true})
    }
    if (browser.memoryCapacity && deviceMemoryGet) {
        const realDeviceMemory = deviceMemoryGet.call(scope.navigator)
        const ratio = browser.memoryCapacity / realDeviceMemory
        if (scope.navigator.deviceMemory && scope.performance.memory) {
            for (const memoryKey in scope.performance.memory) {
                let ov = scope.performance.memory[memoryKey];
                proxyValue(scope.performance.memory, memoryKey, Math.round(ov * ratio))
            }
        }
        proxyGetter(Navigator.prototype, "deviceMemory", (target, self, args) => {
            let ov = functionCall(target, self, args);//触发Illegal invocation
            return browser.memoryCapacity || ov
        }, {skipAbsent: true});

        const memory = scope.performance.memory;
        if (memory) {
            let MemoryInfoPrototype = Object.getPrototypeOf(memory);
            for (let key of ['jsHeapSizeLimit', 'totalJSHeapSize', 'usedJSHeapSize']) {
                proxyGetter(MemoryInfoPrototype, key, (target, self, args) => {
                    let ov = functionCall(target, self, args);//触发Illegal invocation
                    return (ov * ratio) | 0;
                }, {skipAbsent: true})
            }
        }
    }

    if (browser.processors) {
        proxyGetter(Navigator.prototype, "hardwareConcurrency", (target, self, args) => {
            let ov = functionCall(target, self, args);//触发Illegal invocation
            return browser.processors || ov
        }, {skipAbsent: true})
    }
    if (browser.language) {
        proxyGetter(Navigator.prototype, "language", (target, self, args) => {
            let ov = functionCall(target, self, args);//触发Illegal invocation
            return browser.languageCode || ov
        }, {skipAbsent: true})
        proxyGetter(Navigator.prototype, "languages", (target, self, args) => {
            let ov = functionCall(target, self, args);//触发Illegal invocation
            return browser.languages || ov
        }, {skipAbsent: true})
    }

}

export function cheat(scope, browser) {
    cheatNavigator(scope, browser);
    const Number = scope.Number;
    const messages = [
        'toFixed() digits argument must be between 0 and 100',
        'Gecko toFixed() failed len 29',
        'Webkit toFixed() failed len 49 between 0 and 100']
    if (Number && browser.uaInfo?.engine) {
        proxyFunc(Number.prototype, "toFixed", (target, self, args) => {
            try {
                return functionCall(target, self, args);
            } catch (e) {
                let i = -1;
                if (e.constructor.name === 'RangeError' && browser.uaInfo) {
                    let name = (((browser.uaInfo.engine || {}).name) || '').toLowerCase()
                    if ('blink' === name) i = 0
                    else if ('gecko' === name) i = 1
                    else if ('webkit' === name) i = 2
                }
                if (messages[i]) {
                    e.message = messages[i]
                }
                throw e
            }
        }, {skipAbsent: false});
    }

    const NavigatorUAData = scope.NavigatorUAData;
    if (NavigatorUAData && browser.uaInfo) {
        const uaInfo = browser.uaInfo;
        if (uaInfo.os) {
            proxyGetter(NavigatorUAData.prototype, "platform", (target, self, args) => {
                let ov = functionCall(target, self, args);//触发Illegal invocation
                return browser.getPlatform(ov) || ov
            })
        }
        proxyGetter(NavigatorUAData.prototype, "brands", (target, self, args) => {
            let ov = functionCall(target, self, args);//触发Illegal invocation
            return browser.brands || ov
        })
        proxyGetter(NavigatorUAData.prototype, "mobile", (target, self, args) => {
            let ov = functionCall(target, self, args);//触发Illegal invocation
            return typeof browser.mobile == "boolean" ? browser.mobile : ov
        })
        proxyFunc(NavigatorUAData.prototype, "getHighEntropyValues", (target, self, args) => {
            let uaData = self
            return functionCall(target, self, args).then(obj => {
                obj = {...obj}
                obj.brands = uaData.brands
                if ('platform' in obj) {
                    obj.platform = browser.getPlatform(obj.platform) || obj.platform
                }
                if ('mobile' in obj) {
                    obj.mobile = uaData.mobile === undefined ? obj.mobile : uaData.mobile
                }
                if ('architecture' in obj) {
                    obj.architecture = browser.arch || obj.architecture
                }
                if ('bitness' in obj) {
                    obj.bitness = browser.bitness || obj.bitness
                }
                if ('uaFullVersion' in obj) {
                    obj.uaFullVersion = browser.uaFullVersion || obj.uaFullVersion
                }
                if ('fullVersionList' in obj) {
                    obj.fullVersionList = browser.fullVersionList || obj.fullVersionList
                }
                if ('platformVersion' in obj) {
                    obj.platformVersion = browser.platformVersion || obj.platformVersion
                }
                return obj;
            })
        });
        proxyFunc(NavigatorUAData.prototype, "toJSON", (target, self, args) => {
            let jsonObject = functionCall(target, self, args);
            jsonObject = {...jsonObject}
            jsonObject.mobile = self.mobile
            jsonObject.brands = self.brands
            jsonObject.platform = self.platform
            return jsonObject
        })
    }

    return true
}
