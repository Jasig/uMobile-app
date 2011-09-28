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
var CASLogin = function (facade) {
    var _self = this;
    
    // Pseudo private variables
    this._app = facade;
    this._url;
    this._credentials;
    this._androidCookie;
    this._refUrl = _self._app.config.PORTAL_CONTEXT + '/layout.json';
    this._serviceUrl = _self._app.config.BASE_PORTAL_URL + _self._app.config.PORTAL_CONTEXT + '/Login?refUrl=' + _self._refUrl;
    this._logoutUrl = _self._app.config.BASE_PORTAL_URL + _self._app.config.PORTAL_CONTEXT + '/logout';
    
    // XHR client
    this._client;
    
    this._init = function () {
        // Nothing to init
    };
    
    this.login = function (credentials, opts) {
        _self._credentials = credentials;
        if (_self._credentials.username === '') {
            _self._credentials.username = LoginProxy.userTypes['GUEST'];
            _self._credentials.password = LoginProxy.userTypes['GUEST'];
            _self.logout();
        }
        else {
            _self._url = _self._app.config.CAS_URL + '/login?service=' + Titanium.Network.encodeURIComponent(_self._serviceUrl);

            // Send an initial response to the CAS login page
            _self._client = Titanium.Network.createHTTPClient({
                onload: _self._onInitialResponse,
                onerror: _self._onInitialError,
                validatesSecureCertificate: false
            });
            _self._client.open('GET', _self._url, true);

            _self._client.send();            
        }
    };
    
    this.logout = function () {
        Ti.API.debug("logout() in CASLogin");
        _self._client = Titanium.Network.createHTTPClient({
            onload: _self._onLogoutComplete,
            onerror: _self._onInitialError
        });
        _self._client.open('GET', _self._logoutUrl, true);

        _self._client.send();
    };
    
    this._onLogoutComplete = function (e) {
        Ti.API.debug("_onLogoutComplete() in CASLogin");
        _self._client = Titanium.Network.createHTTPClient({
            onload: function (e) {
                _self._processResponse(_self._client.responseText);
            },
            onerror: _self._onInitialError
        });
        _self._client.open('GET', _self._serviceUrl, true);

        _self._client.send();
    };
    
    this.getLoginURL = function (url) {
        var separator = url.indexOf('?') >= 0 ? '&' : '?';
        return _self._app.config.CAS_URL + '/login?service=' + Titanium.Network.encodeURIComponent(url + separator + 'isNativeDevice=true');
    };
    
    this._onLoginComplete = function (e) {
        Ti.API.debug("_self._onLoginComplete() in CASLogin " + _self._client.location);
        // Examine the response to determine if authentication was successful.  If
        // we get back a CAS page, assume that the credentials were invalid.
        
        var _failureRegex;
        
        _failureRegex = new RegExp(/body id="cas"/);
        if (_failureRegex.exec(_self._client.responseText)) {
            _self._app.models.sessionProxy.stopTimer(LoginProxy.sessionTimeContexts.NETWORK);
            Ti.App.fireEvent(LoginProxy.events['NETWORK_SESSION_FAILURE']);
        } 
        else {
            _self._processResponse(_self._client.responseText);
        }
    };
    
    this._processResponse = function (responseText) {
        Ti.API.debug("_processResponse() in CASLogin");
        var _parsedResponse;
        try {
            _parsedResponse = JSON.parse(responseText);
        }
        catch (e) {
            _parsedResponse = {
                user: LoginProxy.userTypes['NO_USER'],
                layout: []
            };
        }   

        _self._app.models.userProxy.setLayoutUserName(_parsedResponse.user);
        _self._app.models.portalProxy.setPortlets(_parsedResponse.layout);

        if (_self._app.models.userProxy.getLayoutUserName() === _self._credentials.username || _self._app.models.userProxy.getLayoutUserName() === LoginProxy.userTypes['GUEST']) {
            Ti.API.info("_layoutUser matches _self._credentials.username");
            Ti.API.info("_self._app.models.loginProxy.sessionTimeContexts.NETWORK: " + LoginProxy.sessionTimeContexts.NETWORK);
            _self._app.models.sessionProxy.resetTimer(LoginProxy.sessionTimeContexts.NETWORK);
            _self._app.models.portalProxy.setIsPortalReachable(true);
            Ti.App.fireEvent(LoginProxy.events['NETWORK_SESSION_SUCCESS'], {user: _self._app.models.userProxy.getLayoutUserName()});
            Ti.API.info("Should've fired EstablishNetworkSessionSuccess event");
        }
        else {
            Ti.API.error("Network session failed");
            _self._app.models.portalProxy.setIsPortalReachable(false);
            Ti.App.fireEvent(LoginProxy.events['NETWORK_SESSION_FAILURE'], {user: _parsedResponse.user});
        }
    };
    
    this._onLoginError = function (e) {
        Ti.API.error("_self._onLoginError() in CASLogin");
        _self._app.models.sessionProxy.stopTimer(LoginProxy.sessionTimeContexts.NETWORK);
        Ti.App.fireEvent(LoginProxy.events['NETWORK_SESSION_FAILURE']);
    };
    
    this._onInitialError = function (e) {
        Ti.API.error("_self._onInitialError() in CASLogin");
        _self._app.models.sessionProxy.stopTimer(LoginProxy.sessionTimeContexts.NETWORK);
        Ti.App.fireEvent(LoginProxy.events['NETWORK_SESSION_FAILURE']);
    };
    
    this._onInitialResponse = function (e) {
        Ti.API.debug("_self._onInitialResponse() in CASLogin");
        if (_self._app.models.deviceProxy.isAndroid()) _self._androidCookie = _self._client.getResponseHeader('Set-Cookie');
        
        var flowRegex, flowId, initialResponse, data, _parsedResponse;
        
        // CAS will redirect to layout.json if the user has already logged in, so we want 
        // to check if the base URL is what should only be returned after login
        if (_self._client.location.indexOf(_self._app.config.BASE_PORTAL_URL + _self._refUrl) == 0) {
            Ti.API.debug("_self._client.location.indexOf(_self._app.config.BASE_PORTAL_URL + _self._refUrl) == 0");
            
            function _reLogin () {
                _self._client = Titanium.Network.createHTTPClient({
                    onload: function (e) {
                        _self._client = Titanium.Network.createHTTPClient({
                            onload: _self._onInitialResponse,
                            onerror: _self._onInitialError
                        });
                        _self._client.open('GET', _self._url, true);
                        Ti.API.debug("Preparing to load " + _self._url);

                        _self._client.send();
                    },
                    onerror: _self._onInitialError
                });
                _self._client.open('GET', _self._logoutUrl, true);

                _self._client.send();
            }
            
            // Check if a) the response can parse, and b) if the returned user matches 
            // The user we're trying to authenticate. If so, we're done with the login and 
            // can proceed with processing the response.
            try {
                _parsedResponse = JSON.parse(_self._client.responseText);
                if (_parsedResponse.user === _self._credentials.username) {
                    Ti.API.debug("_parsedResponse.user === _self._credentials.username");
                    _self._processResponse(_self._client.responseText);
                }
                else {
                    _reLogin();
                }
            }
            catch (e) {
                Ti.API.error("Couldn't parse JSON");
                _reLogin();
            }
        }
        else {
            // Parse the returned page, looking for the Spring Webflow ID.  We'll need
            // to post this token along with our credentials.
            initialResponse = _self._client.responseText;
            Ti.API.debug("initialResponse: " + initialResponse);
            flowRegex = /input type="hidden" name="lt" value="([a-z0-9\-]*)?"/i;
            Ti.API.debug("flowRegex: " + flowRegex);

            try {
                flowId = flowRegex.exec(initialResponse)[1];
                Ti.API.debug("flowId: " + flowId);
                // Post the user credentials and other required webflow parameters to the 
                // CAS login page.  This step should accomplish authentication and redirect
                // to the portal if the user is successfully authenticated.
                _self._client = Titanium.Network.createHTTPClient({
                    onload: _self._onLoginComplete,
                    onerror: _self._onLoginError
                });
                Ti.API.debug("Getting ready to open URL: " + _self._url);

                _self._client.open('POST', _self._url, true);
                
                Ti.API.debug("If this is Android, we're going to manually set a cookie: " + _self._androidCookie);
                if (_self._app.models.deviceProxy.isAndroid()) _self._client.setRequestHeader('Cookie', _self._androidCookie);
                

                Ti.API.debug("Getting ready to populate data object");
                Ti.API.debug(_self._credentials.username);


                data = { 
                    username: _self._credentials.username, 
                    password: _self._credentials.password, 
                    lt: flowId, 
                    _eventId: 'submit', 
                    submit: 'LOGIN' 
                };
                _self._client.send(data);
                Ti.API.debug("_self._client.send() with data: " + JSON.stringify(data));
            }
            catch (e) {
                Ti.API.error("Couldn't get flowID from response");
                Ti.App.fireEvent(LoginProxy.events['NETWORK_SESSION_FAILURE']);
            }


        }
    };
    
    _self._init();
};