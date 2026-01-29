import Utils from "../kits/utils";
import {functionCall, proxyFunc} from "../kits/proxy";

const arrayIncludes = Array.prototype.includes

/**
 *
 * @param scope {Window|WorkerGlobalScope}
 * @param browser
 * @returns {boolean}
 */
export function cheat(scope, browser) {
    const factor = browser.factors.audio
    if (!factor) return
    const safeMode = browser.safeMode || 0

    const AudioBuffer = scope.AudioBuffer;
    const AnalyserNode = scope.AnalyserNode;

    /**
     *
     * @param buffer {AudioBuffer}
     */
    function modifyBuffer(buffer) {
        let lastI = 0
        const skips = [-1, 0, 1]

        let times = Utils.randomPeek(factor, buffer, (v, j) => {
            if (!functionCall(arrayIncludes, skips, [v])) {
                if (lastI > 0 && !functionCall(arrayIncludes, skips, [buffer[lastI]])) {
                    let temp = buffer[lastI]
                    buffer[lastI] = v;
                    lastI = 0
                    return temp
                }
                lastI = j
            }
            return undefined;
        }, 1, Math.min(buffer.length, 1024));
        //随机噪音太容易被求和检测
        // let  times = Utils.randomNoise(factor, buffer, [0])
        //随机交换 命中有效的值 概率太低了
        // times = Utils.randomSwap(factor, buffer, {loopTimes: 100, unit: 8, times: 16, skips: []})
    }

    proxyFunc(AudioBuffer.prototype, "getChannelData", (target, self, args) => {
        let buffer = functionCall(target, self, args);
        if (!buffer) return buffer;
        modifyBuffer(buffer)
        return buffer
    });
    //解决samples mismatch
    proxyFunc(AudioBuffer.prototype, "copyFromChannel", (target, self, args) => {
        let originValue = functionCall(target, self, args);
        if (args[0]) {
            modifyBuffer(args[0])
        }
        return originValue
    });

    proxyFunc(AnalyserNode.prototype, 'getFloatFrequencyData', (target, self, args) => {
        let originValue = functionCall(target, self, args);
        if (args[0]) {
            //直接加噪音 使特征具有唯一性
            let times = Utils.randomNoise(factor, args[0], [0])
        }
        return originValue
    }, {skipAbsent: true})

    proxyFunc(AnalyserNode.prototype, 'getFloatTimeDomainData', (target, self, args) => {
        let originValue = functionCall(target, self, args);
        if (args[0]) {
            //直接加噪音 使特征具有唯一性
            let times = Utils.randomNoise(factor, args[0], [0])
        }
        return originValue
    }, {skipAbsent: true})
    return true
}
