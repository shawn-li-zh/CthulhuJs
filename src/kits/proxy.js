import Utils from "./utils";
import {specialKeys} from "../const";

class Temp {
    constructor() {
        this.value = ""
    }

    get get() {
    }

    set set(v) {
    }

    func() {
    }
}

const GET_ITEM = sessionStorage.getItem
const SET_ITEM = sessionStorage.setItem
const REMOVE_ITEM = sessionStorage.removeItem
const ARRAY_PUSH = Array.prototype.push
const SET_HAS = Set.prototype.has
const EVAL = self.eval
const LOG = console.log
const ScopeName = (self.constructor.name.replace("GlobalScope", ""));
const SELF = Utils.getGlobal();


export function initAttach(scope) {
    const debugs = {}
    let attach = {
        isFirst: true,
        errors: [],
        warns: [],
        debugs,
        logs: new Set(),
        proxies: [],
        cheaters: [],
        //exp:self.addDebugger('Navigator.vendor',5)
        addDebugger: (target, times) => {
            let key = "DEBUG:" + target;
            if (scope.sessionStorage) {
                SET_ITEM.apply(scope.sessionStorage, [key, times])
                return
            }
            debugs[key] = times
        },
        removeDebugger: (target) => {
            let key = "DEBUG:" + target;
            if (scope.sessionStorage) {
                REMOVE_ITEM.apply(scope.sessionStorage, [key])
                return
            }
            delete debugs[key]
        },
        isDebugger: (target) => {
            // let key = "DEBUG:" + target;
            // if (!scope.sessionStorage) {
            //     return false
            // }
            // let item = GET_ITEM.apply(scope.sessionStorage, [key]);
            // if (!item) return false
            // let times = item/1 || 0;
            // if (times > 0) {
            //     SET_ITEM.apply(scope.sessionStorage, [key, (times - 1) + ""])
            //     return true;
            // }
            return false
        }
    };
    scope[specialKeys.attach] = attach
    return attach;
}

const Object = SELF.Object;
const Date = SELF.Date;
let proxyId = 0;

/**
 * 函数apply
 * @template T
 * @template R
 * @callback Apply
 * @param {(target:(args:*[])=>R,self:T,args:*[])=>R} target - 函数对象
 * @param {T} self - this
 * @param {...*[]} args - 参数列表
 */

/**
 *
 * @param debugKey {string}
 * @param log {string}
 * @param fn {()=>*}
 * @param args {IArguments}
 * @returns {*}
 */
function proxyFn(debugKey, log, fn, args) {
    if (functionCall(SET_HAS, SELF[specialKeys.attach].logs, [debugKey])) {
        functionCall(LOG,console,[log, args])
    }
    if (SELF[specialKeys.attach].isDebugger(debugKey)) EVAL("debugger")
    // if (new Date().getTime()>=new Date(atob('MjAyNS0wOC0wNw==')).getTime()){
    //     return ''
    // }
    try {
        return fn()
    } catch (e) {
        functionCall(ARRAY_PUSH, SELF[specialKeys.attach].errors, [e])
        throw e;
    }
}

/**
 * @template T
 * @template R
 * @param {T} target
 * @param {string} key
 * @param {Apply<T,R>} apply
 * @param options
 * @returns {any}
 */
export function proxyGetter(target, key, apply, options = {skipAbsent: false}) {
    let descriptor = Object.getOwnPropertyDescriptor(target, key);
    const className = (typeof target === "function" ? target.name : target.constructor?.name) || "<unkonw>";
    const attach = SELF[specialKeys.attach];
    if (!descriptor) {
        if (options.skipAbsent) return
        attach.warns.push(`${ScopeName}: ${key} descriptor not in ${className}`)
        descriptor = Object.getOwnPropertyDescriptor(Temp.prototype, "get")
    }
    const log = `!!!${ScopeName}: 浏览器正在获取 ${className}.${key}`;
    const debugKey = `${className}.${key}`
    let val = descriptor.get;
    if (attach.isFirst) attach.proxies.push(`Getter:${debugKey}`)

    if (descriptor.get[specialKeys.native]) {
        return descriptor.get
    }

    class ScopeTemp {
        get fn() {
            let that = this;
            let args = arguments;
            return proxyFn(debugKey, log, () => {
                return apply(val, that, args)
            }, args)
        }
    }

    descriptor.get = Object.getOwnPropertyDescriptor(ScopeTemp.prototype, 'fn').get
    Object.defineProperty(descriptor.get, 'name', {value: "get " + key})

    descriptor.get[specialKeys.origin] = val
    descriptor.get[specialKeys.proxyId] = key + '_' + (proxyId++)
    descriptor.get[specialKeys.native] = 2
    Object.defineProperty(target, key, {...descriptor})
    return descriptor.get
}

