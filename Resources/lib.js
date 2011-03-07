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
    credentials.username = rows.isValidRow() ? rows.fieldByName('value') : null;
    rows.close();

    rows = db.execute('SELECT value from prefs where name="password"');
    credentials.password = rows.isValidRow() ? rows.fieldByName('value') : null;
    rows.close();
    
    return credentials;
};

UPM.isUserLoggedIn = function () {
	//This method should indicate whether a user is truly a valid user.
	return true;
};

/**
 * Persist portal credentials in the local preferences database.
 */
UPM.saveCredentials = function (credentials) {
    var db;

    // open the database
    db = Ti.Database.open('umobile');
    
    // clear out any existing credentials to prevent the accumulation of duplicate rows
    db.execute('DELETE FROM prefs WHERE name="username" OR name="password"');
    
    // persist the new credentials
    db.execute(
        'INSERT INTO prefs (name, value) values ("username", ?)',
        credentials.username
    );
    db.execute(
        'INSERT INTO prefs (name, value) values ("password", ?)',
        credentials.password
    );
    
    // close the database
    db.close();
};

/**
 * Get the main portal URL with appropriate authentication parameters.
 */
UPM.getMainPortalUrl = function () {
    var credentials, url;

    // construct the base portal login URL
    url = UPM.BASE_PORTAL_URL + UPM.PORTAL_CONTEXT + '/Login';
    
    // get the currently-persisted credentials.  if they are non-null,
    // add the login information to the URL string
    credentials = UPM.getCredentials();
    if (credentials.username && credentials.password) {
        url += '?userName=' + credentials.username;
        url += '&password=' + credentials.password;
    }
    
    return url;
};

/**
 * Get the search portlet URL with appropriate authentication parameters.
 */
UPM.getSearchPortletUrl = function () {
    var credentials, url;

    // construct the base portal login URL
    url = UPM.BASE_PORTAL_URL + UPM.PORTAL_CONTEXT + '/Login?uP_fname=search';
    
    // get the currently-persisted credentials.  if they are non-null,
    // add the login information to the URL string
    credentials = UPM.getCredentials();
    if (credentials.username && credentials.password) {
        url += '&userName=' + credentials.username;
        url += '&password=' + credentials.password;
    }
    
    return url;
};

/**
 * Establish a session on the uPortal server.
 */
UPM.establishSession = function(onload) {
    
    var authenticator = Titanium.Network.createHTTPClient();
    authenticator.open("GET", UPM.getMainPortalUrl());
    authenticator.onload = onload;
    authenticator.send();

};
