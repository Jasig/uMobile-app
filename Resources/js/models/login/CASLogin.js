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
config = require('/js/config'),
deviceProxy = require('/js/models/DeviceProxy'),
userProxy = require('/js/models/UserProxy'),
app = require('/js/Constants'),
refUrl = config.PORTAL_CONTEXT + '/layout.json',
serviceUrl = config.BASE_PORTAL_URL + config.PORTAL_CONTEXT + '/Login?refUrl=' + refUrl,
logoutUrl = config.CAS_URL + '/logout';

// XHR client
var client;

exports.login = function (credentials, forceLogout) {
    Ti.API.debug('login() in CASLogin');
    _credentials = credentials;
    
    //If there's no user name, let's skip a step and load the guest layout
    if (!_credentials.username) return _onLogoutComplete();
    
    function _login (e) {
        _url = config.CAS_URL + '/login?service=' + Titanium.Network.encodeURIComponent(serviceUrl);
        // Send an initial request to the CAS login page
        client = Titanium.Network.createHTTPClient({
            onload: _onInitialResponse,
            onerror: _onInitialError
        });

        client.open('GET', _url, true);
        if (client.clearCookies) client.clearCookies(config.BASE_PORTAL_URL) && client.clearCookies(config.CAS_URL);
        if (deviceProxy.isAndroid()) client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
        client.send();
    }
    if (forceLogout === true) {
        client = Titanium.Network.createHTTPClient({
            onload: _login,
            onerror: _onInitialError
        });
        client.open('GET', logoutUrl, true);
        if (deviceProxy.isAndroid()) client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
        client.send();
        return; 
    }
    _login();
};

exports.logout = function () {
    Ti.API.debug('logout() in CASLogin');
    // Log out the network session, which also clears the webView session in iPhone
    client = Titanium.Network.createHTTPClient({
        onload: _onLogoutComplete,
        onerror: _onInitialError
    });
    client.open('GET', logoutUrl, true);
    if (deviceProxy.isAndroid()) client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
    client.send();
};

function _onLogoutComplete (e) {
    Ti.API.debug('_onLogoutComplete() in CASLogin');
    client = Titanium.Network.createHTTPClient({
        onload: function (e) {
            // If it's Android, we'll use our custom clearcookies method to clear the webview cookies
            if (deviceProxy.isAndroid() && client.clearCookies) client.clearCookies(config.BASE_PORTAL_URL);
            // Logout process complete, now let's get the user's layout and process the response.
            client = Titanium.Network.createHTTPClient({
                onload: _onLoginComplete,
                onerror: _onLoginError
            });
            
            client.open('GET', config.LAYOUT_URL, true);
            if (deviceProxy.isAndroid()) client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
            client.send();
        },
        onerror: _onInitialError
    });
    client.open('GET', serviceUrl, true);
    if (deviceProxy.isAndroid()) client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
    client.send();
    
    
};

function _onLoginComplete (e) {
    Ti.API.debug('_onLoginComplete() in CASLogin.');
    // Examine the response to determine if authentication was successful.  If
    // we get back a CAS page, assume that the credentials were invalid.
    
    var _failureRegex;
    
    _failureRegex = new RegExp(/body id="cas"/);
    if (_failureRegex.exec(client.responseText)) {
        Ti.App.fireEvent(app.loginEvents['LOGIN_METHOD_ERROR']);
    }
    else {
        Ti.App.fireEvent(app.loginEvents['LOGIN_METHOD_COMPLETE'], { response: client.responseText });
    }
};

function _onLoginError (e) {
    Ti.API.debug('_onLoginError() in CASLogin');
    Ti.App.fireEvent(app.loginEvents['LOGIN_METHOD_ERROR']);
};

function _onInitialError (e) {
    Ti.API.debug('_onInitialError() in CASLogin');
    Ti.App.fireEvent(app.loginEvents['LOGIN_METHOD_ERROR']);
};

function _onInitialResponse (e) {
    Ti.API.debug('_onInitialResponse() in CASLogin.');
    var flowRegex, flowId, executionRegex, executionId, initialResponse, data, _parsedResponse;
    
    // CAS will redirect to layout.json if the user has already logged in, so we want 
    // to check if the base URL is what should only be returned after login
    // if (client.responseText.indexOf('"layout": [') > -1) return Ti.App.fireEvent(app.loginEvents['LOGIN_METHOD_COMPLETE'], {response: client.responseText});
    if (client.responseText.indexOf('name="lt"') === -1) return exports.login(_credentials, true);
    
    // Parse the returned page, looking for the Spring Webflow ID.  We'll need
    // to post this token along with our credentials.
    initialResponse = client.responseText;

    flowRegex = /input type="hidden" name="lt" value="([a-z0-9\-]*)?"/i;
    executionRegex = /input type="hidden" name="execution" value="([a-z0-9\-]*)?"/i;

    try {
        flowId = flowRegex.exec(initialResponse)[1];
        if(executionRegex.test(initialResponse)) 
        	executionId = executionRegex.exec(initialResponse)[1];
        else
         	executionId = null;
        // Post the user credentials and other required webflow parameters to the 
        // CAS login page.  This step should accomplish authentication and redirect
        // to the portal if the user is successfully authenticated.
        client = Titanium.Network.createHTTPClient({
            onload: _onLoginComplete,
            onerror: _onLoginError
        });

        client.open('POST', _url, true);
        if (deviceProxy.isAndroid()) client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
        
        if(executionId!=null) {
	        data = { 
	            username: _credentials.username, 
	            password: _credentials.password, 
	            lt: flowId, 
	            execution: executionId,
	            _eventId: 'submit', 
	            submit: 'LOGIN' 
	        };
	    }
	    else {
	    	data = { 
	            username: _credentials.username, 
	            password: _credentials.password, 
	            lt: flowId,
	            _eventId: 'submit', 
	            submit: 'LOGIN' 
	        };
	    }
        
        client.send(data);
    }
    catch (e) {
        Ti.API.error("Couldn't get flowID from response");
        Ti.API.debug('response: '+client.responseText);
        Ti.App.fireEvent(app.loginEvents['LOGIN_METHOD_ERROR']);
    }
};