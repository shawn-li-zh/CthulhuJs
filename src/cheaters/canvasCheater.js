import {functionCall, proxyFunc} from "../kits/proxy";
import Utils from "../kits/utils";
import {injectable, traceArray} from "./traceCheater";
import {specialKeys} from "../const";


const LOG = console.log
//(STEP+1%4)=0
const STEP = 3;
//小于这个数的图像不干扰
const MIN_SIZE = 5;
//最大干扰尺寸
const MAX_SIZE = 300;
//允许的最小透明度
const MIN_ALPHA_VALUE = 255;
const ALPHA_INDEX = 4;
const MAX_DIFF = 5;

function swap(data, i, j) {
    let temp = data[i]
    // if (Math.abs(temp - data[j]) > 30) return// 防止差距大 浏览器Alpha预乘
    data[i] = data[j]
    data[j] = temp;
}

const canvasCtxFn = {
    "OffscreenCanvasRenderingContext2D": {
        getImageData: OffscreenCanvasRenderingContext2D.prototype.getImageData,
        putImageData: OffscreenCanvasRenderingContext2D.prototype.putImageData,
    }, "CanvasRenderingContext2D": {
        getImageData: CanvasRenderingContext2D.prototype.getImageData,
        putImageData: CanvasRenderingContext2D.prototype.putImageData,
    }
}

/**
 *
 * @param {ImageData}imageData
 * @param {number}factor
 */
function handleImageData(imageData, factor) {
    if (!imageData) return
    if (imageData.colorSpace !== 'srgb') return;


    let data = imageData.data;
    let w = imageData.width * 4;
    let h = imageData.height * 4;
    let times = Utils.randomPeek(factor, data, (a, j) => {
        //防Alpha预乘
        if (!a || (j + 1) % ALPHA_INDEX || a < MIN_ALPHA_VALUE) return
        let r = data[j - 3], g = data[j - 2], b = data[j - 1];
        if (!r || !g || !b) return;
        //检测四周的alpha值
        let row = j / w;
        let col = j % w;
        let topA = data[w * (row - 1) + col]
        let btmA = data[w * (row + 1) + col]
        let leftA = data[col > 4 ? col + 4 : -1]
        let rightA = data[col < w ? col - 4 : -1]
        if (
            (topA && topA < MIN_ALPHA_VALUE) ||
            (btmA && btmA < MIN_ALPHA_VALUE) ||
            (leftA && leftA < MIN_ALPHA_VALUE) ||
            (rightA && rightA < MIN_ALPHA_VALUE)
        ) return
        //确保第二次不会重新交换
        // if (data[j - 1] <= data[j - 2]) return;
        //检查交换后，再读取是否一致
        // if (!checkPixel(data[j - 3], data[j - 1], data[j - 2], v, j)) {
        //     // sus.push([data[j - 3], data[j - 2], data[j - 1], v])
        //     return;
        // }
        //相差大跳过
        // if (Math.abs(g - b) > MAX_DIFF) return

        swap(data, j - 1, j - 2)
        return a;
    }, STEP, 10)
    // console.log(sus)
}

/**
 * 创建一个包含原始内容副本的影子画布，并对其施加指纹干扰
 * 核心修复：避免直接修改原 Canvas 导致的 GPU 精度不一致
 * @param {HTMLCanvasElement|OffscreenCanvas} originalCanvas
 * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} originCtx
 * @param {number} factor
 * @returns {[HTMLCanvasElement|OffscreenCanvas,CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D]} 处理后的影子画布
 */
