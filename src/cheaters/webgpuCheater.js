import Utils from "../kits/utils";
import {functionCall, proxyGetter} from "../kits/proxy";


export function cheat(scope, browser) {
    const factor = browser.factors.webgpu;
    const webglInfo = browser.webglInfo || {}
    const vendor = webglInfo['UNMASKED_VENDOR_WEBGL']
    if (!vendor && !factor) return false
    const GPUAdapterInfo = scope.GPUAdapterInfo;
    const GPUSupportedLimits = scope.GPUSupportedLimits;
    // const GPUDevice = scope.GPUDevice;

    if (GPUAdapterInfo && vendor) {
        //隐藏WebGPU信息 Google Inc. (NVIDIA) => nvidia
        proxyGetter(GPUAdapterInfo.prototype, "vendor", (target, self, args) => {
            let ov = functionCall(target, self, args);//触发Illegal invocation
            if (vendor) {
                let m = (/\(.+\)/.exec(vendor) || [])[0];
                if (!m) return ""
                let t = m.substring(1, m.length - 1);
                return t.toLowerCase();
            }
            return ov;
        });

        // protoExposure(GPUDevice.prototype)
    }
    if (GPUSupportedLimits && factor) {
        let descriptors = Object.getOwnPropertyDescriptors(GPUSupportedLimits.prototype);
        //给数字常量添加随机干扰
        Object.keys(descriptors).forEach(key => {
            if (typeof descriptors[key].get !== "function") return
            proxyGetter(GPUSupportedLimits.prototype, key, (target, self, args) => {
                let originValue = functionCall(target, self, args);
                if (originValue <= 64) return originValue;
                let number = Utils.randomInt(factor, 0, 10) * 2;
                if (originValue % 2 === 0) {
                    return originValue - ((number / 2) | 0)
                }
                return originValue - number - 1
            }, {skipAbsent: true})
        });
    }

    return true
}
