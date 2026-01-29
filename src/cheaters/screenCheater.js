import Utils from "../kits/utils";
import {setMedia} from "./mediaCheater";
import {functionCall, proxyGetter, proxyValue} from "../kits/proxy";

const ratio = {
    height: 0.0747,
    width: 0.0175,
}

export function cheat(scope, browser) {

    //dpr=screen.size/outer-size
    //screen.availWidth：可用的屏幕宽度，通常小于或等于 screen.width。
    const Screen = scope.Screen;
    if (!Screen) return false
    if (!browser.screen) return false;
    if (!(browser.screen.noise
        || browser.screen.width
        || browser.screen.height
        || browser.screen.dpr
        || browser.screen.scheme
        || browser.screen.colorDepth
        || browser.screen.pixelDepth
    )) return false;

    if (browser.screen?.dpr && scope.window.devicePixelRatio / 1 != browser.screen?.dpr / 1) {
        proxyValue(scope.window, "devicePixelRatio", browser.screen.dpr);//引发ps检测失败
        setMedia('resolution', browser.screen.dpr + 'dppx')
    }
    if (browser.screen?.scheme) {
        setMedia('prefers-color-scheme', browser.screen?.scheme)
    }
    if (browser.screen?.pixelDepth) {
        proxyGetter(Screen.prototype, "pixelDepth", (target, self, args) => {
            let ov = functionCall(target, self, args);//触发Illegal invocation
            return browser.screen.pixelDepth || ov
        });
    }
    if (browser.screen?.colorDepth) {
        proxyGetter(Screen.prototype, "colorDepth", (target, self, args) => {
            let ov = functionCall(target, self, args);//触发Illegal invocation
            return browser.screen.colorDepth || ov
        });
    }
    const noiseFactor = browser.screen.noise;
    let {width, height} = scope.screen;
    let fakeWidth = width, fakeHeight = height;

    //引发ps检测失败
    if (noiseFactor) {
        const ratio = Utils.randomInt(noiseFactor, -50, 50) / 1000;
        // const noise = 0;
        fakeWidth = width * (1 + ratio) | 0;
        fakeHeight = height * (1 + ratio) | 0;
    } else {
        let {width, height} = browser.screen
        fakeWidth = width;
        fakeHeight = height;
    }
    let wr = fakeWidth / width
    let hr = fakeHeight / height
    proxyGetter(Screen.prototype, "width", (target, self, args) => {
        let ov = functionCall(target, self, args);//触发Illegal invocation
        return (ov * wr) | 0
    });
    proxyGetter(Screen.prototype, "height", (target, self, args) => {
        let ov = functionCall(target, self, args);//触发Illegal invocation
        return (ov * hr) | 0
    });
    setMedia('device-width', fakeWidth + 'px')
    setMedia('device-height', fakeHeight + 'px')

    function widthFn(target, self, args) {
        let ov = functionCall(target, self, args);//触发Illegal invocation
        return (wr * ov) | 0;
    }

    function heightFn(target, self, args) {
        let ov = functionCall(target, self, args);//触发Illegal invocation
        return (hr * ov) | 0;
    }

    //
    proxyGetter(Screen.prototype, "availWidth", widthFn)
    proxyGetter(Screen.prototype, "availHeight", heightFn);

    proxyGetter(scope, "outerWidth", widthFn);
    proxyGetter(scope, "outerHeight", heightFn);
    proxyGetter(scope, "innerWidth", widthFn);
    proxyGetter(scope, "innerHeight", heightFn);

    //
    const VisualViewport = scope.VisualViewport;

    if (VisualViewport) {
        proxyGetter(VisualViewport.prototype, "width", widthFn)
        proxyGetter(VisualViewport.prototype, "height", heightFn)
        proxyGetter(VisualViewport.prototype, "pageTop", (target, self, args) => {
            functionCall(target, self, args);//触发Illegal invocation
            return 0
        })
    }
    const ScreenOrientation = scope.ScreenOrientation;
    if (ScreenOrientation) {
        proxyGetter(ScreenOrientation.prototype, "type", (target, self, args) => {
            functionCall(target, self, args);//触发Illegal invocation
            return 'landscape-primary'
        })
    }

    return true
}
