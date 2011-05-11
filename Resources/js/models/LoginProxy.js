var LoginProxy = function (facade) {
    var app = facade,
        self = {}, sessionProxy,
        init, updateSessionTimeout, establishSilentNetworkSession, loginMethod, getLayoutUser,
        networkSessionTimer, webViewSessionTimer, onSessionExpire, onNetworkError;

    
    init = function () {
        // Create an instance of the static loginMethods variable, so other actors
        // can get the methods via the LoginProxy instance on the facade.
        self.loginMethods = LoginProxy.loginMethods;
        
        //Implement constants for what contexts are available for session timeouts.
        self.sessionTimeContexts = LoginProxy.sessionTimeContexts;
        Ti.API.debug("Session Time contexts are: " + JSON.stringify(LoginProxy.sessionTimeContexts));
        
        sessionProxy = app.models.sessionProxy;
        
        Ti.API.info("Setting login method: " + app.UPM.LOGIN_METHOD);
        switch (app.UPM.LOGIN_METHOD) {
            case LoginProxy.loginMethods.CAS:
                loginMethod = self.doCASLogin;
                break;
            case LoginProxy.loginMethods.LOCAL_LOGIN:
                loginMethod = self.doLocalLogin;
                break;
            default:
                Ti.API.info("Login method not recognized in LoginProxy.init()");
        }
        
        sessionProxy.createSessionTimer(self.sessionTimeContexts.NETWORK);
        sessionProxy.createSessionTimer(self.sessionTimeContexts.WEBVIEW);
        
        Ti.App.addEventListener('SessionTimerExpired', onSessionExpire);
    };
    
    self.updateSessionTimeout = function(context) {
        /* If Android, this method will reset the timer for either the network session or 
        portlet session so we can be sure to log the user back in if necessary.
        It's a public method so that other controllers can call it each time an
        activity occurs that will extend a session. 
        
        In iPhone, we share one session between network requests and webviews, so we'll reset both timers.
        */
        switch (context) {
            case self.sessionTimeContexts.NETWORK:
                sessionProxy.resetTimer(LoginProxy.sessionTimeContexts.NETWORK);
                break;
            case self.sessionTimeContexts.WEBVIEW:
                sessionProxy.resetTimer(LoginProxy.sessionTimeContexts.WEBVIEW);
                break;
            default:
                Ti.API.debug("Context for sessionTimeout didn't match");
        }
    };
    
    /**
     * Return the currently persisted credentials as a simple dictionary object.
     * If no credentials have yet been created, the username and password values
     * will each be null;
     */
    self.getCredentials = function () {
        var db, rows, credentials;

        // make sure the database has been initialized
        db = Ti.Database.install('umobile.sqlite','umobile');

        credentials = {};

        rows = db.execute('SELECT value from prefs where name="username"');
        if (rows.isValidRow()) {
            try { 
                credentials.username = app.GibberishAES.dec(rows.fieldByName('value'), app.UPM.ENCRYPTION_KEY);
            } catch (e) {
                Ti.API.debug("Couldn't decrypt username");
            }
        }
        rows.close();

        rows = db.execute('SELECT value from prefs where name="password"');
        if (rows.isValidRow()) {
            (function(){
                try {
                    credentials.password = app.GibberishAES.dec(rows.fieldByName('value'), app.UPM.ENCRYPTION_KEY);
                } catch (e) {
                    Ti.API.debug("Couldn't decrypt password");
                }            
            })();
        }
        rows.close();
        db.close();

        return credentials;
    };
    
    /**
     * Persist portal credentials in the local preferences database.
     */
    self.saveCredentials = function (credentials) {
        var db, username, password;

        username = app.GibberishAES.enc(credentials.username, app.UPM.ENCRYPTION_KEY);
        password = app.GibberishAES.enc(credentials.password, app.UPM.ENCRYPTION_KEY);

        // open the database
        db = Ti.Database.open('umobile');

        // clear out any existing credentials to prevent the accumulation of duplicate rows
        db.execute('DELETE FROM prefs WHERE name="username" OR name="password"');

        // persist the new credentials
        db.execute(
            'INSERT INTO prefs (name, value) values ("username", ?)',
            username
        );
        db.execute(
            'INSERT INTO prefs (name, value) values ("password", ?)',
            password
        );

        // close the database
        db.close();
    };
    self.isValidWebViewSession = function () {
        // if(!networkSessionTimer.isActive && Ti.Platform.osname === 'android') {
        return sessionProxy.isActive(LoginProxy.sessionTimeContexts.WEBVIEW);
    };
    
    self.isValidNetworkSession = function () {
        var checkSessionUrl, checkSessionClient, checkSessionResponse;
        //Checks to see if the networkSessionTimer says it's active, and also checks that the API indicates a valid session.
        if(sessionProxy.isActive(LoginProxy.sessionTimeContexts.NETWORK)) {
            Ti.API.info('self.isValidNetworkSession() in LoginProxy.' + sessionProxy.isActive(LoginProxy.sessionTimeContexts.NETWORK));
            return true;
        }
        else {
            Ti.API.info("No session timer created yet, will check session by other means.");
        }

        Ti.API.info('Detected potential session timeout');

        try {
            // Contact the portal's session REST service to determine if the user has 
            // a current session.  We expect this page to return JSON, but it's possible
            // that some SSO system may cause the service to return a login page instead. 
            checkSessionUrl = app.UPM.BASE_PORTAL_URL + app.UPM.PORTAL_CONTEXT + '/api/session.json';
            checkSessionClient = Titanium.Network.createHTTPClient();
            checkSessionClient.open('GET', checkSessionUrl, false);
            /*
                TODO Remove this line when the guest session is returned properly (temporary hack)
            */
            checkSessionClient.setRequestHeader('User-Agent','Mozilla/5.0 (Linux; U; Android 2.1; en-us; Nexus One Build/ERD62) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17 –Nexus');
            
            checkSessionClient.send();

            Ti.API.info(checkSessionClient.responseText);
            checkSessionResponse = JSON.parse(checkSessionClient.responseText);
            if (checkSessionResponse.person) {
                Ti.API.info("There was a person in the session response: " + checkSessionResponse.person);
                // The session service responded with valid JSON containing an object
                // representing the current user (either an authenticated or guest user)
                return true;
            }
        } catch (error) {
            Ti.API.debug("Error encountered while checking session validity " + error.message);
        }

        // Either the session service responded with invalid JSON or indicated
        // no session present on the server
        return false;
    };
    
    /**
     * Establish a session on the uPortal server.
     */
    self.establishNetworkSession = function(options) {
        var credentials, url, onAuthComplete, onAuthError, authenticator;
        /* 
        Possible options: 
            isUnobtrusive (Bool), tells it not to reload anything, just establish-the session again behind the scenes
        */
        Ti.API.info("Establishing Network Session");
        onAuthError = function (e) {
            var _user = getLayoutUser(authenticator);
            Ti.API.info("onAuthError in LoginProxy.establishNetworkSession");
            sessionProxy.stopTimer(LoginProxy.sessionTimeContexts.NETWORK);
            Ti.App.fireEvent("EstablishNetworkSessionFailure", {user: _user});
        };
        
        onAuthComplete = function (e) {
            var _user = getLayoutUser(authenticator);
            Ti.API.info("onAuthComplete in LoginProxy.establishNetworkSession" + authenticator.responseText);
            sessionProxy.resetTimer(LoginProxy.sessionTimeContexts.NETWORK);
            
            if (!options || !options.isUnobtrusive) {
                Ti.App.fireEvent("EstablishNetworkSessionSuccess", {user: _user});
            }
        };

        // If the user has configured credentials, attempt to perform CAS 
        // authentication 
        credentials = self.getCredentials();
        if (credentials.username && credentials.password) {
            Ti.API.info("Using standard login method with existing credentials.");
            loginMethod(credentials, options);
        }

        // If no credentials are available just log into uPortal as a guest through
        // the portal login servlet
        else {
            url = app.UPM.BASE_PORTAL_URL + app.UPM.PORTAL_CONTEXT + '/Login?isNativeDevice=true';
            Ti.API.info("No credentials available, opening login url: " + url);
            
            authenticator = Titanium.Network.createHTTPClient({
                onload: onAuthComplete,
                onerror: onAuthError
            });
            authenticator.open('GET', url, true);
            /*
                TODO Remove this line when the guest session is returned properly (temporary hack)
            */
            authenticator.setRequestHeader('User-Agent','Mozilla/5.0 (Linux; U; Android 2.1; en-us; Nexus One Build/ERD62) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17 –Nexus');
            authenticator.send();
        }
    };
    self.getLocalLoginURL = function (url) {
        /* 
        This method returns a URL suitable to automatically log
        in a user in a webview.
        Expects a fully qualified URL to be passed in
        */
        credentials = self.getCredentials();
        return app.UPM.BASE_PORTAL_URL + app.UPM.PORTAL_CONTEXT + '/Login?userName=' + credentials.username + '&password=' + credentials.password + '&isNativeDevice=true&refUrl=' + url;
        
    };
    self.doLocalLogin = function (credentials, options) {
        Ti.API.info("LoginProxy doLocalLogin");
        var client, url, onLoginComplete, onLoginError;
        
        onLoginComplete = function (e) {
            var _responseXML, _layout, _layoutUser;
            Ti.API.info("doLocalLogin() -> onLoginComplete() in LoginProxy");
            _layoutUser = getLayoutUser(client);
            Ti.API.info("_layoutUser is: " + _layoutUser);
            
            if (_layoutUser === credentials.username) {
                sessionProxy.resetTimer(LoginProxy.sessionTimeContexts.NETWORK);
                if (!options || !options.isUnobtrusive) {
                    Ti.App.fireEvent('EstablishNetworkSessionSuccess', {user: _layoutUser});
                }                
            }
            else {
                Ti.App.fireEvent('EstablishNetworkSessionFailure', {user: _layoutUser});
            }
            
        };
        
        onLoginError = function (e) {
            sessionProxy.stopTimer(LoginProxy.sessionTimeContexts.NETWORK);
            Ti.App.fireEvent('EstablishNetworkSessionFailure');
        };
        
        url = app.UPM.BASE_PORTAL_URL + app.UPM.PORTAL_CONTEXT + '/Login?userName=' + credentials.username + '&password=' + credentials.password + '&isNativeDevice=true';
        
        client = Titanium.Network.createHTTPClient({
            onload: onLoginComplete,
            onerror: onLoginError
        });
        client.open('GET', url, true);
        /*
            TODO Remove this line when the guest session is returned properly (temporary hack)
        */
        client.setRequestHeader('User-Agent','Mozilla/5.0 (Linux; U; Android 2.1; en-us; Nexus One Build/ERD62) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17 –Nexus');
        
        client.send();
        
    };
    
    self.getCASLoginURL = function (url) {
        var separator = url.indexOf('?') >= 0 ? '&' : '?';
        return app.UPM.CAS_URL + '/login?service=' + Titanium.Network.encodeURIComponent(url + separator + 'isNativeDevice=true');
    };
    
    self.doCASLogin = function (credentials, options) {
        var url, client, initialResponse, flowRegex, flowId, data, failureRegex, onInitialResponse, onInitialError, onPostResponse, onPostError;

        onPostError = function (e) {
            sessionProxy.stopTimer(LoginProxy.sessionTimeContexts.NETWORK);
            Ti.App.fireEvent('EstablishNetworkSessionFailure');
        };
        
        onPostResponse = function (e) {
            // Examine the response to determine if authentication was successful.  If
            // we get back a CAS page, assume that the credentials were invalid.
            failureRegex = new RegExp(/body id="cas"/);
            if (failureRegex.exec(client.responseText)) {
                sessionProxy.stopTimer(LoginProxy.sessionTimeContexts.NETWORK);
                Ti.App.fireEvent('EstablishNetworkSessionFailure');
            } else {
                sessionProxy.resetTimer(LoginProxy.sessionTimeContexts.NETWORK);
                if (!options || !options.isUnobtrusive) {
                    Ti.App.fireEvent('EstablishNetworkSessionSuccess');
                }
            }
        };
        onInitialError = function (e) {
            sessionProxy.stopTimer(LoginProxy.sessionTimeContexts.NETWORK);
            Ti.App.fireEvent('EstablishNetworkSessionFailure');
        };
        
        onInitialResponse = function (e) {
            // Parse the returned page, looking for the Spring Webflow ID.  We'll need
            // to post this token along with our credentials.
            initialResponse = client.responseText;
            flowRegex = new RegExp(/input type="hidden" name="lt" value="([a-z0-9]*)?"/);
            flowId = flowRegex.exec(initialResponse)[1];

            // Post the user credentials and other required webflow parameters to the 
            // CAS login page.  This step should accomplish authentication and redirect
            // to the portal if the user is successfully authenticated.
            client = Titanium.Network.createHTTPClient({
                onload: onPostResponse,
                onerror: onPostError
            });
            client.open('POST', url, true);
            /*
                TODO Remove this line when the guest session is returned properly (temporary hack)
            */
            client.setRequestHeader('User-Agent','Mozilla/5.0 (Linux; U; Android 2.1; en-us; Nexus One Build/ERD62) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17 –Nexus');
            
            data = { 
                username: credentials.username, 
                password: credentials.password, 
                lt: flowId, 
                _eventId: 'submit', 
                submit: 'LOGIN' 
            };
            client.send(data);
        };


        url = app.UPM.CAS_URL + '/login?service=' + Titanium.Network.encodeURIComponent(app.UPM.BASE_PORTAL_URL + app.UPM.PORTAL_CONTEXT + '/Login?isNativeDevice=true');

        // Send an initial response to the CAS login page
        client = Titanium.Network.createHTTPClient({
            onload: onInitialResponse,
            onerror: onInitialError
        });
        client.open('GET', url, false);
        /*
            TODO Remove this line when the guest session is returned properly (temporary hack)
        */
        client.setRequestHeader('User-Agent','Mozilla/5.0 (Linux; U; Android 2.1; en-us; Nexus One Build/ERD62) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17 –Nexus');
        
        client.send();
    };
    
    getLayoutUser = function (client) {
        var _layout, _username;
        if (!client.responseXML) {
            Ti.API.info("No responseXML");
            if (typeof DOMParser != "undefined") {
                Ti.API.info("No DOMParser");
                // Titanium Desktop 1.0 doesn't fill out responseXML.
                // We'll use WebKit's XML parser...
                _responseXML = (new DOMParser()).parseFromString(client.responseText, "text/xml");
            } 
            else {
                Ti.API.info("There is a DOMParser");
                // Titanium Mobile 1.3 doesn't fill out responseXML on Android.
                // We'll use Titanium's XML parser...
                _responseXML = Titanium.XML.parseString(client.responseText);
            }
        } 
        else {
            Ti.API.info("There IS responseXML");
            _responseXML = client.responseXML;
        }
        
        _layout = _responseXML.getElementsByTagName('json-layout').item(0).text;

        _username = JSON.parse(_layout).user;
        
        return _username;
    };
    
    onNetworkError = function (e) {
        Ti.App.fireEvent("LoginProxyError");
    };
    
    onSessionExpire = function (e) {
        // If it's not Android, we can just re-establish a session for 
        // webviews and network requests behind the scenes.
        // Otherwise, we can re-establish network session behind the scenes,
        // but would need to set a flag for re-auth in the webview.
        Ti.API.debug("onSessionExpire() in LoginProxy");
        switch (e.context) {
            case self.sessionTimeContexts.NETWORK:
                self.establishNetworkSession({isUnobtrusive: true});
                break;
            case self.sessionTimeContexts.WEBVIEW:  
                Ti.API.info("Stopping webViewSessionTimer");
                sessionProxy.stopTimer(LoginProxy.sessionTimeContexts.WEBVIEW);
                break;
            default:
                Ti.API.info("Didn't recognize the context");
        }
    };
    
    init();
    
    return self;
};
LoginProxy.sessionTimeContexts = {
    NETWORK: "Network",
    WEBVIEW: "Webview"
};

LoginProxy.loginMethods = {
    CAS: "Cas",
    LOCAL_LOGIN: "LocalLogin"
};