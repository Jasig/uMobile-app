var LoginProxy = function (facade) {
    var app = facade,
        self = {},
        init;
    
    init = function () {
        
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

        Ti.API.info(credentials);
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
    
    self.updateSessionTimeout = function(app) {
        app.lastUpdate = new Date();
    };

    self.ensureSession = function(app, options) {
        if (!self.isValidSession(app.lastUpdate)) {
            Ti.API.info("Invalid session");
            // re-authenticate 
            self.establishSession(options);
            // TODO: re-load portlet list and refresh portlet and directory views
        }
    };
    
    self.isValidSession = function (lastUpdate) {
        var now, lastLoginSeconds, checkSessionUrl, checkSessionClient, checkSessionResponse;

        if (lastUpdate) {
            // If the last portal request was more recent than the session timeout,
            // assume the session is still valid.  This strategy will fail in the 
            // case of a portal server restart.
            now = new Date();
            lastLoginSeconds = (now.getTime() - lastUpdate.getTime())/1000;
            if (lastLoginSeconds < app.UPM.SERVER_SESSION_TIMEOUT) {
                return true;
            }
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
    self.establishSession = function(options) {
        Ti.API.info("Establishing Session");
        var credentials, url, onAuthComplete, onAuthError, authenticator;

        onAuthError = function (e) {
            Ti.API.info("onAuthError in LoginProxy.establishSession");
            options.onauthfailure();
        };
        
        onAuthComplete = function (e) {
            Ti.API.info("onAuthComplete in LoginProxy.establishSession" + authenticator.responseText);
            options.onsuccess();
        };

        // If the user has configured credentials, attempt to perform CAS 
        // authentication 
        credentials = self.getCredentials();
        if (credentials.username && credentials.password) {
            Ti.API.info("Using standard login method with existing credentials.");
            app.UPM.LOGIN_METHOD(credentials, options);
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
    
    self.doLocalLogin = function (credentials, options) {
        Ti.API.info("LoginProxy doLocalLogin");
        var url, onLoginComplete, onLoginError;
        
        onLoginComplete = function (e) {
            options.onsuccess();
        };
        
        onLoginError = function (e) {
            options.onauthfailure();
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
    
    self.doCASLogin = function (credentials, options) {
        var url, client, initialResponse, flowRegex, flowId, data, failureRegex, onInitialResponse, onInitialError, onPostResponse, onPostError;

        onPostError = function (e) {
            options.onauthfailure();
        };
        
        onPostResponse = function (e) {
            // Examine the response to determine if authentication was successful.  If
            // we get back a CAS page, assume that the credentials were invalid.
            failureRegex = new RegExp(/body id="cas"/);
            if (failureRegex.exec(client.responseText)) {
                options.onauthfailure();
            } else {
                options.onsuccess();
            }
        };
        onInitialError = function (e) {
            options.onauthfailure();
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
    
    init();
    
    return self;
};