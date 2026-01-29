import {functionCall, proxyConstruct, proxyGetter} from "../kits/proxy";


export function cheat(scope, browser) {
    if (!browser.humanLike) return false;
    proxyConstruct(scope, "UIEvent", (target, args, newTarget) => {
        let originValue = Reflect.construct(target, args, newTarget);
        if (!originValue) return originValue;
        return new Proxy(originValue, {
            get(target, p, receiver) {
                if (p === "isTrusted") return true;
                return Reflect.get(target, p, receiver)
            }
        })
    })
    const Navigator = scope.Navigator || scope.WorkerNavigator;
    if (!Navigator) return false
    proxyGetter(Navigator.prototype, "webdriver", (target, self, args) => {
        functionCall(target, self, args);
        return false
    }, {skipAbsent: true})
    //伪装浏览器可见性
    proxyGetter(Document.prototype, "visibilityState", (target, self, args) => {
        const ov = functionCall(target, self, args);
        if (ov === "hidden") {
            return "visible"
        }
        return ov
    }, {skipAbsent: true})

    proxyGetter(Document.prototype, "hidden", (target, self, args) => {
        const ov = functionCall(target, self, args);
        return false
    }, {skipAbsent: true})
    return true

}


