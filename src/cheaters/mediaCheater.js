import {functionCall, proxyFunc} from "../kits/proxy";

function replace(match, key, value) {
    if (!key) return match
    let newKey = key.toLowerCase().trim();
    let newValue = keyMapValue[newKey];
    if (newValue) {
        if ((value + "").trim() !== newValue + "") {
            return '(false)'
        }
    }
    return match
}

/**
 *
 * @param mediaQuery
 * @param {{[k:string]:string}} keyMapValue
 * @returns {*}
 */
function evaluateMediaQuery(mediaQuery, keyMapValue) {
    const regex = /\(([^)]+):([^)]+)\)/g;
    const mediaTypes = [
        'all',
        'braille',
        'embossed',
        'handheld',
        'print',
        'projection',
        'screen',
        'speech',
        'tty',
        'tv']
    const mediaTypeRegex = new RegExp(`(^|[^a-zA-Z-])(${mediaTypes.join('|')})($|[^a-zA-Z-])`, 'g');
    return mediaQuery
        .replace(regex, replace)
        .replace(mediaTypeRegex, match => {
            let value = keyMapValue[match];
            if (match in keyMapValue) {
                return value ? '<non>' : '(false)'
            }
            return match;
        })
}

function replaceSubstrings(str) {
    const regex = /<non>\s+and|<non>\s+,|not\s+<non>|only\s+<non>/g;
    return str.replace(regex, '');
}


const keyMapValue = {}

export const setMedia = (key, value) => keyMapValue[key] = value
export const getMedia = (key) => keyMapValue[key]

export function cheat(scope,) {
    if (!Object.keys(keyMapValue).length) return false
    proxyFunc(scope.window, "matchMedia", (target, self, args) => {
        let originValue = functionCall(target, self, args);
        if (!originValue) return originValue
        let media = originValue.media;
        if (media === 'not all') return originValue
        // if (
        //     (media.includes('min-width') && media.includes(innerWidth + "px")) ||
        //     (media.includes('min-height') && media.includes(innerHeight + "px")) ||
        //     (media.includes('max-width') && media.includes(outerWidth + "px")) ||
        //     (media.includes('max-height') && media.includes(outerHeight + "px"))
        // ) {
        //     Object.defineProperty(originValue, 'matches', {
        //         value: true
        //     })
        //     return originValue;
        // }
        // if (
        //     (media.includes('min-width') && !media.includes(innerWidth + "px")) ||
        //     (media.includes('min-height') && !media.includes(innerHeight + "px")) ||
        //     (media.includes('max-width') && !media.includes(outerWidth + "px")) ||
        //     (media.includes('max-height') && !media.includes(outerHeight + "px"))
        // ) {
        //     Object.defineProperty(originValue, 'matches', {
        //         value: false
        //     })
        //     return originValue;
        // }
        let query = evaluateMediaQuery(media, keyMapValue)

        if (query === media) {
            if (!originValue.matches) {
                Object.defineProperty(originValue, 'matches', {
                    value: true
                })
            }
            return originValue
        }
        if (query === '' && originValue.matches === true) return originValue
        let result = target.call(self, ...[query]);
        Object.defineProperty(result, 'media', {
            value: args[0]
        })
        return result
    })

    return true
}
