import {functionCall, proxyGetter} from "../kits/proxy";

export function cheat(scope, browser) {
    const GeolocationCoordinates = scope.GeolocationCoordinates;
    const location = browser.location;
    if (!location || (!location.lat && !location.lng)) return false
    if (GeolocationCoordinates && location) {
        proxyGetter(GeolocationCoordinates.prototype, "longitude", (target, self, args) => {
            let originValue = functionCall(target, self, args);
            return location.lng / 1 || originValue
        })
        proxyGetter(GeolocationCoordinates.prototype, "latitude", (target, self, args) => {
            let originValue = functionCall(target, self, args);
            return location.lat / 1 || originValue
        })
    }
    return true
}
