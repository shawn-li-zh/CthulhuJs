import utils from "./kits/utils";

export const specialKeys = {
    native: '__nativeCheat__',
    remove: '__removeCheat__',
    add: '__addCheat__',
    window: '__windowCheat__',
    trace: '__traceCheat__',
    proxyId: '__proxyIdCheat__',
    isProxy: '__isProxyCheat__',
    origin: '__originCheat__',
    create: '__createCheat__',
    attach: '__attachCheat__',
    fake: '__fakeCheat__',
    cheaters: '__cheatersCheat__',
    SCOPE_BROWSER: 'SCOPE_BROWSER',
    SCOPE_CHEATER: 'SCOPE_CHEATER',
    CTHULHUJS_API: 'CTHULHUJS_API',
    BROWSER_GENERATOR: 'BROWSER_GENERATOR',
}

//随机生成key
export function initKeys(seed = 0) {
    for (let key of Object.keys(specialKeys)) {
        specialKeys[key] = utils.fakeName(key, seed);
    }
    console.log(specialKeys)
}

export const brandMapCompany = {
    Chrome: 'Google',
    Edge: 'Microsoft',
    IE: 'Microsoft',
    Firefox: 'Mozilla',
    Safari: 'Apple',
    QQ: 'Tencent',
}

