import {functionCall, proxyFunc, proxyGetter} from "../kits/proxy";
import {infoHandler} from "./navigatorCheater";
import {objectCrawler} from "../kits/objects";
import {specialKeys} from "../const";

export function cheat(scope, browser) {
    const EventTarget = scope.EventTarget
    const MessageEvent = scope.MessageEvent
    let handler = infoHandler(browser);
    if (!handler.length) return false

    function isWorker(obj) {
        return (scope.Worker && obj instanceof scope.Worker) ||
            (scope.SharedWorker && obj instanceof scope.SharedWorker) ||
            (scope.MessagePort && obj instanceof scope.MessagePort) ||
            (scope.ServiceWorkerContainer && obj instanceof scope.ServiceWorkerContainer)
    }

    proxyFunc(EventTarget.prototype, "addEventListener", (target, self, args) => {
        if (!(isWorker(self))
        ) {
            return functionCall(target, self, args);
        }
        if (browser.disableWorker) return
        return functionCall(target, self, args);
    })
    proxyGetter(MessageEvent.prototype, 'data', (target, self, args) => {
        let data = self[specialKeys.fake] || functionCall(target, self, args);
        if (!isWorker(self.currentTarget)) {
            return data;
        }
        objectCrawler(data, handler)
        self[specialKeys.fake] = data;
        return data;
    })
    return true
}
