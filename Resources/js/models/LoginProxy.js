var LoginProxy = function (facade) {
    var app = facade, _self = this, 
        Config, Session, Device, User, LocalLogin, CASLogin, loginMethod,
        init, updateSessionTimeout, establishSilentNetworkSession,
        networkSessionTimer, webViewSessionTimer, onSessionExpire, onNetworkError;

    
    init = function () {
        // Create an instance of the static loginMethods variable, so other actors
        // can get the methods via the LoginProxy instance on the facade.
        
        _self.loginMethods = LoginProxy.loginMethods;
        
        //Implement constants for what contexts are available for session timeouts.
        _self.sessionTimeContexts = LoginProxy.sessionTimeContexts;
        
        Config = app.config;
        Device = app.models.deviceProxy;
        Session = app.models.sessionProxy;
        User = app.models.userProxy;
        LocalLogin = app.models.localLogin;
        CASLogin = app.models.CASLogin;
        
        Ti.API.debug("Setting login method: " + Config.LOGIN_METHOD);
        switch (Config.LOGIN_METHOD) {
            case LoginProxy.loginMethods.CAS:
                loginMethod = CASLogin.login;
                break;
            case LoginProxy.loginMethods.LOCAL_LOGIN:
                loginMethod = LocalLogin.login;
                break;
            default:
                Ti.API.info("Login method not recognized in LoginProxy.init()");
        }
        
        Session.createSessionTimer(_self.sessionTimeContexts.NETWORK);
        Session.createSessionTimer(_self.sessionTimeContexts.WEBVIEW);
        
        Ti.App.addEventListener('SessionTimerExpired', onSessionExpire);
    };
    
    this.updateSessionTimeout = function(context) {
        /* If Android, this method will reset the timer for either the network session or 
        portlet session so we can be sure to log the user back in if necessary.
        It's a public method so that other controllers can call it each time an
        activity occurs that will extend a session. 
        
        In iPhone, we share one session between network requests and webviews, so we'll reset both timers.
        */
        switch (context) {
            case this.sessionTimeContexts.NETWORK:
                Session.resetTimer(LoginProxy.sessionTimeContexts.NETWORK);
                break;
            case this.sessionTimeContexts.WEBVIEW:
                Session.resetTimer(LoginProxy.sessionTimeContexts.WEBVIEW);
                break;
            default:
                Ti.API.debug("Context for sessionTimeout didn't match");
        }
    };
    
    this.isValidWebViewSession = function () {
        // if(!networkSessionTimer.isActive && Device.isAndroid()) {
        return Session.isActive(LoginProxy.sessionTimeContexts.WEBVIEW);
    };
    
    this.isValidNetworkSession = function () {
        var checkSessionUrl, checkSessionClient, checkSessionResponse;
        //Checks to see if the networkSessionTimer says it's active, and also checks that the API indicates a valid session.
        if(Session.isActive(LoginProxy.sessionTimeContexts.NETWORK)) {
            Ti.API.info('this.isValidNetworkSession() in LoginProxy.' + Session.isActive(LoginProxy.sessionTimeContexts.NETWORK));
            return true;
        }
        else {
            Ti.API.info("No session timer created yet, will check session by other means.");
        }

        Ti.API.info('Detected potential session timeout');

        try {
            // Contact the portal's session REST service to determine if the user has 
            // a current session.  We expect this page to return JSON, but it's possible
            // that some SSO system may cause the service to return a login page instead. 
            checkSessionUrl = Config.BASE_PORTAL_URL + Config.PORTAL_CONTEXT + '/api/session.json';
            checkSessionClient = Titanium.Network.createHTTPClient();
            checkSessionClient.open('GET', checkSessionUrl, false);
            /*
                TODO Remove this line when the guest session is returned properly (temporary hack)
            */
            checkSessionClient.setRequestHeader('User-Agent','Mozilla/5.0 (Linux; U; Android 2.1; en-us; Nexus One Build/ERD62) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17 –Nexus');
            
            checkSessionClient.send();

            Ti.API.info(checkSessionClient.responseText);
            checkSessionResponse = JSON.parse(checkSessionClient.responseText);
            if (checkSessionResponse.person) {
                Ti.API.info("There was a person in the session response: " + checkSessionResponse.person);
                // The session service responded with valid JSON containing an object
                // representing the current user (either an authenticated or guest user)
                return true;
            }
        } catch (error) {
            Ti.API.debug("Error encountered while checking session validity " + error.message);
        }

        // Either the session service responded with invalid JSON or indicated
        // no session present on the server
        return false;
    };
    
    /**
     * Establish a session on the uPortal server.
     */
    this.establishNetworkSession = function(options) {
        var credentials, url, onAuthComplete, onAuthError, authenticator;
        /* 
        Possible options: 
            isUnobtrusive (Bool), tells it not to reload anything, just establish-the session again behind the scenes
        */
        Ti.API.info("Establishing Network Session");
        onAuthError = function (e) {
            var _user = _self.getLayoutUser(authenticator);
            Ti.API.info("onAuthError in LoginProxy.establishNetworkSession");
            Session.stopTimer(LoginProxy.sessionTimeContexts.NETWORK);
            Ti.App.fireEvent("EstablishNetworkSessionFailure", {user: _user});
        };
        
        onAuthComplete = function (e) {
            var _user = _self.getLayoutUser(authenticator);
            Ti.API.info("onAuthComplete in LoginProxy.establishNetworkSession" + authenticator.responseText);
            Session.resetTimer(LoginProxy.sessionTimeContexts.NETWORK);
            
            if (!options || !options.isUnobtrusive) {
                Ti.App.fireEvent("EstablishNetworkSessionSuccess", {user: _user});
            }
        };

        // If the user has configured credentials, attempt to perform CAS 
        // authentication 
        credentials = User.getCredentials();
        if (credentials.username && credentials.password) {
            Ti.API.info("Using standard login method with existing credentials.");
            loginMethod(credentials, options);
        }

        // If no credentials are available just log into uPortal as a guest through
        // the portal login servlet
        else {
            url = Config.BASE_PORTAL_URL + Config.PORTAL_CONTEXT + '/Login?isNativeDevice=true';
            Ti.API.info("No credentials available, opening login url: " + url);
            
            authenticator = Titanium.Network.createHTTPClient({
                onload: onAuthComplete,
                onerror: onAuthError
            });
            authenticator.open('GET', url, true);
            /*
                TODO Remove this line when the guest session is returned properly (temporary hack)
            */
            authenticator.setRequestHeader('User-Agent','Mozilla/5.0 (Linux; U; Android 2.1; en-us; Nexus One Build/ERD62) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17 –Nexus');
            authenticator.send();
        }
    };
    
    this.getLoginURL = function (url) {
        switch (Config.LOGIN_METHOD) {
            case LoginProxy.loginMethods.LOCAL_LOGIN:
                return LocalLogin.getLoginURL(url);
            case LoginProxy.loginMethods.CAS:
                return CASLogin.getLoginURL(url);
            default:
                Ti.API.error("No login method matches " + Config.LOGIN_METHOD);
                return false;                
        }
    };
    
    this.getLayoutUser = function (client) {
        var _layout, _username, _responseXML;
        if (!client.responseXML) {
            Ti.API.info("No responseXML");
            if (typeof DOMParser != "undefined") {
                Ti.API.info("No DOMParser");
                // Titanium Desktop 1.0 doesn't fill out responseXML.
                // We'll use WebKit's XML parser...
                _responseXML = (new DOMParser()).parseFromString(client.responseText, "text/xml");
            } 
            else {
                Ti.API.info("There is a DOMParser");
                // Titanium Mobile 1.3 doesn't fill out responseXML on Android.
                // We'll use Titanium's XML parser...
                _responseXML = Titanium.XML.parseString(client.responseText);
            }
        } 
        else {
            Ti.API.info("There IS responseXML");
            _responseXML = client.responseXML;
        }
        
        _layout = _responseXML.getElementsByTagName('json-layout').item(0).text;

        _username = JSON.parse(_layout).user;
        
        return _username;
    };
    
    onNetworkError = function (e) {
        Ti.App.fireEvent("LoginProxyError");
    };
    
    onSessionExpire = function (e) {
        // If it's not Android, we can just re-establish a session for 
        // webviews and network requests behind the scenes.
        // Otherwise, we can re-establish network session behind the scenes,
        // but would need to set a flag for re-auth in the webview.
        Ti.API.debug("onSessionExpire() in LoginProxy");
        switch (e.context) {
            case _self.sessionTimeContexts.NETWORK:
                _self.establishNetworkSession({isUnobtrusive: true});
                break;
            case _self.sessionTimeContexts.WEBVIEW:  
                Ti.API.info("Stopping webViewSessionTimer");
                Session.stopTimer(LoginProxy.sessionTimeContexts.WEBVIEW);
                break;
            default:
                Ti.API.info("Didn't recognize the context");
        }
    };
    
    init();
};
LoginProxy.sessionTimeContexts = {
    NETWORK: "Network",
    WEBVIEW: "Webview"
};

LoginProxy.loginMethods = {
    CAS: "Cas",
    LOCAL_LOGIN: "LocalLogin"
};