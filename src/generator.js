import Utils from "./kits/utils";
// import "@babel/polyfill";

import {specialKeys} from "./const";
import {generateBrowser} from "./generate/index";

(() => {
    const global = Utils.getGlobal()
    global[specialKeys.BROWSER_GENERATOR] = generateBrowser
})()
