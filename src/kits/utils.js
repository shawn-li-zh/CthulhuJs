const getStyle = function (obj, name) {
    if (window.getComputedStyle) return getComputedStyle(obj, null)[name];
    return obj.currentStyle[name];
}

function deepError() {
    let e = new Error('')
    e.stack = ''
    throw e
}

/**
 *
 * @param {string} str
 * @returns {number}
 */
function hashcode(str) {
    let hash = 0, i, chr;
    if (!str || str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function arrayHashcode(array) {
    let hash = 0, i, chr;
    if (!array || array.length === 0) return hash;
    for (i = 0; i < array.length; i++) {
        chr = array[i];
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function guid() {
    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

/**
 *
 * @param {number} factor
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomInt(factor, min, max) {
    factor = (factor || 0) + 9
    factor = Math.sin(factor) * 10000
    factor |= 0
    return Math.abs(factor) % (max - min + 1) + min;
}

/**
 * @template T
 * @param {number} factor
 * @param {Array<T>} items
 * @returns {T}
 */
function randomItem(factor, items) {
    return items[randomInt(factor, 0, items.length - 1)]
}

/**
 *
 * @param {number} factor
 * @param {number} max
 * @returns {number}
 */
function randomNum(factor, max) {
    return randomInt(factor, 0, max);
}

const swap = (arr, i, j, len = 1, skips = []) => {
    if (i === j) return false
    if (i<0 ||j<0||(i+ len)> arr.length ||(j + len)> arr.length) return false;
    for (let k = 0; k < len; k++) {
        let temp = arr[i + k]
        if (skips.includes(temp)) return false
        if (temp === 0) return;//跳过0
        arr[i + k] = arr[j + k]
        arr[j + k] = temp
    }
    return true
}

function randomSwap(seed, array, options = {times: 10, unit: 2, loopTimes: 50, skips: []}) {
    if (!array) return
    if (array.length <= options.times * options.unit * 2) return;
    let seg = (array.length / (options.times * 2)) | 0//按次数分段 ，seg必须大于unit*2
    let segs = (seg / options.unit) | 0;
    let seedT = seed;
    let times = 0
    for (let j = 0; j < options.loopTimes; j++) {
        let s = j * options.times * 2
        let i = randomInt(seedT + j, 0, segs)
        let start = s + i * options.unit * 2;
        if (swap(array, start, start + options.unit, options.unit, options.skips)) {
            times++;
        }
        if (times >= options.times) break
        seedT += j;
    }
    return times
}

function randomReverse(seed, array, step, skips = []) {
    if (!array) return
    let times = 0;
    let steps = (array.length / step) | 0
    let half = (step / 2) | 0;
    let ratio = randomInt(seed, 3, 13)
    for (let j = 0; j < steps; j++) {
        let base = j * step;
        if (base >= array.length) break
        if (j % ratio <= 1) {
            //区间内反转
            for (let i = 0; i < half; i++) {
                let s = base + i;
                let e = base + (step - 1 - i);
                if (skips.filter(v => v === array[s] || v === array[e]).length) continue
                let temp = array[s]
                array[s] = array[e]
                array[e] = temp
                times++;
            }
        }
        j += randomInt(seed + j, 1, 10)
    }
    return times
}


// function reverse(array) {
//     let half = (array.length / 2) | 0
//     for (let i = 0; i < half; i++) {
//         let temp = array[i]
//         array[i] = array[(array.length - 1 - i)]
//         array[(array.length - 1 - i)] = temp
//     }
// }

function randomNoise(seed, array, skips = [0]) {
    if (!array) return 0
    let noise = randomInt(seed, 1, 5000) / 1000;
    let times = 0
    for (let j = 1; j < array.length - 1; j++) {
        if (skips.includes(array[j])) continue
        array[j] += noise;
        j += randomInt(j * noise, 1, (array.length / 300) | 0)
        times++;
    }
    return times
}

function randomPeek(seed, array, fn, step, loopTimes = 50) {
    if (!array) return
    step = step || Math.min((array.length / 500) | 0, 8) || 1;
    let r = randomInt(seed, 1, 100)
    let times = 0
    for (let j = 0; j < array.length;) {
        if (times >= loopTimes) break
        if (!array[j]) {
            j += step
            continue
        }
        if (j % r <= 3) {
            let rt = fn(array[j], j);
            if (rt !== undefined) {
                array[j] = rt
                times++;
            }
        }
        // r = randomInt(seed+j, 2, 50)
        j += step
    }
    return times
}

class Random {
    constructor(seed = 0) {
        this.seed = seed;
    }

    int(min, max) {
        let int = randomInt(this.seed, min, max);
        this.seed = int + this.seed;
        if (this.seed > 99999999) this.seed /= 2;
        return int;
    }

    item(arr = []) {
        let itm = randomItem(this.seed, arr);
        this.seed = this.seed + arr.length;
        if (this.seed > 99999999) this.seed /= 2;
        return itm;
    }
}

function formatString(str, maxLength) {
    str += ""
    if (str.length > maxLength) {
        return str.slice(0, maxLength - 3) + '...';
    } else {
        return str.padEnd(maxLength);
    }
}

function getValue(obj, str) {
    let keys = str.split(/[.\[\]]/).filter(key => key !== '');
    let value = obj;
    for (let key of keys) {
        if (value[key] === undefined) {
            return undefined;
        }
        value = value[key];
    }
    return value;
}

function deleteValue(obj, str) {
    let keys = str.split(/[.\[\]]/).filter(key => key !== '');
    let target = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        let key = keys[i]
        target = target[key]
        if (target === undefined) return
    }
    return delete target[keys[keys.length - 1]]
}


function isNullify(obj) {
    return (obj === null || obj === undefined)
}

function isEmpty(obj) {
    if (isNullify(obj)) return true
    if (obj && !isNullify(obj.length)) return obj.length === 0
    if (obj === 0 || obj === 0.0 || obj === '') return true;
    for (const objKey in obj) {
        return false
    }
    return true
}

function ipv4ToIpv6(ipv4) {
    if (!ipv4) return ''
    let ipv6 = '';
    let ipv4Arr = ipv4.split('.');
    for (let i = 0; i < ipv4Arr.length; i++) {
        let hex = parseInt(ipv4Arr[i]).toString(16);
        if (hex.length === 1) {
            hex = '0' + hex;
        }
        ipv6 += hex;
        if (i % 2 !== 0) {
            ipv6 += ':';
        }
    }
    return '0:0:0:0:0:ffff:' + ipv6;
}


const toDataURL = (s, type) => {
    let base64 = btoa(s);
    return `'data:${type};base64,${base64}`;
}

function getGlobal() {
    try {
        return self
    } catch (e) {

    }
    try {
        return global
    } catch (e) {

    }
    try {
        return globalThis
    } catch (e) {

    }
}

export default {
    guid,
    ipv4ToIpv6,
    randomNum,
    randomItem,
    randomInt,
    randomSwap,
    randomNoise,
    randomPeek,
    randomReverse,
    Random,
    hashcode,
    arrayHashcode,
    getStyle,
    formatString,
    getValue,
    deleteValue,
    swap,
    isNullify,
    isEmpty,
    toDataURL,
    getGlobal
}
