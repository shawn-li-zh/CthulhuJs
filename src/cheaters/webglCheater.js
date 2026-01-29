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

const VAR = "gl_FragColor"
// 正则表达式匹配 gl_FragColor 的赋值语句
const FRAG_COLOR_REGEX = /gl_FragColor\s*=\s*(.+);/;

export function cheat(scope, browser) {
    const factor = browser.factors.webgl;
    const safeMode = browser.safeMode || 0;

    const max = 10000
    let offset = Utils.randomInt(factor, -max, max) / (max * 10)
    const modifyVertexOffset = (source) => {
        if (!source || typeof source != 'string') return source
        return source.replace(/gl_Position\s*=/i, "gl_Position = " + offset + " + ")
    }
    let rgbOffsetFn = () => {
        let r = Utils.randomInt(factor + 1, -50, 50) / 20,
            g = Utils.randomInt(factor + 2, -50, 50) / 20,
            b = Utils.randomInt(factor + 3, -50, 50) / 20;
        return 'vec4(' + r + ',' + g + ',' + b + ',0)'
    }
    let rgbOffset = rgbOffsetFn()

    /**
     * @param {string}shaderSource
     */
    function processFragmentShader(shaderSource) {
        const match = shaderSource.match(FRAG_COLOR_REGEX);
        if (match) {
            const rgbaValues = match[1].split(/[,+\-*/()]/).map(value => value.trim());
            const constantCount = rgbaValues.filter(value => !isNaN(parseFloat(value))).length;
            // 如果有两个以上的数值是常量
            if (constantCount >= 3) {
                return shaderSource;
            } else {
                // 替换 gl_FragColor 的赋值语句
                const newFragColor = `${VAR} = ${rgbOffset} + ${match[1]};`;
                return shaderSource.replace(FRAG_COLOR_REGEX, newFragColor);
            }
        }
        return shaderSource;
    }

    const modifyFragmentOffset = (source) => {
        if (!source || typeof source != 'string') return source
        return processFragmentShader(source)
    }
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
        if (factor) {
            proxyFunc(WebGLRenderingContext.prototype, "shaderSource", (target, self, args) => {
                args = [...args]
                if (args[1]) {
                    // args[1] = modifyVertexOffset(args[1])
                    args[1] = modifyFragmentOffset(args[1])
                }
                return functionCall(target, self, args);
            });
        }
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
        if (factor) {
            proxyFunc(WebGL2RenderingContext.prototype, "shaderSource", (target, self, args) => {
                args = [...args]
                if (args[1]) {
                    // args[1] = modifyVertexOffset(args[1])
                    args[1] = modifyFragmentOffset(args[1])
                }
                return functionCall(target, self, args);
            });
        }
    }

    return true
}
