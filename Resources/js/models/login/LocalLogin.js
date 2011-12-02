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
client, url, credentials, onLoginComplete, onLoginError;

exports.login = function (creds, options) {
    Ti.API.debug('login() in LocalLogin. creds?' + creds);
    credentials = creds;
    url = app.config.BASE_PORTAL_URL + app.config.PORTAL_CONTEXT + '/Login?userName=' + credentials.username + '&password=' + credentials.password + '&refUrl=' + app.config.PORTAL_CONTEXT + '/layout.json';
    // url = app.config.BASE_PORTAL_URL + app.config.PORTAL_CONTEXT + '/Login?userName=' + credentials.username + '&password=' + credentials.password;

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
        client.clearCookies(app.config.BASE_PORTAL_URL);
    }
};

exports.retrieveLoginURL = function (url) {
    // This method returns a URL suitable to automatically login a user in a webview.
    credentials = app.models.userProxy.retrieveCredentials();
    return app.config.BASE_PORTAL_URL + app.config.PORTAL_CONTEXT + '/Login?userName=' + credentials.username + '&password=' + credentials.password + '&refUrl=' + Ti.Network.encodeURIComponent(url);
};

onLoginComplete = function (e) {
    try {
        _parsedResponse = JSON.parse(client.responseText);
    }
    catch (e) {
        _parsedResponse = {
            user: app.models.loginProxy.userTypes['NO_USER'],
            layout: []
        };
    }
    
    app.models.userProxy.saveLayoutUserName(_parsedResponse.user);
    app.models.portalProxy.savePortlets(_parsedResponse.layout);
    
    if (app.models.userProxy.retrieveLayoutUserName() === credentials.username || app.models.userProxy.retrieveLayoutUserName() === app.models.loginProxy.userTypes['GUEST']) {
        app.models.sessionProxy.resetTimer(app.models.loginProxy.sessionTimeContexts.NETWORK);
        app.models.portalProxy.saveIsPortalReachable(true);
        Ti.App.fireEvent(app.models.loginProxy.events['NETWORK_SESSION_SUCCESS'], {user: app.models.userProxy.retrieveLayoutUserName()});
    }
    else {
        app.models.portalProxy.saveIsPortalReachable(false);
        Ti.App.fireEvent(app.models.loginProxy.events['NETWORK_SESSION_FAILURE'], {user: _parsedResponse.user});
    }
};

onLoginError = function (e) {
    app.models.sessionProxy.stopTimer(app.models.loginProxy.sessionTimeContexts.NETWORK);
    Ti.App.fireEvent(app.models.loginProxy.events['NETWORK_SESSION_FAILURE']);
};