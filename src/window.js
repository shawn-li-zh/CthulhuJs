import {windowCheat, workerCheat} from "./cheaters/cheaterRun";
import {fill, getBrowserFromEnv} from "./browserFill";
import {specialKeys} from "./const";
import {proxyFunc} from "./kits/proxy";
// import "@babel/polyfill";
(
    () => {
        let self
        try {
            self = globalThis
        } catch (e) {

        }
        try {
            self = global
        } catch (e) {

        }
        const CHEAT = self.constructor.name === "Window" ? windowCheat : workerCheat;

        function run() {
            let scopeBrowser = getBrowserFromEnv();
            if (!scopeBrowser) {
                console.log("There is no injectable information on the current page...")
                return
            }
            if (scopeBrowser.start) {
                //执行过跳过
                return;
            }
            fill(scopeBrowser)
            console.log('%cInjected:' + scopeBrowser.name, 'color: green');
            try {
                CHEAT(self, scopeBrowser, 'direct');
                //触发
                if (document) {
                    document.getElementsByTagName("iframe")
                    //
                    for (let i = 0; i < self.length; i++) {
                        CHEAT(self[i], scopeBrowser, `self array [${i}]`)
                    }
                }
                if (scopeBrowser.functionTrace) {
                    proxyFunc(console, "clear", function (target, key, apply) {
                        return
                    })
                }
                scopeBrowser.status = 'ok'
            } catch (e) {
                scopeBrowser.status = 'err'
                console.error(e)
            }
        }

        self[specialKeys.SCOPE_CHEATER] = CHEAT
        CHEAT.run = run
        CHEAT.run()
    }
)();

