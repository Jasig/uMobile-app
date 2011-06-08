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
    
    /**
     * Establish a session on the uPortal server.
     */
    this.establishNetworkSession = function(options) {
        var credentials, url;
        /* 
        Possible options: 
            isUnobtrusive (Bool), tells it not to reload anything, just establish-the session again behind the scenes
        */
        Ti.API.info("Establishing Network Session");

        credentials = User.getCredentials();
        loginMethod(credentials, options);
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
        _layout = JSON.parse(client.responseText);
        _username = _layout.user;
        
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