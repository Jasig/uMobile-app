var SharedWebView = function (facade) {
    var app = facade, webView, init, customLoad,
        onWebViewLoad, onBeforeWebViewLoad;
    
    init = function () {
        activityIndicator = app.views.GlobalActivityIndicator;
        webView = Ti.UI.createWebView(app.styles.portletView);
        webView.addEventListener('load', onWebViewLoad);
        webView.addEventListener('beforeload', onBeforeWebViewLoad);
        webView.load = load;
    };
    
    onWebViewLoad = function (e) {
        Ti.API.debug("Firing onBeforeWebViewLoad in SharedWebView: " + JSON.stringify(e));
        Ti.App.fireEvent('SharedWebViewLoad', {url: e.url});
    };
    
    onBeforeWebViewLoad = function (e) {
        Ti.API.debug("Loading portlet");
        activityIndicator.message = app.localDictionary.loading;
        activityIndicator.resetDimensions();
        activityIndicator.show();
        Ti.App.fireEvent("SharedWebViewBeforeLoad");
    };
    
    load = function (url) {
        /*
        This method determines if a session is valid for the webview, and will
        either modify the URL and load, or will load the URL as-is if session is active.
        */
        Ti.API.debug("load() in SharedWebView. Is valid webview session?" + app.models.loginProxy.isValidWebViewSession());
        if (!app.models.loginProxy.isValidWebViewSession()) {
            var doCas, doLocal;
            doLocal = function () {
                Ti.API.debug("load > doLocal() in SharedWebView");
                webView.url = app.models.loginProxy.getLocalLoginURL(url);
                Ti.API.debug("Resulting URL: " + app.models.loginProxy.getLocalLoginURL(url));
            };
            
            doCas = function () {
                var loginUrl, onLoginReady, onLoginComplete;
                Ti.API.debug("load > doCas() in SharedWebView");
                //Remove event listeners temporarily so we can redirect.
                webView.removeEventListener('load', onWebViewLoad);
                webView.removeEventListener('beforeload', onBeforeWebViewLoad);
                
                
                onLoginComplete = function () {
                    //Re-implement standard event listeners
                    webView.addEventListener('load', onWebViewLoad);
                    webView.addEventListener('beforeload', onBeforeWebViewLoad);
                    
                    webView.url = url;
                };
            };
            switch (app.UPM.LOGIN_METHOD) {
                case app.models.loginProxy.loginMethods.CAS:
                    doCas();
                    break;
                case app.models.loginProxy.loginMethods.LOCAL_LOGIN:
                    doLocal();
                    break;
                default:
                    Ti.API.debug("Unrecognized login method in SharedWebView.load()");
            }
        }
        else {
            webView.url = url;
        }
        
    };
    
    
    
    init();
    
    return webView;
};