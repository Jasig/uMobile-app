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
Titanium.include('/js/gibberishAES.js');
var config = require('/js/config');

exports.saveCredentials = function (credentials) {
    var username, password;
    
    username = GibberishAES.enc(credentials.username, config.ENCRYPTION_KEY);
    password = GibberishAES.enc(credentials.password, config.ENCRYPTION_KEY);
    
    Ti.App.Properties.setString('username', username);
    Ti.App.Properties.setString('password', password);
};

/**
 * Return the currently persisted credentials as a simple dictionary object.
 * If no credentials have yet been created, the username and password values
 * will each be null;
 */
exports.retrieveCredentials = function () {
    var db, rows, credentials,
    encUsername = Ti.App.Properties.getString('username'),
    encPassword = Ti.App.Properties.getString('password');
    
    credentials = {
        username: '',
        password: ''
    };
    
    if (encUsername) credentials.username = GibberishAES.dec(encUsername, config.ENCRYPTION_KEY);
    if (encPassword) credentials.password = GibberishAES.dec(encPassword, config.ENCRYPTION_KEY);
    
    Ti.API.debug('retrieving credentials: '+JSON.stringify(credentials));
    
    return credentials;
};

exports.saveLayoutUserName = function (name) {
    Ti.App.Properties.setString('layoutUserName', name);
};

exports.retrieveLayoutUserName = function () {
    return Ti.App.Properties.getString('layoutUserName');
};

exports.isGuestUser = function () {
    var _layoutUserName = Ti.App.Properties.getString('layoutUserName');
    return _layoutUserName === '' || _layoutUserName === 'guest' ? true : false;
};