/*
 * Licensed to Jasig under one or more contributor license
 * agreements. See the NOTICE file distributed with this work
 * for additional information regarding copyright ownership.
 * Jasig licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a
 * copy of the License at:
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var LoginProxy = function (facade) {
    var app = facade, _self = this;
    
    this._loginMethod = {};
    
    this.init = function () {
        // Create an instance of the static loginMethods variable, so other actors
        // can get the methods via the LoginProxy instance on the facade.
        
        _self.loginMethods = LoginProxy.loginMethods;
        
        //Implement constants for what contexts are available for session timeouts.
        _self.sessionTimeContexts = LoginProxy.sessionTimeContexts;
        
        CASLogin = app.models.CASLogin;
        
        Ti.API.debug("Setting login method: " + app.config.LOGIN_METHOD);
        
        switch (app.config.LOGIN_METHOD) {
            case LoginProxy.loginMethods.CAS:
                _self._loginMethod = app.models.CASLogin;
                break;
            case LoginProxy.loginMethods.LOCAL_LOGIN:
                _self._loginMethod = app.models.localLogin;
                break;
            case LoginProxy.loginMethods.SHIBBOLETH2:
                _self._loginMethod = app.models.Shibboleth2Login;
                break;
            default:
                Ti.API.info("Login method not recognized in LoginProxy.this.init()");
        }
        
        app.models.sessionProxy.createSessionTimer(_self.sessionTimeContexts.NETWORK);
        app.models.sessionProxy.createSessionTimer(_self.sessionTimeContexts.WEBVIEW);
        
        Ti.App.addEventListener(SessionProxy.events['TIMER_EXPIRED'], this.onSessionExpire);
        Ti.App.addEventListener(LoginProxy.events['LOGIN_METHOD_RESPONSE'], this._processLoginResponse);
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
                app.models.sessionProxy.resetTimer(LoginProxy.sessionTimeContexts.NETWORK);
                break;
            case this.sessionTimeContexts.WEBVIEW:
                app.models.sessionProxy.resetTimer(LoginProxy.sessionTimeContexts.WEBVIEW);
                break;
            default:
                Ti.API.debug("Context for sessionTimeout didn't match");
        }
    };
    
    this.isValidWebViewSession = function () {
        // if(!this._variables['networkSessionTimer'].isActive && app.models.deviceProxy.isAndroid()) {
        return app.models.sessionProxy.isActive(LoginProxy.sessionTimeContexts.WEBVIEW);
    };
    
    /**
     * Establish a session on the uPortal server.
     */
    this.establishNetworkSession = function(options) {
        /*
            Very commonly-used method in the app to create network sessions
            when the app starts up, when the user updates their credentials, 
            and when the local network session timer expires.
        */
        var credentials, url;

        credentials = app.models.userProxy.getCredentials();
        _self._loginMethod.login(credentials, options);
    };
    
    this.clearSession = function () {
        _self._loginMethod.logout();
    };
    
    this.getLoginURL = function (url) {
        /*
            Method created specifically for use in the Portlet Window 
            Controller, for use with 
        */
        _self._loginMethod.getLoginURL(url);
        
        /* Old method, deprecated 9/30/2011 by Jeff Cross
        switch (app.config.LOGIN_METHOD) {
            case LoginProxy.loginMethods.LOCAL_LOGIN:
                return app.models.localLogin.getLoginURL(url);
            case LoginProxy.loginMethods.CAS:
                return app.models.CASLogin.getLoginURL(url);
            case LoginProxy.loginMethods.SHIBBOLETH2:
                return app.models.Shibboleth2Login.getLoginURL(url);
            default:
                Ti.API.error("No login method matches " + app.config.LOGIN_METHOD);
                return false;                
        }
        */
    };
    
    this.createWebViewSession = function (credentials, webView, returnURL) {
        /*
            This creates a new webview and logs it in to automatically store
            cookies. Credentials contain decrypted username and password.
            
        */
        Ti.API.debug("createWebViewSession() in LoginProxy.");
        _self._loginMethod.createWebViewSession(credentials, webView, returnURL);
    };
    
    this.onNetworkError = function (e) {
        Ti.App.fireEvent(ApplicationFacade.events['NETWORK_ERROR']);
    };
    
    this.onSessionExpire = function (e) {
        /*
            If it's not Android, we can just re-establish a session for 
            webviews and network requests behind the scenes.
            Otherwise, we can re-establish network session behind the scenes,
            but would need to set a flag for re-auth in the webview.
        */
        Ti.API.debug("this.onSessionExpire() in LoginProxy");
        switch (e.context) {
            case _self.sessionTimeContexts.NETWORK:
                _self.establishNetworkSession({isUnobtrusive: true});
                break;
            case _self.sessionTimeContexts.WEBVIEW:  
                app.models.sessionProxy.stopTimer(LoginProxy.sessionTimeContexts.WEBVIEW);
                break;
            default:
                Ti.API.error("Didn't recognize the context");
        }
    };
    
    this._processLoginResponse = function (e) {
        var _responseText = e.responseText, _credentials = e.credentials, _parsedResponse;
        
        try {
            _parsedResponse = JSON.parse(_responseText);
        }
        catch (e) {
            _parsedResponse = {
                user: LoginProxy.userTypes['NO_USER'],
                layout: []
            };
        }
        
        Ti.API.debug("Parsed response: " + JSON.stringify(_parsedResponse));
        
        app.models.userProxy.setLayoutUserName(_parsedResponse.user);
        app.models.portalProxy.setPortlets(_parsedResponse.layout);
        
        if (app.models.userProxy.getLayoutUserName() === _credentials.username || app.models.userProxy.getLayoutUserName() === LoginProxy.userTypes['GUEST']) {
            Ti.API.info("_layoutUser matches credentials.username");

            app.models.sessionProxy.resetTimer(LoginProxy.sessionTimeContexts.NETWORK);
            app.models.portalProxy.setIsPortalReachable(true);
            Ti.App.fireEvent(LoginProxy.events['NETWORK_SESSION_SUCCESS'], {user: app.models.userProxy.getLayoutUserName()});
        }
        else {
            Ti.API.error("Network session failed");
            app.models.portalProxy.setIsPortalReachable(false);
            Ti.App.fireEvent(LoginProxy.events['NETWORK_SESSION_FAILURE'], {user: _parsedResponse.user});
        }
    };
    
    this.init();
};

LoginProxy.events = {
    NETWORK_SESSION_FAILURE : "EstablishNetworkSessionFailure",
    NETWORK_SESSION_SUCCESS : "EstablishNetworkSessionSuccess",
    LOGIN_METHOD_RESPONSE   : "LoginProxyLoginMethodResponse",
    LOGIN_METHOD_COMPLETE   : "LoginProxyLoginMethodComplete",
    WEBVIEW_LOGIN_RESPONSE  : "LoginProxyWebviewLoginResponse",
    WEBVIEW_LOGIN_FAILURE   : "LoginProxyWebviewLoginFailure",
    WEBVIEW_LOGIN_SUCCESS   : "LoginProxyWebviewLoginSuccess"
};

LoginProxy.sessionTimeContexts = {
    NETWORK: "Network",
    WEBVIEW: "Webview"
};

LoginProxy.loginMethods = {
    CAS         : "Cas",
    LOCAL_LOGIN : "LocalLogin",
    SHIBBOLETH2  : "Shibboleth"
};

LoginProxy.userTypes = {
    GUEST   : "guest",
    NO_USER : "NoUser"
};