import Utils from "../kits/utils";
import {functionCall, proxyFunc} from "../kits/proxy";


const VAR = "gl_FragColor"
// 正则表达式匹配 gl_FragColor 的赋值语句
const FRAG_COLOR_REGEX = /gl_FragColor\s*=\s*(.+);/;

export function cheat(scope, browser) {
    const factor = browser.factors.webgl;
    const safeMode = browser.safeMode || 0;
    let rand = new Utils.Random(factor);
    const max = 10000
    let offset = rand.int(-max, max) / (max * 10)
    const modifyVertexOffset = (source) => {
        if (!source || typeof source != 'string') return source
        return source.replace(/gl_Position\s*=/i, "gl_Position = " + offset + " + ")
    }
    let rgbOffsetFn = () => {
        let r = rand.int(-50, 50) / 20,
            g = rand.int(-50, 50) / 20,
            b = rand.int(-50, 50) / 20;
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
