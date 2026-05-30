import Utils from "../kits/utils";
import {specialKeys} from "../const";
import {functionCall, proxyGetter, proxyValue} from "../kits/proxy";


export function cheat(scope, browser) {
    //
    (browser.customVars || []).forEach(item => {
        let {path, value} = item
        let pathItems = path.split(".");
        let key = pathItems.pop();
        path = pathItems.join(".");

        let target = Utils.getValue(scope, path);
        if (!target) {
            scope[specialKeys.attach].warns.push(`${path} is undefined`);
            return
        }
        proxyValue(target, key, value);
        console.info(`${scope.constructor.name.toUpperCase()} Path:${Utils.formatString(path, 50)} ---MODIFIED`)
    });
    (browser.customProtos || []).forEach(proto => {
        let targetPath = proto.name
        proto.properties.forEach(property => {
            let key = property.key
            let value = property.value
            let type = property.type
            switch (type) {
                case 'string':
                    value = value + ''
                    break
                case 'number':
                    value = (+value)
                    break
                case 'boolean':
                    value = (!!value)
                    break
                case 'json':
                    value = JSON.parse(value)
                    break
                case 'undefined':
                    value = undefined
                    break
            }
            let target = Utils.getValue(scope, targetPath);
            if (!target) return
            proxyGetter(target.prototype, key, (target, self, args) => {
                functionCall(target, self, args)
                return value
            })
        })
    })
    return true
}
