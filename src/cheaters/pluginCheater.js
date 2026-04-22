import {functionCall, proxyGetter} from "../kits/proxy";
import Utils from "../kits/utils";
import {specialKeys} from "../const";

export function cheat(scope, browser) {
    const Plugin = scope.Plugin;
    if (!(browser.factors.plugins && Plugin)) return false
    let rand=new Utils.Random(browser.factors.plugins)
    let randNum = rand.int(0,999999)
    const randomStr = (target, self, args) => {
        let v = functionCall(target, self, args);//触发Illegal invocation
        let s = new String(v);//强制new
        s.valueOf = function valueOf() {
            return v + ' ' + randNum
        }
        s.valueOf[specialKeys.native] = 1
        s.toString = function toString() {
            return v + ' ' + randNum
        }
        s.toString[specialKeys.native] = 1
        return s
    }
    proxyGetter(Plugin.prototype, 'description', randomStr, {skipAbsent: true});
    // proxyGetter(Plugin.prototype, 'filename', randomStr, {skipAbsent: true});//固定值，加干扰会被检测
    proxyGetter(Plugin.prototype, 'name', randomStr, {skipAbsent: true});
    if (browser.hideFlash && navigator.plugins) {
        new Proxy(navigator.plugins, {
            get(target, prop, receiver) {
                const res = Reflect.get(target, prop, receiver)
                if (res instanceof Plugin) {
                    if (res.name.includes("Shockwave Flash")) {
                        return undefined
                    }
                }
                return res
            }
        })
    }
    return true
}
