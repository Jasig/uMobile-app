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
var _loginMethod = {},
config = require('/js/config'),
app = require('/js/Facade'),
sessionProxy = require('/js/models/SessionProxy');
exports.events = {
    NETWORK_SESSION_FAILURE : "EstablishNetworkSessionFailure",
    NETWORK_SESSION_SUCCESS : "EstablishNetworkSessionSuccess",
    LOGIN_METHOD_RESPONSE   : "LoginProxyLoginMethodResponse",
    LOGIN_METHOD_COMPLETE   : "LoginProxyLoginMethodComplete",
    WEBVIEW_LOGIN_RESPONSE  : "LoginProxyWebviewLoginResponse",
    WEBVIEW_LOGIN_FAILURE   : "LoginProxyWebviewLoginFailure",
    WEBVIEW_LOGIN_SUCCESS   : "LoginProxyWebviewLoginSuccess"
};

app.sessionTimeContexts = {
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


switch (config.LOGIN_METHOD) {
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
        Ti.API.error("Login method not recognized in exports.exports.initialize()");
}

sessionProxy.createSessionTimer();

Ti.App.addEventListener(sessionProxy.events['TIMER_EXPIRED'], exports.onSessionExpire);
Ti.App.addEventListener(exports.events['LOGIN_METHOD_RESPONSE'], exports._processLoginResponse);

exports.isActiveSession = function () {
    return sessionProxy.isActive();
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
    credentials = app.models.userProxy.retrieveCredentials();
    _loginMethod.login(credentials, options);
};

exports.clearSession = function () {
    _loginMethod.logout();
};

exports.onNetworkError = function (e) {
    Ti.App.fireEvent(app.events['NETWORK_ERROR']);
};

exports.onSessionExpire = function (e) {
    exports.establishNetworkSession({isUnobtrusive: true});
};

exports._processLoginResponse = function (e) {
    var _responseText = e.responseText, _credentials = e.credentials, _parsedResponse;
    
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
        app.models.userProxy.saveLayoutUserName(_parsedResponse.user);
        return;
    }
    
    app.models.userProxy.saveLayoutUserName(_parsedResponse.user);
    app.models.portalProxy.savePortlets(_parsedResponse.layout);
    
    if (app.models.userProxy.retrieveLayoutUserName() === _credentials.username) {
        Ti.API.info("_layoutUser matches credentials.username");

        sessionProxy.resetTimer();
        app.models.portalProxy.saveIsPortalReachable(true);
        Ti.App.fireEvent(exports.events['NETWORK_SESSION_SUCCESS'], {user: app.models.userProxy.retrieveLayoutUserName()});
    }
    else {
        Ti.API.error("Network session failed");
        app.models.portalProxy.saveIsPortalReachable(false);
        Ti.App.fireEvent(exports.events['NETWORK_SESSION_FAILURE'], {user: _parsedResponse.user});
    }
};