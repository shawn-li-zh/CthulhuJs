import {windowCheat, workerCheat} from "./cheaters/cheaterRun";
import {generateBrowser} from "./generate";
import {fill, getBrowserFromEnv} from "./browserFill";
import {specialKeys} from "./const";
import {TEMPLATE} from "./generate/types";
// import "@babel/polyfill";

(() => {
    function cheat(browser) {
        self[specialKeys.SCOPE_BROWSER] = browser
        const CHEAT = self.constructor.name === "Window" ? windowCheat : workerCheat;

        function run() {
            let scopeBrowser = getBrowserFromEnv();
            if (!scopeBrowser) {
                console.log("There is no injectable information on the current page...")
                return
            }
            fill(scopeBrowser)

            console.log('Injected:' + scopeBrowser.name);

            try {
                CHEAT(self, scopeBrowser, 'direct');
                //触发
                if (!document) return;
                // document.getElementsByTagName("iframe")
                for (let i = 0; i < self.length; i++) {
                    CHEAT(self[i], scopeBrowser, `self array [${i}]`)
                }
                scopeBrowser.status = 'ok'
            } catch (e) {
                scopeBrowser.status = 'err'
                console.error(e)
            }
        }

        self["SCOPE_CHEATER"] = CHEAT
        CHEAT.run = run
        run()
    }

    // let ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/130.0 Mobile/15E148 Safari/605.1.15"
    // ua+=' 555'
    // let ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
    let ua = ""
    // let ua = "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    let browser = generateBrowser(
        {
            ...TEMPLATE,
            seed: 0,
            safeMode: 1,
            webglSafeMode: 1,
            functionTrace: 0,
            disableWorker: 0,
            factors: {
                canvas: -1,
                voice: -1,
                clientRect: -1,
                audio: -1,
                fonts: -1,
                plugins: -1,
                webgl: -1,
                webgpu: -1,
            },
            webglInfo: {

            }
        },
        {
            userAgent: ua,
            deviceType: 'desktop'
        });

    cheat(browser)

})()



