

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
export type Type = "string" | "number" | "boolean" | "undefined" | 'json'

export interface Proto {
    name: string,
    properties: { key: string, value: any, type: Type }[]
}

export interface Var {
    path: string,
    value: any
}

type Functions = 'audio' | 'canvas' | 'webgl' | 'fonts' | 'webgpu' |
    'clientRect' | 'voice' | 'plugin' | 'native' | 'webrtc' | "date" |
    'screen' | 'location' | 'navigator' | 'feature' | 'media' | 'worker' | 'iframe'

export interface Browser {
    //环境名称
    name?: string
    //随机种子
    seed?: number
    //安全模式 开启后不修改浏览版本和系统版本
    safeMode?: boolean
    //开启后进微调webgl版本信息
    webglSafeMode?: boolean
    //开启后阻止worker通信
    disableWorker?: boolean
    //阻止无限调试(需搭配driverCheater)
    antiDebugger?: boolean
    //函数跟踪
    functionTrace?: boolean
    //环境拟人
    humanLike?: boolean
    //ua
    userAgent?: string,
    //ua解析结果
    uaInfo?: UaInfo,
    //自定义原型链的返回值
    customProtos: Proto[],
    //自定义对象的值
    customVars: Var[],
    //伪装的webrtc ip地址
    webrtc?: string
    //地理坐标
    location?: {
        lng?: number,
        lat?: number,
    },
    //时区code
    timezone?: string
    //语言code
    language?: string
    //硬件/环境指纹干扰因子
    factors: {
        //音频
        audio: number
        //画布
        canvas: number
        //字体
        fonts: number
        //插件
        plugins: number
        //webgl
        webgl: number
        //webgpu
        webgpu: number
        //声音
        voice: number
        //矩形
        clientRect: number
    },
    //webgl 参数信息
    webglInfo: {
        [k: string]: any
    },
    //控制cheater功能启用
    enables: { [k in Functions]: boolean },
    //屏幕信息 -1表示忽略
    "screen": {
        noise: number | -1,
        pixelDepth: number | -1,
        colorDepth: number | -1,
        maxTouchPoints: number | -1,
        dpr: number | -1
    },
    //内存大小
    memoryCapacity?: 0.25 | 0.5 | 1 | 2 | 4 | 8,
    //处理器内核数量
    processors?: 1 | 2 | 4 | 8 | 16 | 32 | 64,
  
}
