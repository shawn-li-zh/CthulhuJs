import Utils from "../kits/utils";
import {functionCall, proxyFunc} from "../kits/proxy";
import {injectable, trackingValue} from "./traceCheater";
import {specialKeys} from "../const";


const codeMapName = {
    37445: "UNMASKED_VENDOR_WEBGL",
    37446: "UNMASKED_RENDERER_WEBGL",
};

function parseProto(proto) {
    Object.keys(proto).forEach(k => {
        try {
            const v = proto[k]
            if (typeof v == 'number') {
                codeMapName[v] = k
            }
        } catch (e) {
            //报错忽略
        }
    })
}

parseProto(WebGLRenderingContext.prototype)
parseProto(WebGL2RenderingContext.prototype)

//

/**
 *
 * @param {WebGLRenderingContext|WebGL2RenderingContext}gl
 * @param {Object}browser
 * @param {number}code
 * @param {*}originValue
 * @returns {Number|*|string}
 */
function modify(gl, browser, code, originValue) {
    let factor = browser.factors.webgl;
    const webglInfo = browser.webglInfo || {}
    const name = codeMapName[code]
    if (name) {
        //取配置中的值
        const val = webglInfo[name];
        if (val !== undefined) {
            return val
        }
    }
    if (factor && typeof originValue == 'number') {
        let number = new Number(originValue);
        number.toString = function toString() {
            return Number.prototype.toString.call(number + factor, ...arguments)
        }
        number.toString[specialKeys.native] = 1
        return number;
    }
    return originValue
}


const handlers = {
    'Array.reduce': (target, self, args, trace) => {
        return 0
    },
    'Array.map': (target, self, args, trace) => {
        let ov = functionCall(target, self, args)
        if (ov[0]) {
            ov[0] = trackingValue(ov[0], trace)
        }
        return ov
    },
    'Array.sort': (target, self, args, trace) => {
        return ''
    }
}

export function cheat(scope, browser) {
    const factor = browser.factors.webglParams;
    const safeMode = browser.safeMode || 0;

    const WebGLRenderingContext = scope.WebGLRenderingContext;
    if (WebGLRenderingContext) {
        proxyFunc(WebGLRenderingContext.prototype, "getParameter", (target, self, args) => {
            let originValue = functionCall(target, self, args);
            originValue = modify(self, browser, args[0], originValue) || originValue;
            if (injectable(browser, originValue) && originValue instanceof Number && factor) {
                return trackingValue(originValue, {
                    source: "WebGL.param",
                    path: [],
                    handlers
                })
            }
            return originValue
        });
    }

    const WebGL2RenderingContext = scope.WebGL2RenderingContext;
    if (WebGL2RenderingContext) {
        proxyFunc(WebGL2RenderingContext.prototype, "getParameter", (target, self, args) => {
            let originValue = functionCall(target, self, args);
            originValue = modify(self, browser, args[0], originValue) || originValue;
            if (injectable(browser, originValue) && originValue instanceof Number && factor) {
                return trackingValue(originValue, {
                    source: "WebGL2.param",
                    path: [],
                    handlers
                })
            }
            return originValue
        });
    }

    return true
}
