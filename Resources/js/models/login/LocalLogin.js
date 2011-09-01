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
var LocalLogin = function (facade) {
    var app = facade, init, _self = this,
    client, url, credentials, onLoginComplete, onLoginError;
    this._variables = {
        
    };
    
    this.login = function (creds, options) {
        Ti.API.debug("login() in LocalLogin");
        
        credentials = creds;
        url = app.config.BASE_PORTAL_URL + app.config.PORTAL_CONTEXT + '/Login?userName=' + credentials.username + '&password=' + credentials.password + '&refUrl=' + app.config.PORTAL_CONTEXT + Ti.Network.encodeURIComponent('/layout.json?timestamp=' + (new Date()).getTime());
        Ti.API.info("Requesting URL: " + url);

        client = Titanium.Network.createHTTPClient({
            onload: onLoginComplete,
            onerror: onLoginError
        });
        
        client.open('GET', url, true);

        client.send();
    };
    
    this.getLoginURL = function (url) {
        // This method returns a URL suitable to automatically login a user in a webview.
        credentials = app.models.userProxy.getCredentials();
        return app.config.BASE_PORTAL_URL + app.config.PORTAL_CONTEXT + '/Login?userName=' + credentials.username + '&password=' + credentials.password + '&refUrl=' + Ti.Network.encodeURIComponent(url);
    };
    
    onLoginComplete = function (e) {
        Ti.API.debug("onLoginComplete() in LocalLogin. Response: " + client.responseText);
        
        app.models.userProxy.setLayoutUserName(app.models.loginProxy.getLayoutUser(client));
        app.models.portalProxy.setPortlets(JSON.parse(client.responseText).layout);
        
        if (app.models.userProxy.getLayoutUserName() === credentials.username || app.models.userProxy.getLayoutUserName() === 'guest') {
            Ti.API.info("_layoutUser matches credentials.username");
            Ti.API.info("app.models.loginProxy.sessionTimeContexts.NETWORK: " + LoginProxy.sessionTimeContexts.NETWORK);
            app.models.sessionProxy.resetTimer(LoginProxy.sessionTimeContexts.NETWORK);
            Ti.App.fireEvent(LoginProxy.events['NETWORK_SESSION_SUCCESS'], {user: app.models.userProxy.getLayoutUserName()});
            Ti.API.info("Should've fired EstablishNetworkSessionSuccess event");
        }
        else {
            Ti.API.error("Network session failed");
            Ti.App.fireEvent(LoginProxy.events['NETWORK_SESSION_FAILURE'], {user: _layoutUser});
        }
    };
    
    onLoginError = function (e) {
        app.models.sessionProxy.stopTimer(LoginProxy.sessionTimeContexts.NETWORK);
        Ti.App.fireEvent(LoginProxy.events['NETWORK_SESSION_FAILURE']);
    };
};