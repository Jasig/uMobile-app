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
    
    this._variables = {
        loginMethod         : ''
    };
    
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
                _self._variables['loginMethod'] = app.models.CASLogin.login;
                break;
            case LoginProxy.loginMethods.LOCAL_LOGIN:
                _self._variables['loginMethod'] = app.models.localLogin.login;
                break;
            case LoginProxy.loginMethods.SHIBBOLETH2:
                _self._variables['loginMethod'] = app.models.Shibboleth2Login.login;
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
        var credentials, url;
        /* 
        Possible options: 
            isUnobtrusive (Bool), tells it not to reload anything, just establish-the session again behind the scenes
        */
        

        credentials = app.models.userProxy.getCredentials();
        Ti.API.info("Establishing Network Session for username: " + credentials.username);
        _self._variables['loginMethod'](credentials, options);
    };
    
    this.getLoginURL = function (url) {
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
    };
    
    this.onNetworkError = function (e) {
        Ti.App.fireEvent(ApplicationFacade.events['NETWORK_ERROR']);
    };
    
    this.onSessionExpire = function (e) {
        // If it's not Android, we can just re-establish a session for 
        // webviews and network requests behind the scenes.
        // Otherwise, we can re-establish network session behind the scenes,
        // but would need to set a flag for re-auth in the webview.
        Ti.API.debug("this.onSessionExpire() in LoginProxy");
        switch (e.context) {
            case _self.sessionTimeContexts.NETWORK:
                _self.establishNetworkSession({isUnobtrusive: true});
                break;
            case _self.sessionTimeContexts.WEBVIEW:  
                Ti.API.info("Stopping webViewSessionTimer");
                app.models.sessionProxy.stopTimer(LoginProxy.sessionTimeContexts.WEBVIEW);
                break;
            default:
                Ti.API.info("Didn't recognize the context");
        }
    };
    
    this._processLoginResponse = function (e) {
        var _responseText = e.responseText, _parsedResponse;
        
        Ti.API.debug("onLoginComplete() in LocalLogin. Response: " + client.responseText);
        try {
            _parsedResponse = JSON.parse(client.responseText);
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
        
        if (app.models.userProxy.getLayoutUserName() === credentials.username || app.models.userProxy.getLayoutUserName() === LoginProxy.userTypes['GUEST']) {
            Ti.API.info("_layoutUser matches credentials.username");
            Ti.API.info("app.models.loginProxy.sessionTimeContexts.NETWORK: " + LoginProxy.sessionTimeContexts.NETWORK);
            app.models.sessionProxy.resetTimer(LoginProxy.sessionTimeContexts.NETWORK);
            app.models.portalProxy.setIsPortalReachable(true);
            Ti.App.fireEvent(LoginProxy.events['NETWORK_SESSION_SUCCESS'], {user: app.models.userProxy.getLayoutUserName()});
            Ti.API.info("Should've fired EstablishNetworkSessionSuccess event");
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
    NETWORK_SESSION_FAILURE : 'EstablishNetworkSessionFailure',
    NETWORK_SESSION_SUCCESS : 'EstablishNetworkSessionSuccess',
    LOGIN_METHOD_RESPONSE   : "LoginProxyLoginMethodResponse",
    LOGIN_METHOD_COMPLETE   : 'LoginProxyLoginMethodComplete'
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