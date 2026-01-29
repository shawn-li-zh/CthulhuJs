import Utils from "../kits/utils";

import {functionCall, proxyFunc, proxyGetter, proxyValue} from "../kits/proxy";
import {specialKeys} from "../const";
import blink from '../jsons/blink.features.json'
import gecko from '../jsons/gecko.features.json'

/**
 * @typedef {{[k:string]:string[]}} Feature
 * @param {string}enginName
 * @returns  {{css:Feature,js:Feature,win:Feature}}
 */
function getEngineMaps(enginName) {
    const IS_BLINK = enginName.toUpperCase() === 'BLINK'
    const IS_GECKO = enginName.toUpperCase() === 'GECKO'
    const css = (IS_BLINK ? blink.css : IS_GECKO ? gecko.css : {})
    const win = (IS_BLINK ? blink.window : IS_GECKO ? gecko.window : {})
    const js = (IS_BLINK ? blink.js : IS_GECKO ? gecko.js : {})
    return {
        css, win, js,
    }
}

/**
 *
 * @param {Feature|{}}allFeature
 * @param {number}version
 * @returns {{removes: string[], adds: string[]}}
 */
function featuresByVersion(allFeature = {}, version = 0) {
    let adds = new Set()
    let removes = new Set()
    for (let [key, list] of Object.entries(allFeature)) {
        list = (list || [])
        let splits = (key + "").split("-")
        let v = +(splits[0])
        let endV = +(splits[splits.length - 1])
        //早于version
        if (v < version) {
            list.forEach(item => {
                let feature = item;
                if (item.toString().charAt(0) === '!') {
                    feature = item.toString().substring(1)
                    removes.add(feature)
                } else {
                    adds.add(feature)
                }
            })
        }
        //处于 版本内
        if (v >= version && endV <= version) {
            list.forEach(item => {
                let feature = item;
                if (item.toString().charAt(0) === '!') {
                    feature = item.toString().substring(1)
                    removes.add(feature)
                } else {
                    adds.add(feature)
                }
            })
        }
        //晚于version
        if (endV > version) {
            list.forEach(item => {
                let feature = item;
                if (item.toString().charAt(0) === '!') {
                    feature = item.toString().substring(1)
                    if (removes.has(feature)) {
                        //删除中存在说明本来就没有
                        return
                    }
                    adds.add(feature)
                } else {
                    if (adds.has(feature)) {
                        //本来就有 然后又要加,不可能
                        return;
                    }
                    removes.add(feature)
                }
            })
        }

    }
    return {removes: [...removes], adds: [...adds]}
}

/**
 *
 * @param{string} browserName
 * @param{number} version
 * @returns {{removes: {css: string[], js: string[], win: string[]}, adds: {css: string[], js: string[], win: string[]}}}
 */
function featureActions(browserName, version) {
    let {
        css, win, js,
    } = getEngineMaps(browserName)
    let cssF = featuresByVersion(css, version)
    let winF = featuresByVersion(win, version)
    let jsF = featuresByVersion(js, version)
    let adds = {
        css: cssF.adds, win: winF.adds, js: jsF.adds,
    }
    let removes = {
        css: cssF.removes, win: winF.removes, js: jsF.removes,
    }
    return {adds, removes}
}


const emptyClass = () => {
    return class Temp {
        constructor() {
            let error = new TypeError('Illegal constructor')
            error.stack = 'Illegal constructor\n    at <anonymous>:1:1'
            throw error
        }
    }
}
const emptyFunc = () => {
    return function () {
    }
}
const removeFunctions = new Set()
const winFeatureCheat = (scope, adds = [], removes = []) => {
    adds.forEach(key => {
        let val = Utils.getValue(self, key)
        if (val) return;
        if (key.charAt(0) === key.charAt(0).toUpperCase()) {
            let empty = emptyClass();
            proxyValue(scope, key, empty)
            return
        }
        let empty = emptyFunc();
        proxyValue(scope, key, empty)
    })
    removes.forEach(key => {
        removeFunctions.add(key)
        try {
            delete scope[key]
            delete scope.self[key]
        } catch (e) {
            self[specialKeys.attach].errors.push(e)
        }

    })
}


const jsFeatureCheat = (scope, adds = [], removes = []) => {
    adds.forEach(key => {
        let [target, keyName] = key.split('.')
        let val = Utils.getValue(scope, key)
        if (val) return;
        let proto = Utils.getValue(scope, target + '.prototype')
        if (!proto) {
            //静态函数
            if (keyName.charAt(0) === keyName.charAt(0).toUpperCase()) {
                let empty = emptyClass();
                proxyValue(scope, keyName, empty)
                return
            }
            let empty = emptyFunc();
            proxyValue(scope, key, empty)
            return
        }
        let descriptor = Object.getOwnPropertyDescriptor(proto, keyName)
        if (descriptor) return;//有就返回
        //原型函数
        let empty = emptyFunc();
        let _a = Object.defineProperty(proto, keyName, {value: empty, writable: true})
    })
    removes.forEach(key => {
        let [target, keyName] = key.split('.')
        let val = Utils.getValue(scope, key)
        if (val) {
            //删除静态的
            removeFunctions.add(key)
            try {
                Utils.deleteValue(scope, key)
            } catch (e) {
                self[specialKeys.attach].errors.push(e)
            }
            return
        }
        let proto = Utils.getValue(scope, target + '.prototype')
        if (proto) {
            removeFunctions.add(target + '.prototype.' + keyName)
            try {
                delete proto[keyName]
            } catch (e) {
                //删除失败
                let tar = Utils.getValue(scope, target)
                if (!tar[specialKeys.remove]) {
                    tar[specialKeys.remove] = []
                }
                tar[specialKeys.remove].push(keyName)
            }

        }
    })
}


