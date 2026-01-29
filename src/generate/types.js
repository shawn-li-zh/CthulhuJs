export const TEMPLATE = {
    "id": "randomGenerate",
    "name": "随机生成配置",
    "seed": 0,
    "safeMode": true,
    "webglSafeMode": true,
    "humanLike": true,
    "disableWorker": false,
    "antiDebugger": false,
    "functionTrace": false,
    "userAgent": "auto",
    "webrtc": "auto",
    "location": {
        "lng": -1,
        "lat": -1,
    },
    "timezone": "auto",
    "language": "auto",
    "factors": {
        "audio": -1,
        "canvas": -1,
        "fonts": -1,
        "plugins": -1,
        "webgl": -1,
        "webgpu": -1,
        "voice": -1,
        "clientRect": -1,
    },
    "webglInfo": "auto",
    "screen": {
        "noise": -1,
        "pixelDepth": -1,
        "colorDepth": -1,
        "maxTouchPoints": -1,
        "dpr": 0,
        "scheme": "auto"
    },
    "memoryCapacity": -1,
    "processors": -1,
    "iceServers": [],
}
export const INFO = {
    userAgent: "",
    language: "",
    timezone: "",
    location: {
        lng: 0,
        lat: 0,
    },
    webrtc: "",
    webglInfo: {
        vendor: "",
        renderer: ""
    },
    osName: '',
    browserName: '',
    deviceType: '',
}
