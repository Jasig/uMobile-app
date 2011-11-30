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


    


var _url, _credentials, 
_refUrl = app.config.PORTAL_CONTEXT + '/layout.json',
_serviceUrl = app.config.BASE_PORTAL_URL + app.config.PORTAL_CONTEXT + '/Login?refUrl=' + _refUrl,
_logoutUrl = app.config.CAS_URL + '/logout';

// XHR client
var _client;


exports.login = function (credentials, opts) {
    _credentials = credentials;
    if (_credentials.username === '') {
        /*_credentials.username = app.models.loginProxy.userTypes['GUEST'];
        _credentials.password = app.models.loginProxy.userTypes['GUEST'];
        exports.logout();*/
        _client = Titanium.Network.createHTTPClient({
            onload: _onLoginComplete,
            onerror: _onLoginError,
            validatesSecureCertificate: false
        });
        
        _client.open('GET', _serviceUrl, true);
        if (app.models.deviceProxy.isAndroid()) {
            if(_client.clearCookies) _client.clearCookies(app.config.BASE_PORTAL_URL);
            _client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
        }
        else if (app.models.deviceProxy.isIOS()) {
        	if (_client.clearCookies) _client.clearCookies(app.config.BASE_PORTAL_URL);
        }
        _client.send();
    }
    else {
        _url = app.config.CAS_URL + '/login?service=' + Titanium.Network.encodeURIComponent(_serviceUrl);
        
        // Send an initial response to the CAS login page
        _client = Titanium.Network.createHTTPClient({
            onload: _onInitialResponse,
            onerror: _onInitialError,
            validatesSecureCertificate: false
        });
        
        _client.open('GET', _url, true);
        if (app.models.deviceProxy.isAndroid()) _client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
        _client.send();            
    }
};

exports.logout = function () {
    // Log out the network session, which also clears the webView session in iPhone
    _client = Titanium.Network.createHTTPClient({
        onload: _onLogoutComplete,
        onerror: _onInitialError
    });
    _client.open('GET', _logoutUrl, true);

    _client.send();
    
    // If it's Android, we'll use our custom clearcookies method to clear the webview cookies
    if (app.models.deviceProxy.isAndroid() && _client.clearCookies) _client.clearCookies(app.config.BASE_PORTAL_URL);
};

function _onLogoutComplete (e) {
    _client = Titanium.Network.createHTTPClient({
        onload: function (e) {
            _processResponse(_client.responseText);
        },
        onerror: _onInitialError
    });
    _client.open('GET', _serviceUrl, true);
    if (app.models.deviceProxy.isAndroid()) _client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
    _client.send();
};

function _onLoginComplete (e) {
    // Examine the response to determine if authentication was successful.  If
    // we get back a CAS page, assume that the credentials were invalid.
    
    var _failureRegex;
    
    _failureRegex = new RegExp(/body id="cas"/);
    if (_failureRegex.exec(_client.responseText)) {
        app.models.sessionProxy.stopTimer(app.models.loginProxy.sessionTimeContexts.NETWORK);
        Ti.App.fireEvent(app.models.loginProxy.events['NETWORK_SESSION_FAILURE']);
    } 
    else {
        _processResponse(_client.responseText);
    }
};

function _processResponse (responseText) {
    var _parsedResponse;
    try {
        _parsedResponse = JSON.parse(responseText);
    }
    catch (e) {
        _parsedResponse = {
            user: app.models.loginProxy.userTypes['NO_USER'],
            layout: []
        };
    }   

    app.models.userProxy.setLayoutUserName(_parsedResponse.user);
    app.models.portalProxy.setPortlets(_parsedResponse.layout);

    if (app.models.userProxy.getLayoutUserName() === _credentials.username || app.models.userProxy.getLayoutUserName() === app.models.loginProxy.userTypes['GUEST']) {
        app.models.sessionProxy.resetTimer(app.models.loginProxy.sessionTimeContexts.NETWORK);
        
        if (app.models.deviceProxy.isAndroid()) {
            app.models.sessionProxy.resetTimer(app.models.loginProxy.sessionTimeContexts.WEBVIEW);
        }
        
        app.models.portalProxy.setIsPortalReachable(true);
        Ti.App.fireEvent(app.models.loginProxy.events['NETWORK_SESSION_SUCCESS'], {user: app.models.userProxy.getLayoutUserName()});
    }
    else {
        app.models.portalProxy.setIsPortalReachable(false);
        Ti.App.fireEvent(app.models.loginProxy.events['NETWORK_SESSION_FAILURE'], {user: _parsedResponse.user});
    }
};

function _onLoginError (e) {
    app.models.sessionProxy.stopTimer(app.models.loginProxy.sessionTimeContexts.NETWORK);
    Ti.App.fireEvent(app.models.loginProxy.events['NETWORK_SESSION_FAILURE']);
};

function _onInitialError (e) {
    app.models.sessionProxy.stopTimer(app.models.loginProxy.sessionTimeContexts.NETWORK);
    Ti.App.fireEvent(app.models.loginProxy.events['NETWORK_SESSION_FAILURE']);
};

function _onInitialResponse (e) {
    var flowRegex, flowId, initialResponse, data, _parsedResponse;
    
    // CAS will redirect to layout.json if the user has already logged in, so we want 
    // to check if the base URL is what should only be returned after login
    if (_client.responseText.indexOf('"layout": [') > -1) {
        _processResponse(_client.responseText);
    }
    else {
        // Parse the returned page, looking for the Spring Webflow ID.  We'll need
        // to post this token along with our credentials.
        initialResponse = _client.responseText;

        flowRegex = /input type="hidden" name="lt" value="([a-z0-9\-]*)?"/i;

        try {
            flowId = flowRegex.exec(initialResponse)[1];
            Ti.API.debug("flowId: " + flowId);
            // Post the user credentials and other required webflow parameters to the 
            // CAS login page.  This step should accomplish authentication and redirect
            // to the portal if the user is successfully authenticated.
            _client = Titanium.Network.createHTTPClient({
                onload: _onLoginComplete,
                onerror: _onLoginError
            });

            _client.open('POST', _url, true);
            if (app.models.deviceProxy.isAndroid()) _client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
            
            data = { 
                username: _credentials.username, 
                password: _credentials.password, 
                lt: flowId, 
                _eventId: 'submit', 
                submit: 'LOGIN' 
            };
            _client.send(data);
        }
        catch (e) {
            Ti.API.error("Couldn't get flowID from response");
            Ti.App.fireEvent(app.models.loginProxy.events['NETWORK_SESSION_FAILURE']);
        }
    }
};