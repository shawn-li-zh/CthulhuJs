import {functionCall, proxyFunc} from "../kits/proxy";
import {fakeString} from "./nativeCheater";
import {toObject} from "../kits/objects";
import {specialKeys} from "../const";

const maxDeep = 3
const Date = self.Date

function iterHasTrace(coll, deep = 0) {
    if (deep > maxDeep) return false
    let i = 0;
    for (let item of coll) {
        if (i > 50) break
        i++;
        let trace = hasTrace(item, deep + 1);
        if (trace) return trace
    }
    return false
}

function hasTrace(val, deep = 0) {
    if (deep > maxDeep) return false
    if (val === null || val === undefined) return false
    let trace = val[specialKeys.trace];
    if (trace && 'path' in trace && 'handlers' in trace && 'source' in trace) {
        return trace
    }
    let ty = typeof val;
    if (ty !== 'object') {
        return false
    }
    if (val instanceof Map) {
        return iterHasTrace(val.values(), deep + 1)
    } else if (val instanceof Array) {
        return iterHasTrace(val, deep + 1)
    } else if (val instanceof Set) {
        return iterHasTrace(val, deep + 1)
    }
    if (val.constructor !== Object) return false
    let descriptors = Object.getOwnPropertyDescriptors(val);
    for (let key in descriptors) {
        if (typeof descriptors[key].get === 'function') {
            continue
        }
        let trace = hasTrace(val[key], deep + 1);
        if (trace) return trace
    }
    return false
}

export function trackingValue(val, trace) {
    if (val === null || val === undefined) return val
    let newVal = toObject(val)
    newVal[specialKeys.trace] = trace
    return newVal
}

// const arrayFunctions = [
//     "at",
//     "concat",
//     "copyWithin",
//     "fill",
//     "find",
//     "findIndex",
//     "findLast",
//     "findLastIndex",
//     "lastIndexOf",
//     "pop",
//     "push",
//     "reverse",
//     "shift",
//     "unshift",
//     "slice",
//     "sort",
//     "splice",
//     "includes",
//     "indexOf",
//     "join",
//     "keys",
//     "entries",
//     "values",
//     "forEach",
//     "filter",
//     "flat",
//     "flatMap",
//     "map",
//     "every",
//     "some",
//     "reduce",
//     "reduceRight",
//     "toReversed",
//     "toSorted",
//     "toSpliced",
//     "with",
//     "toLocaleString",
//     "toString"
// ]

const arrayFunctions = [
    // "concat",
    // "copyWithin",
    // "fill",
    // "pop",
    // "reverse",
    // "slice",
    "sort",
    "splice",
    "slice",
    "includes",
    "join",

    "filter",
    "map",//ytb 弹窗
    "reduce",
    // "reduceRight",

    "toReversed",
    "toSorted",
    "toSpliced",
    // "with",
]


function functionNatively(fn, type, name) {
    function get() {
        return name
    }

    get[specialKeys.native] = 2
    Object.defineProperty(fn, 'name', {get})

    function toString() {
        return fakeString(type, name)
    }

    toString[specialKeys.native] = 1
    Object.defineProperty(fn, 'toString', {
        value: toString
    })
}

export function traceArray(arrValue) {
    for (let arrayFunction of arrayFunctions) {
        let originFunc = arrValue[arrayFunction];
        if (typeof originFunc != 'function') continue
        // originFunc = originFunc.bind(arrValue)
        arrValue[arrayFunction] = function () {
            // let ov = originFunc(...arguments)
            return traceFunction('Array.' + arrayFunction, originFunc, this, arguments)
        }
        functionNatively(arrValue[arrayFunction], 'function', arrayFunction)
    }
}

export function injectable(browser, target) {
    if ((target !== null && target !== undefined) && browser.functionTrace) {
        if (!browser.dev) {
            let time = new Date().getTime();
            let number = (time - browser.start) / 1000;
            if (number > 30) {
                return false//超过30秒
            }
        }
        return true;
    }
    return false
}

function traceFunction(functionKey, target, self, args) {
    let trace = hasTrace(self);
    if (!trace) {
        trace = hasTrace(args)
        if (trace) {
            self[specialKeys.trace] = trace
        }
    }
    if (trace) {
        let handler = trace.handlers[functionKey];
        if (handler) {
            return handler(target, self, args, trace)//不追踪了
        }
        trace.path.push(functionKey)
        let originValue = functionCall(target, self, args)
        return trackingValue(originValue, trace)
    }
    return functionCall(target, self, args)
}

function tracePrototype(construct, name, browser) {
    if (!construct) return
    let descriptors = Object.getOwnPropertyDescriptors(construct.prototype);
    for (let key of Object.keys(descriptors)) {
        if (key === 'constructor' || typeof key == 'symbol') continue
        let value = descriptors[key].value;
        if (value) {
            if (typeof value == "function") {
                if (key === 'valueOf' || key === 'toString') continue
                proxyFunc(construct.prototype, key, (target, self, args) => {
                    let originValue = functionCall(target, self, args);
                    if (!injectable(browser, self)) {
                        return originValue
                    }
                    return traceFunction(name + '.' + key, originValue, self, args)
                });
            }
        }
    }
}

function traceArrayPrototype(construct, browser) {
    if (!construct) return
    let descriptors = Object.getOwnPropertyDescriptors(construct.prototype);
    for (let key of arrayFunctions) {
        let descriptor = descriptors[key];
        if (!descriptor || !descriptor.value) continue
        let value = descriptor.value;
        if (typeof value == "function") {
            if (key === 'valueOf' || key === 'toString') continue
            proxyFunc(construct.prototype, key, (target, self, args) => {
                if (!injectable(browser, self)) {
                    return functionCall(target, self, args)
                }
                return traceFunction('Array.' + key, target, self, args)
            });
        }
    }
}

export function cheat(scope, browser) {
    if (!browser.functionTrace) return false
    // tracePrototype(scope.String, 'String', browser)
    traceArrayPrototype(scope.Array, browser)
    // tracePrototype(scope.Set, 'Set', browser)
    // tracePrototype(scope.Map, 'Map', browser)

    // tracePrototype(scope.Int8Array, 'Array', browser)
    // tracePrototype(scope.Int16Array, 'Array', browser)
    // tracePrototype(scope.Int32Array, 'Array', browser)
    //
    // tracePrototype(scope.Uint8Array, 'Array', browser)
    // tracePrototype(scope.Uint16Array, 'Array', browser)
    // tracePrototype(scope.Uint32Array, 'Array', browser)
    //
    // tracePrototype(scope.Float32Array, 'Array', browser)
    // tracePrototype(scope.Float64Array, 'Array', browser)
    // tracePrototype(scope.BigInt64Array, 'Array', browser)
    // tracePrototype(scope.BigUint64Array, 'Array', browser)
    return true
}
