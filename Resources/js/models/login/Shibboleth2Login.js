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
/*
This method is only known to work with Titanium SDK 1.7.5, 
and logout only works if the Ti.Network.HTTPClient.clearCookies method
has been implemented. It will be tested with later versions of the Titanium SDK
*/
var _credentials, _client,
_loginURL = app.config.SHIB_URL,
_postURL = app.config.SHIB_POST_URL,
_logoutURL = app.config.BASE_PORTAL_URL + app.config.PORTAL_CONTEXT + "/Logout";

exports.login = function (credentials, options) {
    _credentials = credentials;
    if (_credentials.username === '') return _onPortalSessionEstablished();
    
    /*
        First step is to load the HTML form, which sets the cookies
        that will be used to complete the login process and login to
        the portal.
    */
    _client = Ti.Network.createHTTPClient({
        onload: function (e) {
            _client = Ti.Network.createHTTPClient({
                onload  : _onInitialResponse,
                onerror : _onInitialError
            });
            _client.open('GET', _loginURL);
            _client.send();
        },
        onerror: function (e) {
            Ti.API.error("There was an error requesting the portal");
        }
    });
    _client.open("GET", app.config.BASE_PORTAL_URL + app.config.PORTAL_CONTEXT);
    
    if (_client.clearCookies) {
        _client.clearCookies(app.config.BASE_PORTAL_URL);
        _client.clearCookies(app.config.SHIB_BASE_URL);
        _client.clearCookies(app.config.SHIB_BASE_URL + "/idp");
    }
    if (app.models.deviceProxy.isAndroid()) {
        _client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
    }
    _client.send();
};

exports.logout = function () {
    _credentials = {
        username: '',
        password: ''
    };
    _client = Ti.Network.createHTTPClient({
        onload  : _onPortalSessionEstablished,
        onerror : _onPortalSessionEstablishedError
    });
    _client.open('GET', _logoutURL);
    _client.send();
};

exports.retrieveLoginURL = function (url) {
    return _loginURL;
};

function _onInitialResponse (e) {
    var initialResponse = _client.responseText;

    try {
        _client = Titanium.Network.createHTTPClient({
            onload: _onLoginComplete,
            onerror: _onLoginError
        });

        _client.open('POST', _postURL, true);
        if (app.models.deviceProxy.isAndroid()) {
            _client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
        }
        
        data = { 
            j_username: _credentials.username, 
            j_password: _credentials.password
        };
        _client.send(data);
    }
    catch (e) {
        Ti.API.error("Couldn't log in with Shibboleth");
        Ti.App.fireEvent(app.loginEvents['LOGIN_METHOD_ERROR']);
    }
};

function _onInitialError (e) {
    Ti.App.fireEvent(app.loginEvents["LOGIN_METHOD_ERROR"]);
};

function _getRedirectURL (responseText) {
    //https://mysandbox.uchicago.edu/Shibboleth.sso/SAML2/POST
    var redirectURL = responseText.split('<form action="')[1].split('" method="post">')[0];

    redirectURL = redirectURL.replace("&#x3a;",":");

    for (var i=0, iLength = redirectURL.split("&#x2f;").length; i<iLength; i++) {
        redirectURL = redirectURL.replace("&#x2f;","/");
    }
    return redirectURL;
};

function _getSAMLResponse (responseText) {
    // Select value of <input name="SAMLResponse" value="..."/>
    var _samlRegex = /\"SAMLResponse\" value=\"(.*)\"/;
    return _samlRegex.exec(responseText)[1];
};

function _getRelayState (responseText) {
    //Select value of <input name="RelayState" value="..."/>
    var _relayRegex = /\"RelayState\" value=\"(.*)\"/;
    return _relayRegex.exec(responseText)[1].replace('&#x3a;',':');
};

_onPortalSessionEstablished = function (e) {
    /*
        Shibboleth has posted back to the portal to log the user in. Now
        we just need to retrieve layout.json.
    */
    _client = Ti.Network.createHTTPClient({
        onload: function (e) {
            Ti.App.fireEvent(app.loginEvents['LOGIN_METHOD_COMPLETE'], { response : _client.responseText });
        },
        onerror: function (e) {
            Ti.App.fireEvent(app.loginEvents["LOGIN_METHOD_ERROR"]);
        }
    });

    if (_credentials.username === '' && _client.clearCookies) {
        _client.clearCookies(app.config.BASE_PORTAL_URL);
        _client.clearCookies(app.config.SHIB_BASE_URL);
        _client.clearCookies(app.config.SHIB_BASE_URL + "/idp");
    }
    else if (_client.clearCookies) {
        Ti.API.error("client.clearCookies() isn't defined.");
    }
    _client.open("GET", app.config.BASE_PORTAL_URL + app.config.PORTAL_CONTEXT + "/Login?refUrl=/layout.json");
    
    if (app.models.deviceProxy.isAndroid()) {
        _client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
    }
    _client.send({autoRedirect:true});
};

function _onPortalSessionEstablishedError (e) {
    Ti.App.fireEvent(app.loginEvents["LOGIN_METHOD_ERROR"]);
};

function _isLoginSuccess (responseText) {
    /*
        Will evaluate responseText to tell you if a response
        contains info indicating that login was successful.
    */
    if (responseText.indexOf("SAMLResponse") > -1) {
        return true;
    }
    return false;
};

function _onLoginComplete (e) {
    var _loginCompleteResponse = _client.responseText;
    
    if (_isLoginSuccess(_loginCompleteResponse)) {
        _client = Titanium.Network.createHTTPClient({
            onload: _onPortalSessionEstablished,
            onerror: _onPortalSessionEstablishedError
        });
        _client.open("POST", _getRedirectURL(_loginCompleteResponse));
        _client.send({
            SAMLResponse: _getSAMLResponse(_loginCompleteResponse),
            RelayState: _getRelayState(_loginCompleteResponse)
        });
    }
    else {
        Ti.API.error("!_isLoginSuccess()");
        /*
            Apparently the login process has stalled, so we're going to
            attempt to just load the layout anyway and let the app
            figure out how to let the user know.
        */
        _onPortalSessionEstablished(e);
    }
};

function _onLoginError (e) {
    Ti.App.fireEvent(app.loginEvents["LOGIN_METHOD_ERROR"]);
};