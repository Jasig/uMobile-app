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
var _loginMethod = {};
exports.events = {
    NETWORK_SESSION_FAILURE : "EstablishNetworkSessionFailure",
    NETWORK_SESSION_SUCCESS : "EstablishNetworkSessionSuccess",
    LOGIN_METHOD_RESPONSE   : "LoginProxyLoginMethodResponse",
    LOGIN_METHOD_COMPLETE   : "LoginProxyLoginMethodComplete",
    WEBVIEW_LOGIN_RESPONSE  : "LoginProxyWebviewLoginResponse",
    WEBVIEW_LOGIN_FAILURE   : "LoginProxyWebviewLoginFailure",
    WEBVIEW_LOGIN_SUCCESS   : "LoginProxyWebviewLoginSuccess"
};

exports.sessionTimeContexts = {
    NETWORK: "Network",
    WEBVIEW: "Webview"
};

exports.loginMethods = {
    CAS         : "Cas",
    LOCAL_LOGIN : "LocalLogin",
    SHIBBOLETH2  : "Shibboleth"
};

exports.userTypes = {
    GUEST   : "guest",
    NO_USER : "NoUser"
};

exports.init = function () {
    switch (app.config.LOGIN_METHOD) {
        case exports.loginMethods.CAS:
            _loginMethod = require('/js/models/login/CASLogin');;
            break;
        case exports.loginMethods.LOCAL_LOGIN:
            _loginMethod = require('/js/models/login/LocalLogin');
            break;
        case exports.loginMethods.SHIBBOLETH2:
            _loginMethod = require('/js/models/login/Shibboleth2Login');
            break;
        default:
            Ti.API.error("Login method not recognized in exports.exports.init()");
    }
    
    app.models.sessionProxy.createSessionTimer(exports.sessionTimeContexts.NETWORK);
    app.models.sessionProxy.createSessionTimer(exports.sessionTimeContexts.WEBVIEW);
    
    Ti.App.addEventListener(SessionProxy.events['TIMER_EXPIRED'], exports.onSessionExpire);
    Ti.App.addEventListener(exports.events['LOGIN_METHOD_RESPONSE'], exports._processLoginResponse);
};

exports.updateSessionTimeout = function(context) {
    /* If Android, this method will reset the timer for either the network session or 
    portlet session so we can be sure to log the user back in if necessary.
    It's a public method so that other controllers can call it each time an
    activity occurs that will extend a session. 
    
    In iPhone, we share one session between network requests and webviews, so we'll reset both timers.
    */
    switch (context) {
        case exports.sessionTimeContexts.NETWORK:
            app.models.sessionProxy.resetTimer(exports.sessionTimeContexts.NETWORK);
            break;
        case exports.sessionTimeContexts.WEBVIEW:
            app.models.sessionProxy.resetTimer(exports.sessionTimeContexts.WEBVIEW);
            break;
        default:
            Ti.API.debug("Context for sessionTimeout didn't match");
    }
};

exports.isValidWebViewSession = function () {
    return app.models.sessionProxy.isActive(exports.sessionTimeContexts.WEBVIEW);
};

/**
 * Establish a session on the uPortal server.
 */
exports.establishNetworkSession = function(options) {
    /*
        Very commonly-used method in the app to create network sessions
        when the app starts up, when the user updates their credentials, 
        and when the local network session timer expires.
    */
    var credentials, url;

    credentials = app.models.userProxy.getCredentials();
    _loginMethod.login(credentials, options);
};

exports.clearSession = function () {
    _loginMethod.logout();
};

exports.getLoginURL = function (url) {
    /*
        Method created specifically for use in the Portlet Window 
        Controller, for use with 
    */
    _loginMethod.getLoginURL(url);
    
    /* Old method, deprecated 9/30/2011 by Jeff Cross
    switch (app.config.LOGIN_METHOD) {
        case exports.loginMethods.LOCAL_LOGIN:
            return app.models.localLogin.getLoginURL(url);
        case exports.loginMethods.CAS:
            return app.models.CASLogin.getLoginURL(url);
        case exports.loginMethods.SHIBBOLETH2:
            return app.models.Shibboleth2Login.getLoginURL(url);
        default:
            Ti.API.error("No login method matches " + app.config.LOGIN_METHOD);
            return false;                
    }
    */
};

exports.onNetworkError = function (e) {
    Ti.App.fireEvent(app.events['NETWORK_ERROR']);
};

exports.onSessionExpire = function (e) {
    /*
        If it's not Android, we can just re-establish a session for 
        webviews and network requests behind the scenes.
        Otherwise, we can re-establish network session behind the scenes,
        but would need to set a flag for re-auth in the webview.
    */
    Ti.API.debug("exports.onSessionExpire() in LoginProxy");
    switch (e.context) {
        case exports.sessionTimeContexts.NETWORK:
            exports.establishNetworkSession({isUnobtrusive: true});
            break;
        case exports.sessionTimeContexts.WEBVIEW:  
            app.models.sessionProxy.stopTimer(exports.sessionTimeContexts.WEBVIEW);
            break;
        default:
            Ti.API.error("Didn't recognize the context");
    }
};

exports._processLoginResponse = function (e) {
    var _responseText = e.responseText, _credentials = e.credentials, _parsedResponse;
    Ti.API.debug("_processLoginResponse() in LoginProxy: " + _responseText );
    
    if (_credentials.username === '') {
        _credentials.username = exports.userTypes['GUEST'];
    }
    
    try {
        _parsedResponse = JSON.parse(_responseText);
    }
    catch (e) {
        _parsedResponse = {
            user: exports.userTypes['NO_USER'],
            layout: []
        };
        Ti.App.fireEvent(exports.events['NETWORK_SESSION_FAILURE']);
        app.models.userProxy.setLayoutUserName(_parsedResponse.user);
        return;
    }
    
    Ti.API.debug("Parsed response: " + JSON.stringify(_parsedResponse));
    
    app.models.userProxy.setLayoutUserName(_parsedResponse.user);
    app.models.portalProxy.setPortlets(_parsedResponse.layout);
    
    if (app.models.userProxy.getLayoutUserName() === _credentials.username) {
        Ti.API.info("_layoutUser matches credentials.username");

        app.models.sessionProxy.resetTimer(exports.sessionTimeContexts.NETWORK);
        app.models.portalProxy.setIsPortalReachable(true);
        Ti.App.fireEvent(exports.events['NETWORK_SESSION_SUCCESS'], {user: app.models.userProxy.getLayoutUserName()});
    }
    else {
        Ti.API.error("Network session failed");
        app.models.portalProxy.setIsPortalReachable(false);
        Ti.App.fireEvent(exports.events['NETWORK_SESSION_FAILURE'], {user: _parsedResponse.user});
    }
};

exports.init();

