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

            }
        }
        rows.close();

        rows = db.execute('SELECT value from prefs where name="password"');
        if (rows.isValidRow()) {
            (function(){
                try {
                    credentials.password = app.GibberishAES.dec(rows.fieldByName('value'), app.UPM.ENCRYPTION_KEY);
                } catch (e) { }            
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
        var credentials, url;

        // If the user has configured credentials, attempt to perform CAS 
        // authentication 
        credentials = self.getCredentials();
        if (credentials.username && credentials.password) {
            app.UPM.LOGIN_METHOD(credentials, options);
        } 

        // If no credentials are available just log into uPortal as a guest through
        // the portal login servlet
        else {
            url = app.UPM.BASE_PORTAL_URL + app.UPM.PORTAL_CONTEXT + '/Login?isNativeDevice=true';
            var authenticator = Titanium.Network.createHTTPClient();
            authenticator.onload = options.onsuccess;
            authenticator.open('GET', url);
            authenticator.send();
        }
    };
    
    self.doLocalLogin = function (credentials, options) {
        var url = app.UPM.BASE_PORTAL_URL + app.UPM.PORTAL_CONTEXT + '/Login?userName=' + credentials.username + '&password=' + credentials.password + '&isNativeDevice=true';
        client = Titanium.Network.createHTTPClient();
        client.open('GET', url, false);
        client.send();

        options.onsuccess();
    };
    
    self.doCASLogin = function (credentials, options) {
        var url, client, initialResponse, flowRegex, flowId, data, failureRegex;

        url = app.UPM.CAS_URL + '/login?service=' + Titanium.Network.encodeURIComponent(app.UPM.BASE_PORTAL_URL + app.UPM.PORTAL_CONTEXT + '/Login?isNativeDevice=true');

        // Send an initial response to the CAS login page
        client = Titanium.Network.createHTTPClient();
        client.open('GET', url, false);
        client.send();

        // Parse the returned page, looking for the Spring Webflow ID.  We'll need
        // to post this token along with our credentials.
        initialResponse = client.responseText;
        flowRegex = new RegExp(/input type="hidden" name="lt" value="([a-z0-9]*)?"/);
        flowId = flowRegex.exec(initialResponse)[1];

        // Post the user credentials and other required webflow parameters to the 
        // CAS login page.  This step should accomplish authentication and redirect
        // to the portal if the user is successfully authenticated.
        client = Titanium.Network.createHTTPClient();
        client.open('POST', url, false);
        data = { 
            username: credentials.username, 
            password: credentials.password, 
            lt: flowId, 
            _eventId: 'submit', 
            submit: 'LOGIN' 
        };
        client.send(data);

        // Examine the response to determine if authentication was successful.  If
        // we get back a CAS page, assume that the credentials were invalid.
        failureRegex = new RegExp(/body id="cas"/);
        if (failureRegex.exec(client.responseText)) {
            options.onauthfailure();
        } else {
            options.onsuccess();
        }

    };
    
    init();
    
    return self;
};