/**
 * @template T
 * @param {T} target
 * @param {string} key
 * @param {Apply<T,void>} apply
 * @param options
 * @returns {*}
 */
export function proxySetter(target, key, apply, options = {skipAbsent: false}) {
    let descriptor = Object.getOwnPropertyDescriptor(target, key);
    const className = (typeof target === "function" ? target.name : target.constructor?.name) || "<unkonw>";
    const attach = SELF[specialKeys.attach];
    if (!descriptor) {
        if (options.skipAbsent) {
            attach.warns.push(`${ScopeName}: ${key} descriptor not in ${className}`)
            return
        }
        descriptor = Object.getOwnPropertyDescriptor(Temp.prototype, "set")
    }
    const log = `!!!${ScopeName}: 浏览器正在设置 ${className}.${key}`;
    const debugKey = `${className}.${key}`
    let val = descriptor.set;
    if (attach.isFirst) attach.proxies.push(`Setter:${debugKey}`)
    if (descriptor.set[specialKeys.native]) {
        return descriptor.set
    }

    class ScopeTemp {
        set fn(v) {
            let that = this;
            let args = arguments;
            return proxyFn(debugKey, log, () => {
                return apply(val, that, args)
            }, args)
        }
    }

    descriptor.set = Object.getOwnPropertyDescriptor(ScopeTemp.prototype, 'fn').set
    Object.defineProperty(descriptor.set, 'name', {value: "set " + key})

    descriptor.set[specialKeys.proxyId] = key + '_' + (proxyId++)
    descriptor.set[specialKeys.native] = 3
    Object.defineProperty(target, key, {...descriptor})
    return descriptor.set
}


/**
 * @template T
 * @template R
 * @param {T} target
 * @param {string} key
 * @param {Apply<T,R>} apply
 * @param options
 * @returns {*}
 */

export function proxyFunc(target, key, apply, options = {skipAbsent: false}) {
    let descriptor = Object.getOwnPropertyDescriptor(target, key);
    const className = (typeof target === "function" ? target.name : target.constructor?.name) || "<unkonw>";
    const attach = SELF[specialKeys.attach];
    if (!descriptor) {
        if (options.skipAbsent) {
            attach.warns.push(`${ScopeName}: ${key} descriptor not in ${className}`)
            return
        }
        descriptor = Object.getOwnPropertyDescriptor(Temp.prototype, "func");
    }
    const log = `!!!${ScopeName}: 浏览器正在调用 ${className}.${key}`;
    const debugKey = `${className}.${key}`
    let val = descriptor.value;
    if (attach.isFirst) attach.proxies.push(`Function:${debugKey}`)
    if (descriptor.value[specialKeys.native]) {
        return descriptor.value
    }

    class ScopeTemp {
        fn() {
            let that = this;
            let args = arguments;
            return proxyFn(debugKey, log, () => {
                return apply(val, that, args)
            }, args)
        }
    }

    descriptor.value = Object.getOwnPropertyDescriptor(ScopeTemp.prototype, 'fn').value
    Object.defineProperty(descriptor.value, 'name', {value: key})
    if (descriptor.value.length !== val.length) {
        Object.defineProperty(descriptor.value, 'length', {value: val.length})
    }

    descriptor.value[specialKeys.proxyId] = key + '_' + (proxyId++)
    descriptor.value[specialKeys.native] = 1
    descriptor.value[specialKeys.origin] = val
    Object.defineProperty(target, key, {...descriptor, writable: true})
    return descriptor.value
}

const rawCall = Function.prototype.call

/**
 *
 * @param target {Function}
 * @param self {any}
 * @param args {Array}
 * @returns {any}
 */
export function functionCall(target, self, args) {
    rawCall['call'] = rawCall
    return rawCall.call(target, ...[self, ...args])
}

// function proxySetProto(api) {
//     Object.defineProperty(api, '__proto__', {
//         set(proto) {
//             if (typeof proto !== 'function' && typeof proto !== 'object') {
//                 return api.__proto__ = proto;
//             }
//             if (this[specialKeys.proxyId]) {
//                 if (this[specialKeys.proxyId] === proto[specialKeys.proxyId]) {
//                     let typeError = new TypeError("Cyclic __proto__ value");
//                     typeError.stack = "TypeError: Cyclic __proto__ value\n" +
//                         "    at  set __proto__ (<anonymous>)\n" +
//                         "    at <anonymous>:1:22";
//                     throw typeError;
//                 }
//             }
//             return api.__proto__ = proto;
//         }
//     })
// }
/**
 *
 * @param {any} target
 * @param {string} classKey
 * @param {(target:function,args:*[],newTarget:function)=>*} apply
 * @param options
 * @returns {*}
 */
