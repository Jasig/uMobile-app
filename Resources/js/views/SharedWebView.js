var SharedWebView = function (facade) {
    var app = facade, self = {}, webView, init, initialized, 
    loadingTimer, loadingChecks, loadingTimeout = 15, manualLoadingTimer;
    
    init = function () {
        Ti.API.debug("init() in SharedWebView");
        webView = Ti.UI.createWebView(app.styles.portletView);
        
        // webView.addEventListener('load', self.onWebViewLoad);
        
        Ti.API.debug("0 Is webview loading? " + webView.loading);
        
        activityIndicator = app.views.GlobalActivityIndicator.createActivityIndicator();
        
        initialized = true;
    };
    self.show = function () {
        webView.show();
    };
    
    self.hide = function () {
        webView.hide();
    };
    
    self.stopLoading = function () {
        webView.stopLoading();
    };
    
    self.getWebView = function () {
        return webView;
    };
    
    self.setTop = function (t) {
        if (typeof t === 'number') {
            webView.top = t;
        }
        else {
            Ti.API.debug("value passed to setTop() in SharedWebView was of type " + typeof t);
        }
    };
    
    /*manualLoadingTimer = function () {
        
            // Because the webview is quirky with loading events,
            // this timer will check every 500 ms to see if the webview is still loading, and if not, 
            // will keep checking for however many seconds have been set in loadingTimer.
        
        
        Ti.API.debug("manualLoadingTimer() in SharedWebView");
        Ti.API.info("Is webView loading? " + webView.loading);
        
        if (loadingTimer) {
            clearInterval(loadingTimer);
        }
        loadingChecks = 0; //How many times we've checked for loaded content.
        loadingTimer = setInterval(function(){
            Ti.API.debug("loading interval... " + webView.loading);
            if (!webView.loading) {
                clearInterval(loadingTimer);
                Ti.API.debug("Webview isn't loading");
                Ti.App.fireEvent('SharedWebViewLoad', { url: webView.url });
                return;
            }
            else if (loadingChecks >= (loadingTimeout * 1000)) {
                clearInterval(loadingTimer);
                Ti.API.debug("Waited 15 seconds for content to load");
                return;
            }
            loadingChecks += 100;
        }, 100);
    };*/
    
    self.getExternalUrl = function (url) {
        Ti.API.debug("getExternalUrl() in SharedWebView");
        webView.url = url;
        // manualLoadingTimer();
    };
    
    self.getLocalUrl = function (url) {
        Ti.API.debug("getLocalUrl() in SharedWebView");
        /*
        This method determines if a session is valid for the webview, and will
        either modify the URL and load, or will load the URL as-is if session is active.
        */
        webView.stopLoading();

        //We only need to check the session if it's a link to the portal.
        Ti.API.debug("getLocalUrl() in SharedWebView. Is valid webview session?" + app.models.loginProxy.isValidWebViewSession());
        Ti.API.debug("URL to load is: " + url);
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
                Ti.API.info("Index of / in URL is 0");
                var newUrl = app.UPM.BASE_PORTAL_URL + url;
                Ti.API.info(newUrl);
                webView.url = newUrl;
                Ti.App.fireEvent('SessionActivity', {context: LoginProxy.sessionTimeContexts.WEBVIEW});
            }
            else {
                Ti.API.info("Index of / in URL is NOT 0");
                webView.url = url;
                Ti.App.fireEvent('SessionActivity', {context: LoginProxy.sessionTimeContexts.WEBVIEW});
            }
        }
        // manualLoadingTimer();
    };
    
    self.onWebViewLoad = function (e) {
        Ti.API.debug("Firing onWebViewLoad in SharedWebView: " + JSON.stringify(e));
        Ti.App.fireEvent('SharedWebViewLoad', {url: e.url});
        //clearInterval(loadingTimer);
        
        if (e.url.indexOf(app.UPM.CAS_URL) > -1) {
            //This should be webView.hide() if there weren't a bug with evalJS on Android.
            //Currently, the script to automatically submit form is disabled until Titanium bug 3554 is resolved.
            //Begin workaround
            //webView.hide();


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
    };
    
    if (!initialized) {
        init();
    }
    
    return self;
};