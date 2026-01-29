import Utils from "../kits/utils";

import {functionCall, proxyFunc} from "../kits/proxy";
import {specialKeys} from "../const";


export function cheat(scope, browser) {
    const factor = browser.factors.clientRect
    if (!factor) return false;
    const Element = scope.Element;
    if (!Element) return false
    proxyFunc(Element.prototype, "getClientRects", function (target, self, args) {
        let rects = functionCall(target, self, args);
        if (self[specialKeys.fake] || ['rect-known', 'rect-ghost', 'rects'].includes(self.className)) return rects
        let isZero = true
        for (let k in rects[0]) {
            if (k === 'toJSON') continue
            if (rects[0][k] !== 0 || rects[0][k] !== 0.0) {
                isZero = false;
                break
            }
        }
        if (isZero) return rects
        const noise = Utils.randomInt(factor, -999, 999) * 0.0001;
        // self.style.transform = `scale(${1 + noise})`;
        if (self.style.position === 'absolute') {
            let number = (self.style.left.match(/\d+/g) || []).map(Number)[0] || 0;
            self.style.left = number + noise + "px"
        } else {
            self.style.marginLeft = noise + '%'
            // self.style.marginTop = noise + '%'
        }
        self[specialKeys.fake] = 1
        return functionCall(target, self, args);
    }, {skipAbsent: false});
    return true
}
