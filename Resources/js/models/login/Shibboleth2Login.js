/*
This method is only known to work with Titanium SDK 1.7.5, 
and logout only works if the Ti.Network.HTTPClient.clearCookies method
has been implemented. Testing with later versions of the Titanium DSK
*/

var Shibboleth2Login = function (facade) {
    var _self = this;
    
    this._app = facade;
    this._credentials;
    this._client;
    this._loginURL = _self._app.config.SHIB_URL;
    this._postURL = _self._app.config.SHIB_POST_URL;
    this._logoutURL = _self._app.config.BASE_PORTAL_URL + _self._app.config.PORTAL_CONTEXT + "/Logout";
    
    this.login = function (credentials, options) {
        _self._credentials = credentials;
        if (_self._credentials.username === '') {
            //No credentials with which to login, let's load layout.json
            _self._onPortalSessionEstablished();
        }
        else {
            /*
                First step is to load the HTML form, which sets the cookies
                that will be used to complete the login process and login to
                the portal.
            */
            _self._client = Ti.Network.createHTTPClient({
                onload: function (e) {
                    _self._client = Ti.Network.createHTTPClient({
                        onload  : _self._onInitialResponse,
                        onerror : _self._onInitialError
                    });
                    _self._client.open('GET', _self._loginURL);
                    _self._client.send();
                },
                onerror: function (e) {
                    Ti.API.error("There was an error requesting the portal");
                }
            });
            _self._client.open("GET", _self._app.config.BASE_PORTAL_URL + _self._app.config.PORTAL_CONTEXT);
            if (_self._client.clearCookies) {
                _self._client.clearCookies(_self._app.config.BASE_PORTAL_URL);
                _self._client.clearCookies(_self._app.config.SHIB_BASE_URL);
                _self._client.clearCookies(_self._app.config.SHIB_BASE_URL + "/idp");
            }
            if (_self._app.models.deviceProxy.osIsAndroid()) {
                _self._client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
            }
            _self._client.send();
        }
    };
    
    this.logout = function () {
        _self._credentials = {
            username: '',
            password: ''
        };
        _self._client = Ti.Network.createHTTPClient({
            onload  : _self._onPortalSessionEstablished,
            onerror : _self._onPortalSessionEstablishedError
        });
        _self._client.open('GET', _self._logoutURL);
        _self._client.send();
    };
    
    this.getLoginURL = function (url) {
        return _self._loginURL;
    };
    
    this._onInitialResponse = function (e) {
        var initialResponse = _self._client.responseText;

        try {
            _self._client = Titanium.Network.createHTTPClient({
                onload: _self._onLoginComplete,
                onerror: _self._onLoginError
            });

            _self._client.open('POST', _self._postURL, true);
            if (_self._app.models.deviceProxy.osIsAndroid()) {
                _self._client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
            }
            
            data = { 
                j_username: _self._credentials.username, 
                j_password: _self._credentials.password
            };
            _self._client.send(data);
        }
        catch (e) {
            Ti.API.error("Couldn't log in with Shibboleth");
            Ti.App.fireEvent(app.models.loginProxy.events['NETWORK_SESSION_FAILURE']);
        }
    };
    
    this._onInitialError = function (e) {
        Ti.App.fireEvent(app.models.loginProxy.events["NETWORK_SESSION_FAILURE"]);
    };
    
    this._getRedirectURL = function (responseText) {
        //https://mysandbox.uchicago.edu/Shibboleth.sso/SAML2/POST
        var redirectURL = responseText.split('<form action="')[1].split('" method="post">')[0];

        redirectURL = redirectURL.replace("&#x3a;",":");

        for (var i=0, iLength = redirectURL.split("&#x2f;").length; i<iLength; i++) {
            redirectURL = redirectURL.replace("&#x2f;","/");
        }
        return redirectURL;
    };
    
    this._getSAMLResponse = function (responseText) {
        // Select value of <input name="SAMLResponse" value="..."/>
        var _samlRegex = /\"SAMLResponse\" value=\"(.*)\"/;
        return _samlRegex.exec(responseText)[1];
    };
    
    this._getRelayState = function (responseText) {
        //Select value of <input name="RelayState" value="..."/>
        var _relayRegex = /\"RelayState\" value=\"(.*)\"/;
        return _relayRegex.exec(responseText)[1].replace('&#x3a;',':');
    };
    
    this._onPortalSessionEstablished = function (e) {
        /*
            Shibboleth has posted back to the portal to log the user in. Now
            we just need to retrieve layout.json.
        */
        _self._client = Ti.Network.createHTTPClient({
            onload: function (e) {
                Ti.App.fireEvent(app.models.loginProxy.events['LOGIN_METHOD_RESPONSE'], {
                    responseText:_self._client.responseText
                    , credentials: _self._credentials
                });
            },
            onerror: function (e) {
                Ti.App.fireEvent(app.models.loginProxy.events["NETWORK_SESSION_FAILURE"]);
            }
        });

        if (_self._credentials.username === '' && typeof _self._client.clearCookies !== "undefined") {
            _self._client.clearCookies(_self._app.config.BASE_PORTAL_URL);
            _self._client.clearCookies(_self._app.config.SHIB_BASE_URL);
            _self._client.clearCookies(_self._app.config.SHIB_BASE_URL + "/idp");
        }
        else if (typeof _self._client.clearCookies === "undefined") {
            Ti.API.error("client.clearCookies() isn't defined.");
        }
        _self._client.open("GET", _self._app.config.BASE_PORTAL_URL + _self._app.config.PORTAL_CONTEXT + "/Login?refUrl=/layout.json");
        
        if (_self._app.models.deviceProxy.osIsAndroid()) {
            _self._client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
        }
        _self._client.send({autoRedirect:true});
    };
    
    this._onPortalSessionEstablishedError = function (e) {
        Ti.App.fireEvent(app.models.loginProxy.events["NETWORK_SESSION_FAILURE"]);
    };
    
    this._isLoginSuccess = function (responseText) {
        /*
            Will evaluate responseText to tell you if a response
            contains info indicating that login was successful.
        */
        if (responseText.indexOf("SAMLResponse") > -1) {
            return true;
        }
        return false;
    };
    
    this._onLoginComplete = function (e) {
        var _loginCompleteResponse = _self._client.responseText;
        
        if (_self._isLoginSuccess(_loginCompleteResponse)) {
            _self._client = Titanium.Network.createHTTPClient({
                onload: _self._onPortalSessionEstablished,
                onerror: _self._onPortalSessionEstablishedError
            });
            _self._client.open("POST", _self._getRedirectURL(_loginCompleteResponse));
            Ti.API.debug("SAMLResponse hidden field: " + _self._getSAMLResponse(_loginCompleteResponse));
            Ti.API.debug("RelayState hidden field: " + _self._getRelayState(_loginCompleteResponse));
            _self._client.send({
                SAMLResponse: _self._getSAMLResponse(_loginCompleteResponse),
                RelayState: _self._getRelayState(_loginCompleteResponse)
            });
        }
        else {
            Ti.API.error("!_self._isLoginSuccess()");
            /*
                Apparently the login process has stalled, so we're going to
                attempt to just load the layout anyway and let the app
                figure out how to let the user know.
            */
            _self._onPortalSessionEstablished(e);
        }
    };
    
    this._onLoginError = function (e) {
        Ti.API.debug("_onLoginError() in Shibboleth2Login");
        Ti.API.debug("responseText: " + _self._client.responseText);
    };
};