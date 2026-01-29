import Utils from "../kits/utils";
import {functionCall, proxyFunc} from "../kits/proxy";


export function cheat(scope, browser) {
    const factor = browser.factors.voice
    if (!factor) return false
    const SpeechSynthesis = scope.SpeechSynthesis;
    if (!SpeechSynthesis) return false
    proxyFunc(SpeechSynthesis.prototype, 'getVoices', (target, self, args) => {
        let arr = functionCall(target, self, args);
        if (arr instanceof Array) {
            let last = -1, temp = undefined
            Utils.randomPeek(factor, arr, (v, i) => {
                if (last >= 0) {
                    arr[last] = v;
                    last = -1;
                    return temp
                }
                last = i;
                temp = arr[i]
            }, 1, arr.length);
        }
        return arr;
    }, {skipAbsent: true})
    return true
}
