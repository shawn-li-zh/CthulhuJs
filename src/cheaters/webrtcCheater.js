import {functionCall, proxyConstruct, proxyFunc, proxyGetter} from "../kits/proxy";

const ipv4Pattern = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g;
const ipv6Pattern = /^([\da-fA-F]{1,4}:){6}((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$|^::([\da-fA-F]{1,4}:){0,4}((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$|^([\da-fA-F]{1,4}:):([\da-fA-F]{1,4}:){0,3}((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$|^([\da-fA-F]{1,4}:){2}:([\da-fA-F]{1,4}:){0,2}((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$|^([\da-fA-F]{1,4}:){3}:([\da-fA-F]{1,4}:){0,1}((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$|^([\da-fA-F]{1,4}:){4}:((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$|^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$|^:((:[\da-fA-F]{1,4}){1,6}|:)$|^[\da-fA-F]{1,4}:((:[\da-fA-F]{1,4}){1,5}|:)$|^([\da-fA-F]{1,4}:){2}((:[\da-fA-F]{1,4}){1,4}|:)$|^([\da-fA-F]{1,4}:){3}((:[\da-fA-F]{1,4}){1,3}|:)$|^([\da-fA-F]{1,4}:){4}((:[\da-fA-F]{1,4}){1,2}|:)$|^([\da-fA-F]{1,4}:){5}:([\da-fA-F]{1,4})?$|^([\da-fA-F]{1,4}:){6}:$/;

/**
 *
 * @param {string}text
 * @param  {string}replacement
 * @returns {string}
 */
function replaceIpv6WithText(text, replacement) {
    return text.replace(ipv6Pattern, replacement);
}

/**
 *
 * @param {string}text
 * @param  {string}ipv4
 * @returns {string}
 */
function replaceIpInCandidate(text, ipv4) {
    if (!text?.startsWith("candidate:")) return text
    //candidate:foundation component protocol priority ip port type
    let parts = text.split(" ");
    const ipIndex = 4
    let ip = parts[ipIndex];
    if (ip === '0.0.0.0') return text;
    if (ip === '127.0.0.1') return text;
    parts[ipIndex] = ipv4
    // parts.forEach((item, i) => {
    //     if (item.length < 7) return
    //     if (item === '0.0.0.0') return;
    //     if (item === '127.0.0.1') return;
    //     // if (item === '192.0.0.1') return;
    //     if (ipv4Pattern.test(item)) {
    //         return parts[i] = ipv4
    //     }
    //     if (ipv6Pattern.test(item)) {
    //         return parts[i] = ipv4
    //     }
    // })
    return parts.join(' ')
}

function replaceIpInSdp(text, ipv4) {
    if (!text) return text
    let parts = text.split("\r\n");
    let newParts = parts.map(item => replaceIpInCandidate(item, ipv4))
    return newParts.join('\r\n')
}

export function cheat(scope, browser) {
    if (!browser.webrtc) return false
    const RTCSessionDescription = scope.RTCSessionDescription;
    const RTCIceCandidate = scope.RTCIceCandidate;
    // const ipv6 = Utils.ipv4ToIpv6(browser.webrtc)
    if (RTCSessionDescription)
        proxyGetter(RTCSessionDescription.prototype, "sdp", function (target, self, args) {
            let originValue = functionCall(target, self, args);
            if (!originValue) return originValue
            if (browser.webrtc === 'disable') {
                return replaceIpInSdp(originValue, '0.0.0.0')
            }
            return replaceIpInSdp(originValue, browser.webrtc)
        });
    if (RTCIceCandidate) {
        proxyFunc(RTCIceCandidate.prototype, "toJSON", function (target, self, args) {
            let originValue = functionCall(target, self, args);
            originValue.candidate = self.candidate
            return originValue
        });
        proxyGetter(RTCIceCandidate.prototype, "address", function (target, self, args) {
            let originValue = functionCall(target, self, args);
            if (browser.webrtc === 'disable') {
                return '0.0.0.0'
            }
            if (browser.webrtc) return browser.webrtc
            return originValue
        });

        proxyGetter(RTCIceCandidate.prototype, "candidate", function (target, self, args) {
            let originValue = functionCall(target, self, args);
            if (!originValue) return originValue
            if (browser.webrtc === 'disable') {
                return replaceIpInCandidate(originValue, '0.0.0.0')
            }
            return replaceIpInCandidate(originValue, browser.webrtc)
        });
    }
    const iceServers = browser.iceServers
    if (iceServers) {
        ["RTCPeerConnection", "mozRTCPeerConnection", "webkitRTCPeerConnection"].forEach(key => {
            proxyConstruct(scope, key, (target, args, newTarget) => {
                let cfg = args[0];
                if (cfg) {
                    //将stun服务器换成公共的谷歌stun服务器
                    cfg.iceServers = iceServers
                    // cfg.sdpSemantics = 'plan-b'
                }
                return Reflect.construct(target, args, newTarget);
            }, {skipAbsent: true});
        })

    }

    return true
}


//v=0
// o=- 503733161915516920 2 IN IP4 127.0.0.1
// s=-
// t=0 0
// a=group:BUNDLE 0 1 2
// a=extmap-allow-mixed
// a=msid-semantic: WMS
// m=audio 63701 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126
// c=IN IP4 222.221.175.121
// a=rtcp:9 IN IP4 0.0.0.0
// a=candidate:278999010 1 udp 2113937151 6e3dcfc5-7c77-4a31-b9b6-9ce28fb21eef.local 64087 typ host generation 0 network-cost 999
// a=candidate:546380424 1 udp 2113939711 977c3fb7-4ecf-4317-a34f-6e693f9d6a7d.local 64088 typ host generation 0 network-cost 999
// a=candidate:212726840 1 udp 1677732095 240e:34c:270:6730:39ac:fdb1:3abe:b062 64088 typ srflx raddr :: rport 0 generation 0 network-cost 999
// a=candidate:2126448843 1 udp 1677729535 222.221.175.121 63701 typ srflx raddr 0.0.0.0 rport 0 generation 0 network-cost 999
// a=ice-ufrag:fVZF
// a=ice-pwd:PuoIyYnLfu+U7xSk8gtdEH5w
// a=ice-options:trickle
// a=fingerprint:sha-256 6A:38:EF:25:AE:F8:0C:7E:50:51:FC:9F:47:30:81:86:7B:F5:2D:7E:F1:4E:7E:BF:3C:70:F8:FF:26:31:4D:35
// a=setup:actpass
// a=mid:0
// a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
// a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
// a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
// a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
// a=recvonly
// a=rtcp-mux
// a=rtcp-rsize
// a=rtpmap:111 opus/48000/2
// a=rtcp-fb:111 transport-cc
// a=fmtp:111 minptime=10;useinbandfec=1
// a=rtpmap:63 red/48000/2
// a=fmtp:63 111/111
// a=rtpmap:9 G722/8000
// a=rtpmap:0 PCMU/8000
// a=rtpmap:8 PCMA/8000
// a=rtpmap:13 CN/8000
// a=rtpmap:110 telephone-event/48000
// a=rtpmap:126 telephone-event/8000
// m=video 63702 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 35 36 37 38 102 103 104 105 106 107 108 109 127 125 39 40 41 42 43 44 45 46 47 48 112 113 114 49
// c=IN IP4 222.221.175.121
// a=rtcp:9 IN IP4 0.0.0.0
// a=candidate:278999010 1 udp 2113937151 6e3dcfc5-7c77-4a31-b9b6-9ce28fb21eef.local 64089 typ host generation 0 network-cost 999
// a=candidate:546380424 1 udp 2113939711 977c3fb7-4ecf-4317-a34f-6e693f9d6a7d.local 64090 typ host generation 0 network-cost 999
// a=candidate:212726840 1 udp 1677732095 240e:34c:270:6730:39ac:fdb1:3abe:b062 64090 typ srflx raddr :: rport 0 generation 0 network-cost 999
// a=candidate:2126448843 1 udp 1677729535 222.221.175.121 63702 typ srflx raddr 0.0.0.0 rport 0 generation 0 network-cost 999
// a=ice-ufrag:fVZF
// a=ice-pwd:PuoIyYnLfu+U7xSk8gtdEH5w
// a=ice-options:trickle
// a=fingerprint:sha-256 6A:38:EF:25:AE:F8:0C:7E:50:51:FC:9F:47:30:81:86:7B:F5:2D:7E:F1:4E:7E:BF:3C:70:F8:FF:26:31:4D:35
// a=setup:actpass
// a=mid:1
// a=extmap:14 urn:ietf:params:rtp-hdrext:toffset
// a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
// a=extmap:13 urn:3gpp:video-orientation
// a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
// a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay
// a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type
// a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing
// a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space
// a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
// a=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
// a=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id
// a=recvonly
// a=rtcp-mux
// a=rtcp-rsize
// a=rtpmap:96 VP8/90000
// a=rtcp-fb:96 goog-remb
// a=rtcp-fb:96 transport-cc
// a=rtcp-fb:96 ccm fir
// a=rtcp-fb:96 nack
// a=rtcp-fb:96 nack pli
// a=rtpmap:97 rtx/90000
// a=fmtp:97 apt=96
// a=rtpmap:98 VP9/90000
// a=rtcp-fb:98 goog-remb
// a=rtcp-fb:98 transport-cc
// a=rtcp-fb:98 ccm fir
// a=rtcp-fb:98 nack
// a=rtcp-fb:98 nack pli
// a=fmtp:98 profile-id=0
// a=rtpmap:99 rtx/90000
// a=fmtp:99 apt=98
// a=rtpmap:100 VP9/90000
// a=rtcp-fb:100 goog-remb
// a=rtcp-fb:100 transport-cc
// a=rtcp-fb:100 ccm fir
// a=rtcp-fb:100 nack
// a=rtcp-fb:100 nack pli
// a=fmtp:100 profile-id=2
// a=rtpmap:101 rtx/90000
// a=fmtp:101 apt=100
// a=rtpmap:35 VP9/90000
// a=rtcp-fb:35 goog-remb
// a=rtcp-fb:35 transport-cc
// a=rtcp-fb:35 ccm fir
// a=rtcp-fb:35 nack
// a=rtcp-fb:35 nack pli
// a=fmtp:35 profile-id=1
// a=rtpmap:36 rtx/90000
// a=fmtp:36 apt=35
// a=rtpmap:37 VP9/90000
// a=rtcp-fb:37 goog-remb
// a=rtcp-fb:37 transport-cc
// a=rtcp-fb:37 ccm fir
// a=rtcp-fb:37 nack
// a=rtcp-fb:37 nack pli
// a=fmtp:37 profile-id=3
// a=rtpmap:38 rtx/90000
// a=fmtp:38 apt=37
// a=rtpmap:102 H264/90000
// a=rtcp-fb:102 goog-remb
// a=rtcp-fb:102 transport-cc
// a=rtcp-fb:102 ccm fir
// a=rtcp-fb:102 nack
// a=rtcp-fb:102 nack pli
// a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f
// a=rtpmap:103 rtx/90000
// a=fmtp:103 apt=102
// a=rtpmap:104 H264/90000
// a=rtcp-fb:104 goog-remb
// a=rtcp-fb:104 transport-cc
// a=rtcp-fb:104 ccm fir
// a=rtcp-fb:104 nack
// a=rtcp-fb:104 nack pli
// a=fmtp:104 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f
// a=rtpmap:105 rtx/90000
// a=fmtp:105 apt=104
// a=rtpmap:106 H264/90000
// a=rtcp-fb:106 goog-remb
// a=rtcp-fb:106 transport-cc
// a=rtcp-fb:106 ccm fir
// a=rtcp-fb:106 nack
// a=rtcp-fb:106 nack pli
// a=fmtp:106 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f
// a=rtpmap:107 rtx/90000
// a=fmtp:107 apt=106
// a=rtpmap:108 H264/90000
// a=rtcp-fb:108 goog-remb
// a=rtcp-fb:108 transport-cc
// a=rtcp-fb:108 ccm fir
// a=rtcp-fb:108 nack
// a=rtcp-fb:108 nack pli
// a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f
// a=rtpmap:109 rtx/90000
// a=fmtp:109 apt=108
// a=rtpmap:127 H264/90000
// a=rtcp-fb:127 goog-remb
// a=rtcp-fb:127 transport-cc
// a=rtcp-fb:127 ccm fir
// a=rtcp-fb:127 nack
// a=rtcp-fb:127 nack pli
// a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f
// a=rtpmap:125 rtx/90000
// a=fmtp:125 apt=127
// a=rtpmap:39 H264/90000
// a=rtcp-fb:39 goog-remb
// a=rtcp-fb:39 transport-cc
// a=rtcp-fb:39 ccm fir
// a=rtcp-fb:39 nack
// a=rtcp-fb:39 nack pli
// a=fmtp:39 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=4d001f
// a=rtpmap:40 rtx/90000
// a=fmtp:40 apt=39
// a=rtpmap:41 H264/90000
// a=rtcp-fb:41 goog-remb
// a=rtcp-fb:41 transport-cc
// a=rtcp-fb:41 ccm fir
// a=rtcp-fb:41 nack
// a=rtcp-fb:41 nack pli
// a=fmtp:41 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=f4001f
// a=rtpmap:42 rtx/90000
// a=fmtp:42 apt=41
// a=rtpmap:43 H264/90000
// a=rtcp-fb:43 goog-remb
// a=rtcp-fb:43 transport-cc
// a=rtcp-fb:43 ccm fir
// a=rtcp-fb:43 nack
// a=rtcp-fb:43 nack pli
// a=fmtp:43 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=f4001f
// a=rtpmap:44 rtx/90000
// a=fmtp:44 apt=43
// a=rtpmap:45 AV1/90000
// a=rtcp-fb:45 goog-remb
// a=rtcp-fb:45 transport-cc
// a=rtcp-fb:45 ccm fir
// a=rtcp-fb:45 nack
// a=rtcp-fb:45 nack pli
// a=fmtp:45 level-idx=5;profile=0;tier=0
// a=rtpmap:46 rtx/90000
// a=fmtp:46 apt=45
// a=rtpmap:47 AV1/90000
// a=rtcp-fb:47 goog-remb
// a=rtcp-fb:47 transport-cc
// a=rtcp-fb:47 ccm fir
// a=rtcp-fb:47 nack
// a=rtcp-fb:47 nack pli
// a=fmtp:47 level-idx=5;profile=1;tier=0
// a=rtpmap:48 rtx/90000
// a=fmtp:48 apt=47
// a=rtpmap:112 red/90000
// a=rtpmap:113 rtx/90000
// a=fmtp:113 apt=112
// a=rtpmap:114 ulpfec/90000
// a=rtpmap:49 flexfec-03/90000
// a=rtcp-fb:49 goog-remb
// a=rtcp-fb:49 transport-cc
// a=fmtp:49 repair-window=10000000
// m=application 63703 UDP/DTLS/SCTP webrtc-datachannel
// c=IN IP4 222.221.175.121
// a=candidate:278999010 1 udp 2113937151 6e3dcfc5-7c77-4a31-b9b6-9ce28fb21eef.local 64091 typ host generation 0 network-cost 999
// a=candidate:546380424 1 udp 2113939711 977c3fb7-4ecf-4317-a34f-6e693f9d6a7d.local 64095 typ host generation 0 network-cost 999
// a=candidate:212726840 1 udp 1677732095 240e:34c:270:6730:39ac:fdb1:3abe:b062 64095 typ srflx raddr :: rport 0 generation 0 network-cost 999
// a=candidate:2126448843 1 udp 1677729535 222.221.175.121 63703 typ srflx raddr 0.0.0.0 rport 0 generation 0 network-cost 999
// a=ice-ufrag:fVZF
// a=ice-pwd:PuoIyYnLfu+U7xSk8gtdEH5w
// a=ice-options:trickle
// a=fingerprint:sha-256 6A:38:EF:25:AE:F8:0C:7E:50:51:FC:9F:47:30:81:86:7B:F5:2D:7E:F1:4E:7E:BF:3C:70:F8:FF:26:31:4D:35
// a=setup:actpass
// a=mid:2
// a=sctp-port:5000
// a=max-message-size:262144
