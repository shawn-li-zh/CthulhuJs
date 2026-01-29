
export function toObject(primitiveValue) {
    let nv = primitiveValue;
    if (typeof primitiveValue == 'number' && !(primitiveValue instanceof Number)) {
        nv = new Number(primitiveValue)//强制new
    }
    if (typeof primitiveValue == 'boolean' && !(primitiveValue instanceof Boolean)) {
        nv = new Boolean(primitiveValue)//强制new
    }
    if (typeof primitiveValue == 'string' && !(primitiveValue instanceof String)) {
        nv = new String(primitiveValue)//强制new
    }
    return nv;
}

const maxDeep = 10

function objectCrawl(obj, handlers = [], deep) {
    if (deep > maxDeep) return;
    if (obj instanceof Array) {
        for (let o of obj) {
            objectCrawler(o, handlers,deep+1)
        }
    }
    if (obj.__lock) return;
    obj.__lock = 1
    for (let key of Object.keys(obj)) {
        for (let handler of handlers) {
            let ty = typeof handler.check;
            let t = false
            if (ty === 'function') {
                t = handler.check(key, obj[key])
            } else if (ty === 'string') {
                t = key === handler.check
            } else if (handler.check instanceof RegExp) {
                t = !!key.match(handler.check)
            }
            if (t) {
                obj[key] = handler.handle(key, obj[key])
                break
            }

        }
        objectCrawler(obj[key], handlers,deep+1)
    }
    delete obj.__lock
}

export function objectCrawler(obj, match) {
    if (obj === null || obj === undefined) return;
    if (typeof obj != 'object') return
    objectCrawl(obj, match, 0)
}
