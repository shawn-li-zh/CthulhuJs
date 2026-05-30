import {cheat as iframeCheater} from "./iframeCheater";
import {cheat as workerCheater} from "./workerCheater";
import {cheat as nativeCheater} from "./nativeCheater";
import {cheat as driverCheater} from "./driverCheater";
import {cheat as mediaCheater} from "./mediaCheater";
import {cheat as featureCheater} from "./featureCheater";
import {cheat as fontsCheater} from "./fontsCheater";
import {cheat as clientRectCheater} from "./clientRectCheater";
import {cheat as navigatorCheater} from "./navigatorCheater";
import {cheat as locationCheater} from "./locationCheater";
import {cheat as pluginCheater} from "./pluginCheater";
import {cheat as humanLikeCheater} from "./humanLikeCheater";

import {cheat as audioCheater} from "./audioCheater";
import {cheat as canvasCheater} from "./canvasCheater";
import {cheat as dateCheater} from "./dateCheater";
import {cheat as webrtcCheater} from "./webrtcCheater";
import {cheat as webglParamsCheater} from "./webglParamsCheater";
import {cheat as webglRenderCheater} from "./webglRenderCheater";
import {cheat as webgpuCheater} from "./webgpuCheater";
import {cheat as screenCheater} from "./screenCheater";
import {cheat as voiceCheater} from "./voiceCheater";
import {cheat as envCheater} from "./envCheater";


import {cheat as traceCheater} from "./traceCheater";
import {initAttach} from "../kits/proxy";
import {specialKeys} from "../const";

const LOG = console.log

let id = 0

export function windowCheat(scope, browser, source) {
    try {
        //测试访问是否跨域
        let windowCheat = scope[specialKeys.window];
        if (windowCheat) {
            // console.log("skip=== "+windowCheat)
            return
        }
        scope[specialKeys.SCOPE_BROWSER] = browser;
    } catch (e) {
        //跨域访问报错
        // scope[specialKeys.attach].warns.push(source + " cross domain")
        return LOG(source + " cross domain")
    }

    let scopeKey = source + '_' + (id++);
    const cheaters = {
        iframeCheater,//ps pass
        nativeCheater,//ps pass
        workerCheater,//ps pass
        featureCheater,//ps pass
        navigatorCheater,//安全模式下ps pass 貌似是请求头和getHighEntropyValues匹配的问题
        locationCheater,//ps pass
        pluginCheater,//ps pass
        screenCheater,//ps pass
        mediaCheater,//ps pass
        humanLikeCheater,
        driverCheater,//ps pass ,microsoft detach
        clientRectCheater,//ps pass
        dateCheater,//ps pass 时区和语言跟网络匹配
        audioCheater,//ps pass
        canvasCheater,//ps pass
        webglParamsCheater,//ps pass
        webglRenderCheater,//ps pass
        fontsCheater,//ps pass
        webgpuCheater,//ps pass
        webrtcCheater,//ps pass
        voiceCheater,//ps pass
        envCheater,//ps pass
        traceCheater//ps pass
    }

    try {
        let attach = scope[specialKeys.attach] || initAttach(scope);
        const enables = browser.enables || {}//{[k:string]:1|0}
        for (let [name, cheater] of Object.entries(cheaters)) {
            let key = name.replace("Cheater", "")
            if ((key in enables && !enables[key])) {
                continue
            }
            let b = cheater(scope, browser)
            if (b) attach.cheaters.push(key)
        }
        attach.isFirst = false
    } catch (e) {
        LOG('Injected failed: ', e, source)
    }

    LOG(`%c${scope.constructor.name.toUpperCase()} HAS CHEATED!!!!!!!!!!!!!!!!!!! FROM ${scopeKey || 'unknown'}`, 'color:green')
    scope[specialKeys.window] = scopeKey;
}

export function workerCheat(scope, browser, source) {
    try {
        //测试访问是否跨域
        if (scope.__workerCheat__) return
    } catch (e) {
        //跨域访问报错
        return scope[specialKeys.attach].warns.push(source + " cross domain")
    }
    const cheaters = {
        iframeCheater,
        nativeCheater,
        navigatorCheater,//安全模式下ps pass 貌似是请求头和getHighEntropyValues匹配的问题
        locationCheater,//ps pass
        pluginCheater,//ps pass
        humanLikeCheater,
        driverCheater,
        featureCheater,
        dateCheater,
        webrtcCheater,
        webglParamsCheater,//ps pass
        webglRenderCheater,//ps pass
        webgpuCheater,
        envCheater,//ps pass
    }
    try {

        let attach = scope[specialKeys.attach] || initAttach(scope)
        const enables = browser.enables || {}//{[k:string]:1|0}
        for (let [name, cheater] of Object.entries(cheaters)) {
            let key = name.replace("Cheater", "")
            if ((key in enables && !enables[key]) || attach.cheaters.includes(key)) {
                continue
            }
            let b = cheater(scope, browser)
            if (b && attach.isFirst) attach.cheaters.push(key)
        }
        attach.isFirst = false
    } catch (e) {
        LOG('Injected failed: ', e)
    }
    LOG(`${scope.constructor.name.toUpperCase()} HAS CHEATED!!!!!!!!!!!!!!!!!!! FROM ${source || 'unknown'}`)
    scope.__workerCheat__ = source
}
