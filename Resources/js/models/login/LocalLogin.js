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
client, url, credentials, onLoginComplete, onLoginError,
app = require('/js/Constants'),
config = require('/js/config'),
userProxy = require('/js/models/UserProxy'),
deviceProxy = require('/js/models/DeviceProxy');

onLoginComplete = function (e) {
    Ti.API.debug('onLoginComplete() in LocalLogin');
    Ti.App.fireEvent(app.loginEvents['LOGIN_METHOD_COMPLETE'], { response: client.responseText });
};

onLoginError = function (e) {
    Ti.API.debug('onLoginError() in LocalLogin. e: '+JSON.stringify(e));
    Ti.App.fireEvent(app.loginEvents['LOGIN_METHOD_ERROR'], e);
};

exports.login = function (creds, options) {
    Ti.API.debug('exports.login() in LocalLogin. Username:'+creds.username);
    credentials = creds;
    url = config.BASE_PORTAL_URL + config.PORTAL_CONTEXT + '/Login?userName=' + credentials.username + '&password=' + credentials.password + '&refUrl=' + config.PORTAL_CONTEXT + '/layout.json';
    Ti.API.debug('Login url: '+url);
    client = Titanium.Network.createHTTPClient({
        onload: onLoginComplete,
        onerror: onLoginError
    });
    
    client.open('GET', url, true);
    if (client.clearCookies) client.clearCookies(config.BASE_PORTAL_URL) && client.clearCookies(config.CAS_URL);
    if (deviceProxy.isAndroid()) client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
    client.send();
};

exports.logout = function () {
    Ti.API.debug('exports.logout() in LocalLogin');
    var _logoutUrl = config.BASE_PORTAL_URL + config.PORTAL_CONTEXT + '/Logout';
    client = Titanium.Network.createHTTPClient({
        onload: function (e){
            Ti.API.debug('onload() in exports.logout() in LocalLogin');
            // If it's Android, we'll use our custom clearcookies method to 
            // clear the cookies in HTTPClient and WebView for good measure
            if (deviceProxy.isAndroid() && client.clearCookies) client.clearCookies(config.BASE_PORTAL_URL);
            
            // Logout process complete, now let's get the user's layout and process the response.
            client = Titanium.Network.createHTTPClient({
                onload: onLoginComplete,
                onerror: onLoginError
            });
            client.open('GET', config.LAYOUT_URL, true);
            
            if (deviceProxy.isAndroid()) client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
            client.send();
        },
        onerror: function (e) {
            Ti.API.debug('onerror() in exports.logout() in LocalLogin');
            Ti.App.fireEvent(app.loginEvents['LOGIN_METHOD_ERROR'], e);
        }
    });
    Ti.API.debug('_logoutUrl: '+_logoutUrl);
    client.open('GET', _logoutUrl, true);
    if (deviceProxy.isAndroid()) client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
    client.send();
};