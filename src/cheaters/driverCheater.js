import {functionCall, proxyFunc, proxyGetter} from "../kits/proxy";


export function cheat(scope, browser) {
    // delete scope.IdleDetector;
    const UserActivation = scope.UserActivation;

    if (UserActivation) {
        proxyGetter(UserActivation.prototype, "hasBeenActive", () => false)
        proxyGetter(UserActivation.prototype, "isActive", () => false)
    }
    // const PerformanceTiming = scope.PerformanceTiming;
    // if (PerformanceTiming) {
    //     proxyGetter(PerformanceTiming.prototype, "domInteractive", () => 0)
    //     proxyGetter(PerformanceTiming.prototype, "domContentLoadedEventStart", () => 0)
    //     proxyGetter(PerformanceTiming.prototype, "domContentLoadedEventEnd", () => 0)
    //     proxyGetter(PerformanceTiming.prototype, "domComplete", () => 0)
    //     proxyGetter(PerformanceTiming.prototype, "loadEventStart", () => 0)
    //     proxyGetter(PerformanceTiming.prototype, "loadEventEnd", () => 0)
    // }
    if (!('getInterestGroupAdAuctionData' in scope.navigator)) {
        const getter = Object.getOwnPropertyDescriptor(Navigator.prototype, 'userAgent').get
        //添加
        proxyFunc(scope.Navigator.prototype, 'getInterestGroupAdAuctionData', (target, self, args) => {
            getter.call(self)//检查类型
        }, {skipAbsent: false})
    }
    proxyGetter(window, 'outerWidth', (target, self, args) => {
        let v = functionCall(target, self, args);
        if (v) return v;
        return screen.availWidth
    })
    proxyGetter(window, 'screenX', (target, self, args) => {
        let v = functionCall(target, self, args);
        return 0
    })
    proxyGetter(window, 'screenLeft', (target, self, args) => {
        let v = functionCall(target, self, args);
        return 0
    })
    proxyGetter(window, 'outerHeight', (target, self, args) => {
        let v = functionCall(target, self, args);
        if (v) return v;
        return screen.availHeight
    })
    proxyGetter(scope, "originAgentCluster", (target, self, args) => {
        functionCall(target, self, args);
        return true
    }, {skipAbsent: true})
    proxyFunc(console, 'debug', () => {
    }, {skipAbsent: true,})
    proxyFunc(console, 'clear', () => {
    }, {skipAbsent: true,})
    //
    if (speechSynthesis) {
        proxyFunc(speechSynthesis, 'getVoices', (target, self, args) => {
            let voices = functionCall(target, self, args);
            if (voices?.length) return voices;
            let lang = browser.languageCode || navigator.language || "";
            let name = ""

            if (lang.startsWith("zh")) {
                name = "Microsoft Huihui - Chinese (Simplified, PRC)"
            } else if (lang.startsWith("en")) {
                name = "Microsoft Mark - English (United States)"
            } else {
                // name = "Microsoft Mark - English (United States)"
                name = "Google " + lang
            }
            let v = {
                default: true,
                lang: lang,
                localService: true,
                name: name,
                voiceURI: name
            }
            Object.setPrototypeOf(v, SpeechSynthesisVoice.prototype)
            return [v]
        })
    }
    // 隐藏selenium多出的变量
    const CObject = scope.Object;
    const CReflect = scope.Reflect
    const regex = /^([a-z]){3}_.*_(Array|Promise|Symbol|JSON|Object|Proxy|Window)$/;

    function handleKeys(target, self, args) {
        let keys = functionCall(target, self, args);
        if (!keys || !self) return keys;
        return keys.filter(v => !regex.test(v)).filter(k => k !== 'ret_nodes')
    }

    proxyFunc(CObject, "keys", handleKeys, {skipAbsent: false});
    proxyFunc(CObject, "getOwnPropertyNames", handleKeys, {skipAbsent: false});
    proxyFunc(CReflect, "ownKeys", handleKeys, {skipAbsent: false});

    if (browser.antiDebugger) {
        function extractCode(func) {
            let funcString = func.toString();
            let start = funcString.indexOf("{");
            let end = funcString.lastIndexOf("}");
            return funcString.substring(start + 1, end)
        }

        proxyFunc(window, "setInterval", (target, self, args) => {
            let [fn, ms, ...fnArgs] = args;
            let ty = typeof fn;
            if (ty !== 'function' && ty !== 'string') return functionCall(target, self, args);
            let code = fn.toString().trim();
            if (code.includes("debugger")) {
                if (ty === 'string') {
                    code = code.replaceAll(/(?<!\\w)debugger(?!\\w)/g, "")
                    args[0] = code//替换
                    return functionCall(target, self, args);
                }
                code = extractCode(fn).trim().replaceAll(";;", ";")
                if (code.length > 10) {
                    fn(...fnArgs);//第一次执行一次,避免里面有执行判断
                }
                args[0] = () => {
                }; //替换为空函数
                return functionCall(target, self, args);
            }
            return functionCall(target, self, args);
        })
    }

    //f12-打开 多出的函数
    // const addFunc = [
    //     'dir', 'dirxml', 'profile', 'profileEnd', 'clear', 'table',
    //     'keys', 'values', 'debug', 'undebug', 'monitor', 'unmonitor', 'inspect', 'copy',
    //     'queryObjects', 'getEventListeners', 'getAccessibleName', 'getAccessibleRole',
    //     'monitorEvents', 'unmonitorEvents', '$', '$$', '$x'];
    // //f12-打开 多出的变量
    // const addValue = ['$_', '$0', '$1', '$2', '$3', '$4'];

    // proxyFunc(Object, 'getOwnPropertyDescriptors', (target, self, args) => {
    //     let originValue = functionCall(target,self,args);
    //     if (!originValue) return originValue
    //     if (!self instanceof Window) return originValue;
    //     [...addFunc, ...addValue].forEach(key => {
    //         try {
    //             function get() {
    //                 return undefined
    //             }
    //
    //             get[specialKeys.native] = 2
    //             Object.defineProperty(originValue, key, {get})
    //         } catch (e) {
    //             try {
    //                 delete originValue[key]
    //             } catch (e) {
    //                 scope[key] = undefined
    //             }
    //         }
    //         // Object.getOwnPropertyDescriptor(originValue,key);
    //     });
    //     // //f12-on多出的变量
    //     // addValue.forEach(key => {
    //     //     try {
    //     //         function get() {
    //     //             return undefined
    //     //         }
    //     //
    //     //         get[specialKeys.native] = 2
    //     //         Object.defineProperty(originValue, key, {get})
    //     //     } catch (e) {
    //     //         delete originValue[key]
    //     //     }
    //     // })
    //     return originValue
    // })

    // proxyFunc(Object, 'getOwnPropertyNames', (target, self, args) => {
    //     let originValue = functionCall(target,self,args);
    //     if (!originValue) return originValue
    //     if (!self instanceof Window) return originValue;
    //     return (originValue || []).filter(v => !addFunc.includes(v)).filter(v => !addValue.includes(v));
    // });
    return true
}