const cssFeatureCheat = (scope, adds = [], removes = []) => {
    //CSSStyleDeclaration
    //转成驼峰
    let tranFormat = (k = '') => {
        if (typeof k !== "string") return k
        let arr = k.split('-')
        let str = ''
        arr.forEach(s => {
            if (!s) return
            if (!str) return str += s
            str += (s.charAt(0).toUpperCase() + s.substring(1))
        })
        return str
    }
    adds = new Set(adds.map(tranFormat))
    removes = new Set(removes.map(tranFormat))

    function cssGet(target, prop) {
        if (prop === '__origin__') return target
        let ov = target[prop]
        if (typeof ov === 'function') {
            //如果是构造函数则直接返回
            if (ov.prototype) return ov
            //如果是普通函数
            if (ov + ''.startsWith('function')) return ov.bind(target)
            //如果是箭头函数
            return ov
        }
        let p = tranFormat(prop)
        if (removes.has(p)) return undefined
        if (removes.has(tranFormat(ov))) return ''
        target.fakeCss = target.fakeCss || {}
        return ov || target.fakeCss[p] || ''
    }

    function cssSet(target, prop, value) {
        if (prop === 'fakeCss') return true
        if (typeof value === 'function' || typeof value === 'object') {
            target[prop] = value
            return true
        }
        let p = tranFormat(prop)
        if (prop in target) {
            if (removes.has(p)) return true
            target.setProperty(prop, value)
            target[prop] = value;
            return true
        }
        if (!adds.has(p)) return true
        target.fakeCss = target.fakeCss || {};
        target.fakeCss[p] = value
        return true
    }

    function cssHas(target, prop) {
        let p = tranFormat(prop)
        if (removes.has(p)) return true
        if (adds.has(p)) return true
        return prop in target
    }


    let proxy = (declaration) => {
        if (!declaration) return declaration
        declaration[specialKeys.add] = adds
        declaration[specialKeys.remove] = removes
        return new Proxy(declaration, {
            get(target, prop) {
                return cssGet(target, prop)
            },
            set(target, prop, value) {
                return cssSet(target, prop, value)
            },
            has(target, prop) {
                return cssHas(target, prop)
            }
        })
    }
    const CSSStyleDeclaration = scope.CSSStyleDeclaration;
    proxyFunc(CSSStyleDeclaration.prototype, "getPropertyValue", (target, self, args) => {
        return self[args[0]] || ''
    }, {skipAbsent: false});
    proxyFunc(CSSStyleDeclaration.prototype, "setProperty", (target, self, args) => {
        return self[args[0]] = args[1]
    }, {skipAbsent: false});
    proxyFunc(CSSStyleDeclaration.prototype, "item", (target, self, args) => {
        let key = functionCall(target, self, args);
        if (key in self) return key
        return ''
    }, {skipAbsent: false});
    proxyFunc(CSSStyleDeclaration.prototype, "item", (target, self, args) => {
        let key = functionCall(target, self, args);
        if (key in self) return key
        return ''
    }, {skipAbsent: false});

    const HTMLElement = scope.HTMLElement;
    const CSSStyleRule = scope.CSSStyleRule;
    proxyGetter(HTMLElement.prototype, "style", (target, self, args) => {
        let value = functionCall(target, self, args);
        return proxy(value)
    }, {skipAbsent: false});
    proxyFunc(scope.window, "getComputedStyle", (target, self, args) => {
        let value = functionCall(target, self, args);
        return proxy(value)
    }, {skipAbsent: false});
    proxyGetter(CSSStyleRule.prototype, "style", (target, self, args) => {
        let value = functionCall(target, self, args);
        return proxy(value)
    }, {skipAbsent: false});
}


export function cheat(scope, browser) {
    if (browser.safeMode || !browser.uaInfo) {
        return false
    }
    let info = browser.uaInfo.engine
    if (!info.name) return false
    let vs = !info.version ? '0' : info.version;
    ///当浏览器特征不在表里面时跳过
    const IS_BLINK = info.name.toUpperCase() === 'BLINK'
    const IS_GECKO = info.name.toUpperCase() === 'GECKO'
    let version = Number(/\d+/.exec(vs + "")[0])
    if ((IS_BLINK && version < 76) || IS_GECKO && version < 71) {
        return false
    }
    let enginName = info.name
    let actions = featureActions(enginName, version)

    let {adds: {js: jsa, css: cssa, win: wina}, removes: {js: jsr, css: cssr, win: winr}} = actions
    jsFeatureCheat(scope, jsa, jsr)
    winFeatureCheat(scope, wina, winr)
    if (scope.constructor.name === "Window") cssFeatureCheat(scope, cssa, cssr)

    return true

}
