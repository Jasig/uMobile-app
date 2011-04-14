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

Titanium.include('config.js');
Titanium.include('gibberish-aes.js');

/**
 * Return the currently persisted credentials as a simple dictionary object.
 * If no credentials have yet been created, the username and password values
 * will each be null;
 */
UPM.getCredentials = function () {
    var db, rows, credentials;

    // make sure the database has been initialized
    db = Ti.Database.install('umobile.sqlite','umobile');
    
    credentials = {};

    rows = db.execute('SELECT value from prefs where name="username"');
    if (rows.isValidRow()) {
        try { 
            credentials.username = GibberishAES.dec(rows.fieldByName('value'), UPM.ENCRYPTION_KEY);
        } catch (e) {
            
        }
    }
    rows.close();

    rows = db.execute('SELECT value from prefs where name="password"');
    if (rows.isValidRow()) {
        (function(){
            try {
                credentials.password = GibberishAES.dec(rows.fieldByName('value'), UPM.ENCRYPTION_KEY);
            } catch (e) { }            
        })();
    }
    rows.close();
    
    Ti.API.info(credentials);
    return credentials;
};

/**
 * Persist portal credentials in the local preferences database.
 */
UPM.saveCredentials = function (credentials) {
    var db, username, password;

    username = GibberishAES.enc(credentials.username, UPM.ENCRYPTION_KEY);
    password = GibberishAES.enc(credentials.password, UPM.ENCRYPTION_KEY);

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

UPM.isValidSession = function (lastUpdate) {
    var now, lastLoginSeconds, checkSessionUrl, checkSessionClient, checkSessionResponse;
    
    if (lastUpdate) {
        // If the last portal request was more recent than the session timeout,
        // assume the session is still valid.  This strategy will fail in the 
        // case of a portal server restart.
        now = new Date();
        lastLoginSeconds = (now.getTime() - lastUpdate.getTime())/1000;
        if (lastLoginSeconds < UPM.SERVER_SESSION_TIMEOUT) {
            return true;
        }
    }

    Ti.API.info('Detected potential session timeout');
    
    try {
        // Contact the portal's session REST service to determine if the user has 
        // a current session.  We expect this page to return JSON, but it's possible
        // that some SSO system may cause the service to return a login page instead. 
        checkSessionUrl = UPM.BASE_PORTAL_URL + UPM.PORTAL_CONTEXT + '/api/session.json';
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
 * This method is currently blocking.
 */
UPM.getPortletList = function() {
    var layoutUrl, layoutClient, layoutText, portlets;
    
    // Send a request to uPortal's main URL to get a JSON representation of the
    // user layout
    layoutUrl = UPM.BASE_PORTAL_URL + UPM.PORTAL_CONTEXT;
    layoutClient = Titanium.Network.createHTTPClient();
    layoutClient.open('GET', layoutUrl, false);
    layoutClient.send();

    // uPortal 3.2 isn't capable of sending the layout as JSON, so the response
    // will be an XML document with the appropriate JSON contained in a 
    // "json-layout" element.  Parse this element as JSON and use the data 
    // array as the initial module list.
    if(layoutClient.responseXML.getElementsByTagName('json-layout')) {
        layoutText = layoutClient.responseXML.getElementsByTagName('json-layout').item(0).text;
    }
    else {
        Ti.API.warn("Using hard-coded layout! XML wasn't valid");
        layoutText = '{ "layout": [ { "title": "Welcome", "url": "/uPortal/f/u24l1s5/p/snappy.u24l1n7/max/render.uP", "description": "Mockup image rotator thingy.", "newItemCount": "0", "iconUrl": "/ResourceServingWebapp/rs/tango/0.8.90/32x32/mimetypes/text-html.png" }, { "title": "Google Search", "url": "/uPortal/f/u24l1s5/p/google-portlet.u24l1n8/max/render.uP", "description": "Google Portlet from http://code.google.com/p/googleportlet/", "newItemCount": "0", "iconUrl": "${request.contextPath}/media/skins/icons/google.png" }, { "title": "", "url": "", "description": "The Weather Module allows you to access the latest weather conditions and 5-day forecasts for the cities you select.", "newItemCount": "0", "iconUrl": "/ResourceServingWebapp/rs/tango/0.8.90/32x32/status/weather-few-clouds.png" }, { "title": "Most Popular Apps", "url": "/uPortal/f/u24l1s12/p/popular-portlets.u24l1n14/max/render.uP", "description": "Shows which apps (portlets) have been added by users and how often", "newItemCount": "0", "iconUrl": "/ResourceServingWebapp/rs/tango/0.8.90/32x32/categories/preferences-system.png" }, { "title": "Calendar", "url": "/uPortal/f/u24l1s12/p/calendar.u24l1n16/max/render.uP", "description": "Small monthly calendar.", "newItemCount": "0", "iconUrl": "/ResourceServingWebapp/rs/tango/0.8.90/32x32/mimetypes/x-office-calendar.png" }, { "title": "Bookmarks", "url": "/uPortal/f/u24l1s12/p/pbookmarks.u24l1n17/max/render.uP", "description": "Bookmarks portlet", "newItemCount": "0", "iconUrl": "/ResourceServingWebapp/rs/tango/0.8.90/32x32/mimetypes/x-office-address-book.png" }, { "title": "Student Welcome", "url": "/uPortal/f/u22l1s5/p/student-feature.u22l1n7/max/render.uP", "description": "Student-targeted welcome screen", "newItemCount": "0", "iconUrl": "/ResourceServingWebapp/rs/tango/0.8.90/32x32/mimetypes/image-x-generic.png" }, { "title": "My Notifications", "url": "/uPortal/f/u22l1s5/p/notifications.u22l1n8/max/render.uP", "description": "Mockup notifications portlet.", "newItemCount": "0", "iconUrl": "/ResourceServingWebapp/rs/tango/0.8.90/32x32/apps/preferences-desktop-multimedia.png" }, { "title": "Who\'s Online", "url": "/uPortal/f/u22l1s5/p/whos-online.u22l1n10/max/render.uP", "description": "Mockup of a Who\'s Online portlet.", "newItemCount": "0", "iconUrl": "/ResourceServingWebapp/rs/tango/0.8.90/32x32/mimetypes/text-html.png" }, { "title": "", "url": "", "description": "Course links and announcements", "newItemCount": "0", "iconUrl": "/CoursesPortlet/notepad.png" } ] }';
    }    

    portlets = JSON.parse(layoutText).layout;

    // Add locally-configured modules to the module list.
    for (var i = 0; i < UPM.LOCAL_MODULES.length; i++) {
        portlets.push(UPM.LOCAL_MODULES[i]);
    }
    return portlets;

};


/**
 * Establish a session on the uPortal server.
 */
UPM.establishSession = function(onsuccess, onauthfailure, onnetworkfailure) {
    var credentials, url;

    // If the user has configured credentials, attempt to perform CAS 
    // authentication 
    credentials = UPM.getCredentials();
    if (credentials.username && credentials.password) {
        UPM.LOGIN_METHOD(credentials, onsuccess, onauthfailure, onnetworkfailure);        
    } 
    
    // If no credentials are available just log into uPortal as a guest through
    // the portal login servlet
    else {
        url = UPM.BASE_PORTAL_URL + UPM.PORTAL_CONTEXT + '/Login?isNativeDevice=true';
        var authenticator = Titanium.Network.createHTTPClient();
        authenticator.onload = onsuccess;
        authenticator.open('GET', url);
        authenticator.send();
    }

};

UPM.doLocalLogin = function (credentials, onsuccess, onauthfailure, onnetworkfailure) {
    // TODO
};

UPM.doCASLogin = function (credentials, onsuccess, onauthfailure, onnetworkfailure) {
    var url, client, initialResponse, flowRegex, flowId, data, failureRegex;
    
    url = UPM.CAS_URL + '/login?service=' + Titanium.Network.encodeURIComponent(UPM.BASE_PORTAL_URL + UPM.PORTAL_CONTEXT + '/Login?isNativeDevice=true');
    
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
        onauthfailure();
    } else {
        onsuccess();
    }
    
};

UPM.getResourcePath = function (file) {
    //File path should be passed in as a relative path loaded from the root of the Resources directory. 
    //Should not contain a forward slash at beginning of path.
    if(Titanium.Platform.osname === ('iphone' || 'ipad')) {
        Ti.API.info("getResourcePath is iOS");
        return file;
    } 
    else if (Titanium.Platform.osname === 'android') {
        Ti.API.info("getResourcePath is Android");
        return Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory + "/" + file);
    }
    else {
        return file;
    }
};