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

var _url, _credentials, sessionProxy,
config = require('/js/config'),
deviceProxy = require('/js/models/DeviceProxy'),
userProxy = require('/js/models/UserProxy'),
app = require('/js/Facade'),
_refUrl = config.PORTAL_CONTEXT + '/layout.json',
_serviceUrl = config.BASE_PORTAL_URL + config.PORTAL_CONTEXT + '/Login?refUrl=' + _refUrl,
_logoutUrl = config.CAS_URL + '/logout';

// XHR client
var _client;

exports.doSetSessionProxy = function (proxy) {
    sessionProxy = proxy;
};

exports.login = function (credentials, opts) {
    _credentials = credentials;
    if (_credentials.username === '') {
        /*_credentials.username = app.userTypes['GUEST'];
        _credentials.password = app.userTypes['GUEST'];
        exports.logout();*/
        _client = Titanium.Network.createHTTPClient({
            onload: _onLoginComplete,
            onerror: _onLoginError,
            validatesSecureCertificate: false
        });
        
        _client.open('GET', _serviceUrl, true);
        if (deviceProxy.isAndroid()) {
            if(_client.clearCookies) _client.clearCookies(config.BASE_PORTAL_URL);
            _client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
        }
        else if (deviceProxy.isIOS()) {
        	if (_client.clearCookies) _client.clearCookies(config.BASE_PORTAL_URL);
        }
        _client.send();
    }
    else {
        _url = config.CAS_URL + '/login?service=' + Titanium.Network.encodeURIComponent(_serviceUrl);
        
        // Send an initial response to the CAS login page
        _client = Titanium.Network.createHTTPClient({
            onload: _onInitialResponse,
            onerror: _onInitialError,
            validatesSecureCertificate: false
        });
        
        _client.open('GET', _url, true);
        if (deviceProxy.isAndroid()) _client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
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
    if (deviceProxy.isAndroid() && _client.clearCookies) _client.clearCookies(config.BASE_PORTAL_URL);
};

function _onLogoutComplete (e) {
    _client = Titanium.Network.createHTTPClient({
        onload: function (e) {
            _processResponse(_client.responseText);
        },
        onerror: _onInitialError
    });
    _client.open('GET', _serviceUrl, true);
    if (deviceProxy.isAndroid()) _client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
    _client.send();
};

function _onLoginComplete (e) {
    // Examine the response to determine if authentication was successful.  If
    // we get back a CAS page, assume that the credentials were invalid.
    
    var _failureRegex;
    
    _failureRegex = new RegExp(/body id="cas"/);
    if (_failureRegex.exec(_client.responseText)) {
        sessionProxy.stopTimer();
        Ti.App.fireEvent(app.loginEvents['NETWORK_SESSION_FAILURE']);
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
            user: app.userTypes['NO_USER'],
            layout: []
        };
    }   

    userProxy.saveLayoutUserName(_parsedResponse.user);
    Ti.App.fireEvent(app.portalEvents['PORTLETS_RETRIEVED_SUCCESS'], { portlets: _parsedResponse.layout });

    if (userProxy.retrieveLayoutUserName() === _credentials.username || userProxy.retrieveLayoutUserName() === app.userTypes['GUEST']) {
        sessionProxy.resetTimer();
        
        Ti.App.fireEvent(app.portalEvents['PORTAL_REACHABLE'], { reachable: true });
        Ti.App.fireEvent(app.loginEvents['NETWORK_SESSION_SUCCESS'], {user: userProxy.retrieveLayoutUserName()});
    }
    else {
        Ti.App.fireEvent(app.portalEvents['PORTAL_REACHABLE'], { reachable: false });
        Ti.App.fireEvent(app.loginEvents['NETWORK_SESSION_FAILURE'], {user: _parsedResponse.user});
    }
};

function _onLoginError (e) {
    sessionProxy.stopTimer();
    Ti.App.fireEvent(app.loginEvents['NETWORK_SESSION_FAILURE']);
};

function _onInitialError (e) {
    sessionProxy.stopTimer();
    Ti.App.fireEvent(app.loginEvents['NETWORK_SESSION_FAILURE']);
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
            // Post the user credentials and other required webflow parameters to the 
            // CAS login page.  This step should accomplish authentication and redirect
            // to the portal if the user is successfully authenticated.
            _client = Titanium.Network.createHTTPClient({
                onload: _onLoginComplete,
                onerror: _onLoginError
            });

            _client.open('POST', _url, true);
            if (deviceProxy.isAndroid()) _client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
            
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
            Ti.App.fireEvent(app.loginEvents['NETWORK_SESSION_FAILURE']);
        }
    }
};