//只需要被判断为原生的函数，不管环境中有没有

import {functionCall, proxyConstruct, proxyFunc} from "../kits/proxy";
import {specialKeys} from "../const";


export function fakeString(type = '', name) {
    switch (type) {
        case 'get':
            return `function ${name.startsWith("get ") ? name : 'get ' + name}() { [native code] }`
        case 'set':
            return `function ${name.startsWith("set ") ? name : 'set ' + name}() { [native code] }`
        default :
            return `function ${name}() { [native code] }`
    }
}

let specialKeyValues = Object.values(specialKeys);
const includesFn = Array.prototype.includes

export function cheat(scope) {
    const CObject = scope.Object;
    const Function = scope.Function;
    const CReflect = scope.Reflect
    //非proxy函数本地化伪装
    proxyFunc(CObject.prototype, "hasOwnProperty", (target, self, args) => {
        let originValue = functionCall(target, self, args);
        if (typeof self !== 'function') return originValue
        if (!self[specialKeys.native]) return originValue
        if (functionCall(includesFn, ['arguments', 'caller', 'toString', 'prototype'], [args[1]])) {
            return false
        }
        return originValue
    }, {skipAbsent: false})
    CObject.hasOwnProperty = CObject.prototype.hasOwnProperty
    // //去除特殊标记
    //native函数转字符
    let toStringFunc = function (target, self, args) {
        let ty = typeof self;
        if ((ty !== "function" && ty !== "object") || !self) {
            return functionCall(target, self, args);
        }
        let native = self[specialKeys.native];
        let create = self[specialKeys.create];
        try {
            //判断是否是伪装函数 不是伪装函数则返回真实值
            if (!native || create) return functionCall(target, self, args);
        } catch (e) {
            //代理函数报错时位置是Object.toString 会暴露所以需要修改报错信息
            if (e instanceof TypeError && self[specialKeys.proxyId]) {
                if (!self[specialKeys.isProxy]) {
                    e.stack = "TypeError: Function.prototype.toString requires that 'this' be a Function\n" +
                        "    at Function.toString (<anonymous>)\n" +
                        "    at <anonymous>:1:55"
                } else {
                    e.stack = "TypeError: Function.prototype.toString requires that 'this' be a Function\n" +
                        "    at Object.toString (<anonymous>)\n" +
                        "    at <anonymous>:1:34"
                }
            }
            throw e;
        }
        let type = native === 1 ? 'function' : (native === 2 ? 'get' : 'set')
        return fakeString(type, self.name)
    }
    // proxyFunc(Function, "toString", toStringFunc)
    proxyFunc(Function.prototype, "toString", toStringFunc, {skipAbsent: false})
    //
    proxyFunc(CObject, "create", (target, self, args) => {
        //当创建的是代理函数时
        if (args[0] && args[0][specialKeys.proxyId]) {
            let originValue = functionCall(target, self, args);
            originValue[specialKeys.proxyId] = args[0][specialKeys.proxyId]
            originValue[specialKeys.isProxy] = args[0][specialKeys.isProxy]
            originValue[specialKeys.create] = 1
            return originValue;
        }
        return functionCall(target, self, args);
    }, {skipAbsent: false});


    function handleKeys(target, self, args) {
        let keys = functionCall(target, self, args);
        if (!keys || !self) return keys;
        try {
            let adds = args[0][specialKeys.add] || (Object.getPrototypeOf(args[0]) || {}).constructor[specialKeys.add] || []
            let removes = args[0][specialKeys.remove] || (Object.getPrototypeOf(args[0]) || {}).constructor[specialKeys.remove] || []
            let removeList = [...removes, ...specialKeyValues,]
            keys = keys.filter(v => {
                let b = functionCall(includesFn, removeList, [v])
                return !b;
            })
            adds.forEach(item => keys.push(item))
            return [...keys]
        } catch (e) {
            scope[specialKeys.attach].errors.push(e)
            return keys;
        }

    }

    proxyFunc(CObject, "keys", handleKeys, {skipAbsent: false});
    proxyFunc(CObject, "getOwnPropertyNames", handleKeys, {skipAbsent: false});
    proxyFunc(CReflect, "ownKeys", handleKeys, {skipAbsent: false});

    proxyFunc(CObject, "getOwnPropertyDescriptor", (target, self, args) => {
        let originValue = functionCall(target, self, args);
        if (!originValue || !self || !args[1]) return originValue;
        if (originValue.value && (originValue.value instanceof Window || originValue.value['top'] instanceof Window)) {
            //测试是否跨域
            try {
                originValue.value[0]
            } catch (e) {
                //跨域,返回原值
                return originValue
            }
        }
        let key = args[1]
        if (
            (originValue.value && originValue.value[specialKeys.proxyId]) ||
            (originValue.get && originValue.get[specialKeys.proxyId]) ||
            (originValue.set && originValue.set[specialKeys.proxyId])
        ) {
            if (specialKeyValues.includes(key)) return undefined
        }

        let removes = self[specialKeys.remove] || (Object.getPrototypeOf(self) || {}).constructor[specialKeys.remove] || []
        if (removes.includes(key)) return undefined
        let adds = self[specialKeys.add] || (Object.getPrototypeOf(self) || {}).constructor[specialKeys.add] || []
        if (adds.includes(key)) return originValue || {
            configurable: true,
            enumerable: true,
            value: undefined,
            writable: true
        }
        return originValue
    }, {skipAbsent: false});

    proxyFunc(CObject, "getOwnPropertyDescriptors", (target, self, args) => {
        let originValue = functionCall(target, self, args);
        if (!originValue || !self) return originValue;
        let removes = self[specialKeys.remove] || (Object.getPrototypeOf(self) || {}).constructor[specialKeys.remove] || []
        let adds = self[specialKeys.add] || (Object.getPrototypeOf(self) || {}).constructor[specialKeys.add] || [];
        let removeList = [...removes, ...specialKeyValues,];

        removeList.forEach(item => {
            delete originValue[item]
        })
        adds.forEach(item => {
            originValue[item] = originValue[item] || {
                configurable: true,
                enumerable: true,
                value: 1,
                writable: true
            }
        })
        return originValue
    }, {skipAbsent: false});

    proxyConstruct(scope, 'Proxy', (target, argArray, newTarget) => {
        let handler = argArray[1];
        if (argArray[0] && handler) {
            let get = handler.get;
            let proxyId = argArray[0][specialKeys.proxyId]
            if (proxyId) {
                let newGet = (target, p, receiver) => {
                    if (p === specialKeys.isProxy) {
                        return true
                    }
                    if (p === specialKeys.proxyId) {
                        return proxyId
                    }
                    if (get) {
                        return get(target, p, receiver)
                    } else {
                        return Reflect.get(target, p, receiver)
                    }
                }
                argArray[1] = {...handler, get: newGet}
            }
        }
        return Reflect.construct(target, argArray, newTarget);
    }, {skipAbsent: false})

    return true
}
