import {functionCall, proxyFunc, proxyGetter, proxySetter, proxyValue} from "../kits/proxy";
import {specialKeys} from "../const";

export function cheat(scope, scopeBrowser) {
    const scopeCheat = self[specialKeys.SCOPE_CHEATER]
    const HTMLIFrameElement = scope.HTMLIFrameElement;
    if (!HTMLIFrameElement) return false
    const Document = scope.Document;

    const originContentWindowGet = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "contentWindow").get;

    function elementCheat(element, source) {
        if (element.tagName === "IFRAME") {
            if (element.src && element.src.toString().startsWith("javascript:")) {
                let init = `window.${specialKeys.SCOPE_BROWSER}=window.top.${specialKeys.SCOPE_BROWSER};window.${specialKeys.SCOPE_CHEATER}=window.top.${specialKeys.SCOPE_CHEATER};window.${specialKeys.SCOPE_CHEATER}(self,window.${specialKeys.SCOPE_BROWSER},'direct js');`
                element.src = `javascript:${init};${element.src.toString().substring(11)};`
                // console.log("md==========",element)
            }
            let contentWindow = functionCall(originContentWindowGet, element, []);
            if (contentWindow) scopeCheat(contentWindow, scopeBrowser, source)
        }
    }

    if (Document) {
        proxyFunc(Document.prototype, "getElementById", (target, self, args) => {
            let element = functionCall(target, self, args);
            if (!element) return element
            elementCheat(element, "getElementById")
            return element
        }, {skipAbsent: true});
        ['getElementsByClassName', 'getElementsByName', 'getElementsByTagName', 'getElementsByTagNameNS'].forEach(name => {
            proxyFunc(Document.prototype, name, (target, self, args) => {
                let elements = functionCall(target, self, args);
                if (!elements) return elements
                for (let i = 0; i < elements.length; i++) {
                    elementCheat(elements[i], name)
                }
                return elements
            }, {skipAbsent: true});
        })
    }

    const Node = scope.Node;
    if (Node) {
        // proxyGetter(Node.prototype, "childNodes", (target, self, args) => {
        //     let nodes = functionCall(target,self,args);
        //     if (!nodes) return nodes
        //     nodes.forEach((node, i) => {
        //         elementCheat(node, "childNodes[" + i + "]")
        //     })
        //     return nodes
        // }, {skipAbsent: true});
        proxyFunc(Node.prototype, "appendChild", (target, self, args) => {
            let iframeIndex = scope.self.length;
            let originValue = functionCall(target, self, args);
            if (args[0] instanceof Element || args[0] instanceof DocumentFragment) {
                elementCheat(args[0], "appendChild")
                try {
                    let elements = args[0].querySelectorAll('iframe');
                    for (let element of elements) {
                        elementCheat(element, "appendChild")
                    }
                } catch (e) {
                    throw e;
                }
            }
            let iframeWin = scope.self[iframeIndex];
            if (iframeWin && scope !== iframeWin) {
                scopeCheat(iframeWin, scopeBrowser, 'appendChild')
            }
            return originValue
        }, {skipAbsent: true});
    }
    //防止通过修改内部html来创建不受代理的iframe
    const Element = scope.Element;
    if (Element) {
        proxySetter(Element.prototype, "innerHTML", (target, self, args) => {
            let iframeIndex = scope.self.length;
            let originValue = functionCall(target, self, args);
            let iframeWin = scope.self[iframeIndex];
            if (iframeWin) {
                scopeCheat(iframeWin, scopeBrowser, 'innerHTML')
            }
            return originValue
        }, {skipAbsent: true});
        proxySetter(Element.prototype, "outerHTML", (target, self, args) => {
            let iframeIndex = scope.self.length;
            let originValue = functionCall(target, self, args);
            let iframeWin = scope.self[iframeIndex];
            if (iframeWin) {
                scopeCheat(iframeWin, scopeBrowser, 'outerHTML')
            }
            return originValue
        }, {skipAbsent: true});
    }
    if (scopeBrowser.uaInfo && scopeBrowser.uaInfo.product) {
        let browserName = scopeBrowser.uaInfo.product.name.toString().toLowerCase();

        function valueOf() {
            return 0
        }

        valueOf[specialKeys.native] = 1
        if (!browserName.match(/.*(edge|chrome).*/)) {
            scope.chrome = {}
            if (scope.chrome) {
                proxyValue(scope.chrome, "valueOf", valueOf)
            }
        }
        if (!browserName.match(/.*(safari).*/)) {
            scope.safari = undefined
            if (scope.safari) {
                proxyValue(scope.safari, "valueOf", valueOf)
            }
        }
    }
    let targetKeys = [
        'contentWindow',
        'contentDocument',
        "src",
        "srcdoc",
        "name",
        "sandbox",
        "allowFullscreen",
        "width",
        "height",
        "contentDocument",
        "referrerPolicy",
        "csp",
        "allow",
        "featurePolicy",
        "align",
        "scrolling",
        "frameBorder",
        "longDesc",
        "marginHeight",
        "marginWidth",
        "loading",
        "allowPaymentRequest",
        "privateToken",
        "credentialless"
    ];
    targetKeys.forEach(k => {
        proxyGetter(HTMLIFrameElement.prototype, k, (target, self, args) => {
            let originValue = functionCall(target, self, args);

            let contentWindow = functionCall(originContentWindowGet, self, args);
            if (contentWindow) {
                scopeCheat(contentWindow, scopeBrowser, 'contentWindow:' + k)
            }
            return originValue
        }, {skipAbsent: false})
    })
    return true
}