function getNoisedShadowContext(originalCanvas,
                                originCtx,
                                factor) {
    const width = originalCanvas.width;
    const height = originalCanvas.height;
    // 1. 创建同类型的影子画布
    let shadow;
    let ContextType;
    const OffscreenCanvas = self.OffscreenCanvas;

    if (OffscreenCanvas && originalCanvas instanceof OffscreenCanvas) {
        shadow = new OffscreenCanvas(width, height);
        ContextType = 'OffscreenCanvasRenderingContext2D';
    } else {
        shadow = document.createElement('canvas');
        shadow.width = width;
        shadow.height = height;
        ContextType = 'CanvasRenderingContext2D';
    }

    const nativeGet = canvasCtxFn[ContextType].getImageData;
    const nativePut = canvasCtxFn[ContextType].putImageData;

    const shadowCtx = shadow.getContext('2d', {willReadFrequently: true});
    const processWidth = Math.min(width, MAX_SIZE);
    const processHeight = Math.min(height, MAX_SIZE);

    let imageData = functionCall(nativeGet, originCtx, [0, 0, processWidth, processHeight]);
    handleImageData(imageData, factor);
    functionCall(nativePut, shadowCtx, [imageData, 0, 0]);
    return [shadow, shadowCtx];
}

export function cheat(scope, browser) {
    const factor = browser.factors.canvas
    if (!factor) return false
    let safeMode = browser.safeMode;
    const HTMLCanvasElement = scope.HTMLCanvasElement
    const CanvasRenderingContext2D = scope.CanvasRenderingContext2D
    let id = 1

    function objId(obj) {
        if (!obj['__id__']) {
            obj['__id__'] = id++
        }
        return obj['__id__']
    }
    /**
     *
     * @param {()=>ImageData}target
     * @param self {CanvasRenderingContext2D}
     * @param args
     * @returns {ImageData}
     */
    function getImageData(target, self, args) {
        const fn = canvasCtxFn[self.constructor.name]
        if (!fn) {
            return functionCall(target, self, args)
        }
        let image = functionCall(fn.getImageData, self, args);
        if (!image || !image.data) return image
        if (args) {
            let [x, y, w, h] = args;
            //如果执行过填充 可能画布里指定了填充的内容，做干扰很容易对比出来
            //固定为1 再大会被引擎匹配检测出来
            if (w <= 1 && h <= 1) {
                return image
            }
        }
        const [shadowCanvas, shadowCtx]
            = getNoisedShadowContext(self.canvas, self, factor)
        image = functionCall(fn.getImageData, shadowCtx, args);
        if (image && injectable(browser, image.data)) {
            traceArray(image.data)
            image.data[specialKeys.trace] = {
                source: 'Canvas.image',
                path: [],
                handlers: {
                    'Array.includes': (target, self, args, trace) => {
                        let p = trace.path[trace.path.length - 1]
                        if (p === 'Array.join') {
                            return true
                        }
                        return functionCall(target, self, args);
                    }
                }
            }
        }
        return image
    }

    /**
     *
     * @param {HTMLCanvasElement}canvas
     * @returns {void|CanvasRenderingContext2D}
     */
    function getContent(canvas) {
        const {width, height} = canvas;
        if (width <= MIN_SIZE && height <= MIN_SIZE) return;
        return canvas.getContext('2d');
    }

    /**
     *
     * @param target
     * @param self {HTMLCanvasElement}
     * @param args
     * @returns {*}
     */
    function wrap(target, self, args) {
        let context = getContent(self)
        if (!context) return functionCall(target, self, args);
        const [shadowCanvas, shadowCtx]
            = getNoisedShadowContext(self, context, factor)
        return functionCall(target, shadowCanvas, args);
    }

    proxyFunc(CanvasRenderingContext2D.prototype, "getImageData", getImageData);
    proxyFunc(HTMLCanvasElement.prototype, "toBlob", wrap)
    proxyFunc(HTMLCanvasElement.prototype, "toDataURL", wrap);

    const OffscreenCanvas = scope.OffscreenCanvas;
    const OffscreenCanvasRenderingContext2D = scope.OffscreenCanvasRenderingContext2D;

    if (OffscreenCanvas && OffscreenCanvasRenderingContext2D) {
        proxyFunc(OffscreenCanvasRenderingContext2D.prototype, "getImageData", getImageData);
        proxyFunc(OffscreenCanvas.prototype, "convertToBlob", wrap);

    }
    return true
}
