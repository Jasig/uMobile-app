var SharedWebView = function (facade) {
    var app = facade, webView, init,
        onWebViewLoad, onBeforeWebViewLoad;
    
    init = function () {
        webView = Ti.UI.createWebView(app.styles.portletView);
        webView.addEventListener('load', onWebViewLoad);
        webView.addEventListener('beforeload', onBeforeWebViewLoad);
        
    };
    
    onWebViewLoad = function (e) {
        Ti.API.debug("Firing onBeforeWebViewLoad in SharedWebView: " + JSON.stringify(e));
        Ti.App.fireEvent('SharedWebViewLoad', {url: e.url});
    };
    
    onBeforeWebViewLoad = function (e) {
        Ti.App.fireEvent("SharedWebViewBeforeLoad");
    };
    
    
    
    init();
    
    return webView;
};