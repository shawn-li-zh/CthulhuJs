import {functionCall, proxyConstruct, proxyFunc} from "../kits/proxy";
import {DateTime} from "luxon";


export function cheat(scope, browser) {
    let timezone = browser.timezone;
    if (!timezone && !browser.language) return false
    const DateTimeFormat = scope.Intl.DateTimeFormat;
    if (DateTimeFormat)
        proxyFunc(DateTimeFormat.prototype, "resolvedOptions", (target, self, args) => {
            let originValue = functionCall(target, self, args);
            if (timezone) {
                originValue.timeZone = timezone
            }
            if (browser.language) {
                let lan = browser.language.split(",")[0];
                let supportedLocalesOf = DateTimeFormat.supportedLocalesOf(lan);
                originValue.locale = supportedLocalesOf[0] || ""
            }
            return originValue
        })
    const Date = scope.Date;
    if (Date) {
        //改完每次都要测一下youtube能不能播放
        let date = new Date()
        let dateTemp = new Date(date.toLocaleString("en", {timeZone: timezone}))
        let diff = dateTemp.getTime() - date.getTime();
        proxyFunc(Date.prototype, "toString", (target, self, args) => {
            try {
                let time = DateTime.fromJSDate(self).setZone(timezone)
                return time.toFormat("ccc LLL dd yyyy TT 'GMT'ZZZ (ZZZZZ)")
            } catch (e) {
                return functionCall(target, self, args)
            }
        }, {skipAbsent: false});

        for (let fn of ["toUTCString", "toGMTString", "toISOString"]) {
            proxyFunc(Date.prototype, fn, (target, self, args) => {
                self = new Date(self.getTime() + diff);
                return functionCall(target, self, args)
            }, {skipAbsent: false});
        }
        //
        proxyConstruct(scope, "Date", (target, argArray, newTarget) => {
            let date = Reflect.construct(target, argArray, newTarget);
            if (!(argArray?.length === 1 && typeof argArray[0] == 'number')) {
                //只针对非毫秒时间戳的
                return date
            }
            return new target(date.getTime() - diff)
        }, {skipAbsent: false})
    }
    return true

}


