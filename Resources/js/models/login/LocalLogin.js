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
    Config, Login, Session, User, client, url, credentials, onLoginComplete, onLoginError;
    
    init = function () {
        Config = app.config;
    };
    
    this.login = function (creds, options) {
        Ti.API.debug("login() in LocalLogin");
        if (!Login) {
            Login = app.models.loginProxy;
        }
        if (!Session) {
            Session = app.models.sessionProxy;
        }
        if (!User) {
            User = app.models.userProxy;
        }
        credentials = creds;
        url = Config.BASE_PORTAL_URL + Config.PORTAL_CONTEXT + '/Login?userName=' + credentials.username + '&password=' + credentials.password + '&refUrl=' + Config.PORTAL_CONTEXT + '/layout.json';

        client = Titanium.Network.createHTTPClient({
            onload: onLoginComplete,
            onerror: onLoginError
        });
        
        client.open('GET', url, true);

        client.send();
    };
    
    this.getLoginURL = function (url) {
        // This method returns a URL suitable to automatically login a user in a webview.
        if (!User) {
            User = app.models.userProxy;
        }
        credentials = User.getCredentials();
        return Config.BASE_PORTAL_URL + Config.PORTAL_CONTEXT + '/Login?userName=' + credentials.username + '&password=' + credentials.password + '&refUrl=' + Ti.Network.encodeURIComponent(url);
    };
    
    onLoginComplete = function (e) {
        Ti.API.debug("onLoginComplete() in LocalLogin");
        
        User.setLayoutUserName(Login.getLayoutUser(client));
        
        if (User.getLayoutUserName() === credentials.username || User.getLayoutUserName() === 'guest') {
            Ti.API.info("_layoutUser matches credentials.username");
            Ti.API.info("Login.sessionTimeContexts.NETWORK: " + LoginProxy.sessionTimeContexts.NETWORK);
            Session.resetTimer(LoginProxy.sessionTimeContexts.NETWORK);
            Ti.App.fireEvent('EstablishNetworkSessionSuccess', {user: User.getLayoutUserName()});
            Ti.API.info("Should've fired EstablishNetworkSessionSuccess event");
        }
        else {
            Ti.API.error("Network session failed");
            Ti.App.fireEvent('EstablishNetworkSessionFailure', {user: _layoutUser});
        }
    };
    
    onLoginError = function (e) {
        Session.stopTimer(LoginProxy.sessionTimeContexts.NETWORK);
        Ti.App.fireEvent('EstablishNetworkSessionFailure');
    };
    
    init();
};