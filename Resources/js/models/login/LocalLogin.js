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

var init,
client, url, credentials, onLoginComplete, onLoginError, sessionProxy,
app = require('/js/Facade'),
config = require('/js/config'),
userProxy = require('/js/models/UserProxy');

exports.doSetSessionProxy = function (proxy) {
    sessionProxy = proxy;
};

exports.login = function (creds, options) {
    credentials = creds;
    url = config.BASE_PORTAL_URL + config.PORTAL_CONTEXT + '/Login?userName=' + credentials.username + '&password=' + credentials.password + '&refUrl=' + config.PORTAL_CONTEXT + '/layout.json';
    // url = config.BASE_PORTAL_URL + config.PORTAL_CONTEXT + '/Login?userName=' + credentials.username + '&password=' + credentials.password;

    client = Titanium.Network.createHTTPClient({
        onload: onLoginComplete,
        onerror: onLoginError
    });
    
    client.open('GET', url, true);

    client.send();
};

exports.logout = function () {
    exports.login({username: '', password: ''});
    if (client.clearCookies) {
        client.clearCookies(config.BASE_PORTAL_URL);
    }
};

exports.retrieveLoginURL = function (url) {
    // This method returns a URL suitable to automatically login a user in a webview.
    credentials = userProxy.retrieveCredentials();
    return config.BASE_PORTAL_URL + config.PORTAL_CONTEXT + '/Login?userName=' + credentials.username + '&password=' + credentials.password + '&refUrl=' + Ti.Network.encodeURIComponent(url);
};

onLoginComplete = function (e) {
    try {
        _parsedResponse = JSON.parse(client.responseText);
    }
    catch (e) {
        _parsedResponse = {
            user: app.userTypes['NO_USER'],
            layout: []
        };
    }
    
    userProxy.saveLayoutUserName(_parsedResponse.user);
    Ti.App.fireEvent(app.portalEvents['PORTLETS_RETRIEVED_SUCCESS'], { portlets: _parsedResponse.layout });
    
    if (userProxy.retrieveLayoutUserName() === credentials.username || userProxy.retrieveLayoutUserName() === app.userTypes['GUEST']) {
        sessionProxy.resetTimer();
        Ti.App.fireEvent(app.portalEvents['PORTAL_REACHABLE'], { reachable: true });
        Ti.App.fireEvent(app.loginEvents['NETWORK_SESSION_SUCCESS'], {user: userProxy.retrieveLayoutUserName()});
    }
    else {
        Ti.App.fireEvent(app.portalEvents['PORTAL_REACHABLE'], { reachable: false });
        Ti.App.fireEvent(app.loginEvents['NETWORK_SESSION_FAILURE'], {user: _parsedResponse.user});
    }
};

onLoginError = function (e) {
    sessionProxy.stopTimer();
    Ti.App.fireEvent(app.loginEvents['NETWORK_SESSION_FAILURE']);
};