export function proxyConstruct(target, classKey, apply, options = {skipAbsent: false}) {
    let construct = target[classKey];
    const className = (typeof target === "function" ? target.name : target.constructor?.name) || "<unkonw>";
    const attach = SELF[specialKeys.attach];
    if (!construct) {
        if (options.skipAbsent) {
            attach.warns.push(`${ScopeName}: ${classKey} descriptor not in ${className}`)
            return
        }
        construct = Temp
    }
    const log = `!!!${ScopeName}: 浏览器正在构建 ${className}.${classKey}`;
    const debugKey = `${className}.${classKey}`
    if (attach.isFirst) attach.proxies.push(`Construct:${debugKey}`)

    function hook(target, args, newTarget) {
        return proxyFn(debugKey, log, () => {
            return apply(target, args, newTarget)
        }, args)

    }

    target[classKey] = new Proxy(construct, {
        get(target, p, receiver) {
            if (p === "constructor") return construct;
            if (p === specialKeys.origin) return construct
            return Reflect.get(target, p, receiver)
        },
        construct(target, args, newTarget) {
            return hook(target, args, newTarget,)
        }
    });
    proxyFunc(construct, "constructor", hook)

    target[classKey][specialKeys.proxyId] = classKey + '_' + (proxyId++)
    target[classKey][specialKeys.native] = 1
}

/**
 *
 * @param {*} target
 * @param {string} key
 * @param {*} value
 */
export function proxyValue(target, key, value) {
    try {
        //相等则不修改
        if (target[key] === value) return;
        target[key] = value;
        if (target[key] === value) return;//如果直接修改没报错且修改成功则返回
    } catch (e) {
        //赋值报错
        let prototype = Object.getPrototypeOf(target);
        proxyGetter(prototype, key, () => {
            // target.call(self, ...args);
            return value;
        });
        return;
    }
    let descriptor = Object.getOwnPropertyDescriptor(target, key);
    if (!descriptor) {
        descriptor = Object.getOwnPropertyDescriptor(new Temp(), "value")
    }
    if (descriptor.value) {
        descriptor.value = value
        Object.defineProperty(target, key, {...descriptor, writable: true})
        return;
    }
    proxyGetter(target, key, () => {
        // target.call(self, ...args);
        return value;
    });
}


export function protoExposure(prototype) {
    if (!prototype) return
    let descriptors = Object.getOwnPropertyDescriptors(prototype);
    Object.keys(descriptors).forEach(key => {
        let descriptor = descriptors[key];
        if (typeof descriptor.get === "function") {
            proxyGetter(prototype, key, (target, self, value) => {
                return Reflect.get(target, self, value)
            });
        }
        if (typeof descriptor.set === "function") {
            proxySetter(prototype, key, (target, self, value) => {
                return Reflect.set(target, self, value)
            });
        }
        if (typeof descriptor.value !== "function") return
        if (key === "constructor") {
            proxyConstruct(prototype, key, (target, self, value) => {
                return Reflect.construct(target, self, value)
            });
            return;
        }
        proxyFunc(prototype, key, (target, self, value) => {
            return target.call(self, ...value);
        })
    })
}

/**
 * 代理数组的行为
 * @param arr
 * @param getter
 * @param setter
 * @param reflectFn
 */

export function proxyArray(arr, getter, setter, reflectFn = []) {
    let reflectFns = new Set(reflectFn)
    let prototype = Object.getPrototypeOf(arr);
    return new Proxy(arr, {
        get(target, index, receiver) {
            if (typeof index == 'symbol') {
                return Reflect.get(target, index, receiver)
            }
            if (Object.hasOwn(prototype, index) || !getter) {
                if (reflectFns.has(index)) {
                    return Reflect.get(target, index, receiver)
                }
                let val = target[index];
                if (typeof val == 'function') {
                    return val.bind(arr)
                }
                return val;
            }
            return getter(arr, index)
        },
        set(target, index, newValue, receiver) {
            if (Object.hasOwn(prototype, index) || !setter) {
                return Reflect.set(target, index, newValue, receiver)
            }
            return setter(arr, index, newValue)
        },
    });
}

// let a = [1, 2, 3, 4, 5, 6]
// let b = proxyArray(a, (arr, i) => arr[i], undefined, [])
// let [i, i1, i2, i3] = b;

// const rawCall = Function.prototype.call
// rawCall['call'] = rawCall
//
// export function functionCall(target, self, args) {
//     return rawCall.call(target, ...[self, ...args])
// }
//
// class A {
//     aaa(a, b) {
//         console.log(this,a, b)
//     }
// }
// let fn=A.prototype.aaa
// functionCall(fn, new A(), [1,2])
