var SharedWebView = function (facade) {
    var app = facade, webView, init, customLoad;
    
    init = function () {
        activityIndicator = app.views.GlobalActivityIndicator;
        webView = Ti.UI.createWebView(app.styles.portletView);
        webView.addEventListener('load', onWebViewLoad);
        webView.addEventListener('beforeload', onBeforeWebViewLoad);
        webView.load = load;
    };
    
    function onWebViewLoad (e) {
        Ti.API.debug("Firing onBeforeWebViewLoad in SharedWebView: " + JSON.stringify(e));
        
        if (e.url.indexOf(app.UPM.CAS_URL) > -1) {
            //This should be webView.hide() if there weren't a bug with evalJS on Android.
            //Currently, the script to automatically submit form is disabled until Titanium bug 3554 is resolved.
            //Begin workaround
            //webView.hide();
            Ti.App.fireEvent('SharedWebViewLoad', {url: e.url});
            
            //End workaround
            Ti.API.debug("The current page is a CAS page.");
            var credentials, jsString;
            credentials = app.models.loginProxy.getCredentials();
            
            if (credentials.username && credentials.password) {
                //Fill out the form in the page and submit
                jsString = "$('#username').val('" + credentials.username +"');$('#password').val('" + credentials.password +"');$('.btn-submit').click();";
                // Ti.API.debug("Preparing to evalJS in webView: " + jsString);
                //Disabled until a bug is resolved.
                // webView.evalJS(jsString);
            }
            else {
                //Credentials don't exist, so we'll need to let the user login manually.
                //Note, the user shouldn't even see the CAS page unless they've logged in
                //at some point as something other than the default guest login...but
                //that's not the concern of this method.
                Ti.API.debug("Credentials don't contain username and password: " + JSON.stringify(credentials));
            }
        }
        else {
            Ti.App.fireEvent('SharedWebViewLoad', {url: e.url});
        }
    }
    
    function onBeforeWebViewLoad (e) {
        Ti.API.debug("Loading portlet");
        activityIndicator.message = app.localDictionary.loading;
        activityIndicator.resetDimensions();
        activityIndicator.show();
        Ti.App.fireEvent("SharedWebViewBeforeLoad");
    }
    
    load = function (url) {
        /*
        This method determines if a session is valid for the webview, and will
        either modify the URL and load, or will load the URL as-is if session is active.
        */
        // webView.stopLoading();
        webView.show();
        Ti.API.debug("load() in SharedWebView. Is valid webview session?" + app.models.loginProxy.isValidWebViewSession());
        if (!app.models.loginProxy.isValidWebViewSession()) {
            var doCas, doLocal;
            doLocal = function () {
                Ti.API.debug("load > doLocal() in SharedWebView");
                Ti.API.debug("Resulting URL: " + app.models.loginProxy.getLocalLoginURL(url));
                webView.url = app.models.loginProxy.getLocalLoginURL(url);
            };
            
            doCas = function () {
                Ti.API.debug("load > doCas() in SharedWebView");
                Ti.API.debug("CAS URL is: " + app.models.loginProxy.getCASLoginURL(url));
                webView.url = app.models.loginProxy.getCASLoginURL(url);
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
            if (url.indexOf('/') === 0) {
                webView.url = app.UPM.BASE_PORTAL_URL + app.UPM.PORTAL_CONTEXT + url;
            }
            else {
                webView.url = url;
            }
            
        }
        
    };
    
    
    
    init();
    
    return webView;
};