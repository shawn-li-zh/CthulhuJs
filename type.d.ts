export type Type = "string" | "number" | "boolean" | "undefined" | 'json'

export interface Proto {
    name: string,
    properties: { key: string, value: any, type: Type }[]
}

export interface Var {
    path: string,
    value: any
}


interface IBrowser {
    /**
     * Possible values :
     * Amaya, Android Browser, Arora, Avant, Baidu, Blazer, Bolt, Camino, Chimera, Chrome,
     * Chromium, Comodo Dragon, Conkeror, Dillo, Dolphin, Doris, Edge, Epiphany, Fennec,
     * Firebird, Firefox, Flock, GoBrowser, iCab, ICE Browser, IceApe, IceCat, IceDragon,
     * Iceweasel, IE [Mobile], Iron, Jasmine, K-Meleon, Konqueror, Kindle, Links,
     * Lunascape, Lynx, Maemo, Maxthon, Midori, Minimo, MIUI Browser, [Mobile] Safari,
     * Mosaic, Mozilla, Netfront, Netscape, NetSurf, Nokia, OmniWeb, Opera [Mini/Mobi/Tablet],
     * Phoenix, Polaris, QQBrowser, RockMelt, Silk, Skyfire, SeaMonkey, SlimBrowser, Swiftfox,
     * Tizen, UCBrowser, Vivaldi, w3m, Yandex
     */
    name: string | undefined;

    /**
     * Determined dynamically
     */
    version: string | undefined;

    /**
     * Determined dynamically
     * @deprecated
     */
    major: string | undefined;
}

interface IDevice {
    /**
     * Determined dynamically
     */
    model: string | undefined;

    /**
     * Possible type:
     * console, mobile, tablet, smarttv, wearable, embedded
     */
    type: string | undefined;

    /**
     * Possible vendor:
     * Acer, Alcatel, Amazon, Apple, Archos, Asus, BenQ, BlackBerry, Dell, GeeksPhone,
     * Google, HP, HTC, Huawei, Jolla, Lenovo, LG, Meizu, Microsoft, Motorola, Nexian,
     * Nintendo, Nokia, Nvidia, Ouya, Palm, Panasonic, Polytron, RIM, Samsung, Sharp,
     * Siemens, Sony-Ericsson, Sprint, Xbox, ZTE
     */
    vendor: string | undefined;
}

interface IEngine {
    /**
     * Possible name:
     * Amaya, EdgeHTML, Gecko, iCab, KHTML, Links, Lynx, NetFront, NetSurf, Presto,
     * Tasman, Trident, w3m, WebKit
     */
    name: string | undefined;
    /**
     * Determined dynamically
     */
    version: string | undefined;
}

interface IOS {
    /**
     * Possible 'os.name'
     * AIX, Amiga OS, Android, Arch, Bada, BeOS, BlackBerry, CentOS, Chromium OS, Contiki,
     * Fedora, Firefox OS, FreeBSD, Debian, DragonFly, Gentoo, GNU, Haiku, Hurd, iOS,
     * Joli, Linpus, Linux, Mac OS, Mageia, Mandriva, MeeGo, Minix, Mint, Morph OS, NetBSD,
     * Nintendo, OpenBSD, OpenVMS, OS/2, Palm, PCLinuxOS, Plan9, Playstation, QNX, RedHat,
     * RIM Tablet OS, RISC OS, Sailfish, Series40, Slackware, Solaris, SUSE, Symbian, Tizen,
     * Ubuntu, UNIX, VectorLinux, WebOS, Windows [Phone/Mobile], Zenwalk
     */
    name: string | undefined;
    /**
     * Determined dynamically
     */
    version: string | undefined;
}

interface ICPU {
    /**
     * Possible architecture:
     *  68k, amd64, arm, arm64, avr, ia32, ia64, irix, irix64, mips, mips64, pa-risc,
     *  ppc, sparc, sparc64
     */
    architecture: string | undefined;
}

interface UaInfo {
    ua: string;
    browser: IBrowser;
    device: IDevice;
    engine: IEngine;
    os: IOS;
    cpu: ICPU;
}

type Functions = 'audio' | 'canvas' | 'webgl' | 'fonts' | 'webgpu' |
    'clientRect' | 'voice' | 'plugin' | 'native' | 'webrtc' | "date" |
    'screen' | 'location' | 'navigator' | 'feature' | 'media' | 'worker' | 'iframe'

export interface Browser {
    id: string
    name?: string
    isTemp?: boolean
    //安全模式 不修改浏览版本和系统版本
    safeMode?: boolean
    webglSafeMode?: boolean
    disableWorker?: boolean
    antiDebugger?: boolean
    functionTrace?: boolean
    humanLike?: boolean
    dev?: boolean
    seed?: number
    userAgent?: string,
    customProtos: Proto[],
    customVars: Var[],
    webrtc?: string
    location?: {
        lng?: number,
        lat?: number,
    },
    timezone?: string
    language?: string
    factors: {
        audio: number
        canvas: number
        fonts: number
        plugins: number
        webgl: number
        webgpu: number
        voice: number
        clientRect: number
    },
    //webgl 参数信息
    webglInfo: {
        [k: string]: any
    },
    //控制cheater功能启用
    enables: { [k in Functions]: boolean },
    //屏幕信息
    "screen": {
        noise: number | -1,
        "pixelDepth": number | -1,
        "colorDepth": number | -1,
        "maxTouchPoints": number | -1,
        "dpr": number | -1
    },
    memoryCapacity?: 0.25 | 0.5 | 1 | 2 | 4 | 8
    processors?: 1 | 2 | 4 | 8 | 16 | 32 | 64
    uaInfo?: UaInfo
}
