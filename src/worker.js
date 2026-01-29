import {workerCheat} from "./cheaters/cheaterRun";
import {fill} from "./browserFill";
import {specialKeys} from "./const";
// import "@babel/polyfill";

(
    () => {
        let scopeBrowser = self[specialKeys.SCOPE_BROWSER];
        if (!scopeBrowser) {
            console.log("There is no injectable information on the current environment...")
            return
        }
        fill(scopeBrowser)
        console.log('Injected:' + scopeBrowser.name);
        self[specialKeys.SCOPE_CHEATER] = workerCheat;
        try {
            workerCheat(self, scopeBrowser, 'direct');
            scopeBrowser.status = 'ok'
        } catch (e) {
            scopeBrowser.status = 'err'
            console.error(e)
        }

    }
)();


