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
exports.events = {
    SEARCHING       : 'DirectoryProxySearching',
    SEARCH_COMPLETE : 'DirectoryProxySearchComplete',
    SEARCH_ERROR    : 'DirectoryProxySearchError'
};

var person, people = [], xhrSearchClient,
app = require('/js/Constants'),
deviceProxy = require('/js/models/DeviceProxy'),
config = require('/js/config'),
localDictionary = require('/js/localization')[Titanium.App.Properties.getString('locale')];

xhrSearchClient = Titanium.Network.createHTTPClient({
    onload: onXhrSearchLoad,
    onerror: onXhrSearchError
});

exports.search = function (query) {
    if (!deviceProxy.checkNetwork()) return;
    
    if (query === '') {
        people = [];
        Ti.App.fireEvent(exports.events['SEARCH_COMPLETE']);
    }
    else {
        doXhrSearch(query);
    }
};
exports.clear = function () {
    people = [];
    xhrSearchClient.abort();
};

exports.retrievePeople = function (index) {
    //If no index is provided, return all people. Otherwise, provide one Person.
    return !index ? people : people[index];
};

exports.retrieveEmergencyContacts = function () {
    return config.directoryEmergencyContacts || false;
};

function doXhrSearch (query) {
    var url, separator;
    url = config.DIRECTORY_SERVICE_URL;
    separator = '?';
    
    for (var i = 0; i < config.DIRECTORY_SERVICE_SEARCH_FIELDS.length; i++) {
        url += separator + 'searchTerms[]=' + config.DIRECTORY_SERVICE_SEARCH_FIELDS[i];
        separator = '&';
    }
    separator = '&'; //[Jeff Cross] Seems superfluous. Shouldn't the previous loop always loop at least once?
    for (i = 0; i < config.DIRECTORY_SERVICE_SEARCH_FIELDS.length; i++) {
        url += separator + config.DIRECTORY_SERVICE_SEARCH_FIELDS[i] + '=' + query;
        separator = '&';
    }    //Generate the HTTP request to be used each time a search is performed
    
    xhrSearchClient = Titanium.Network.createHTTPClient({
        onload: onXhrSearchLoad,
        onerror: onXhrSearchError
    });
    
    xhrSearchClient.open('GET', url);
    xhrSearchClient.send();
    
    Ti.App.fireEvent(exports.events['SEARCHING']);
};

function onXhrSearchLoad (e) {
    //When the search is complete, reset the main people array
    Ti.App.fireEvent(app.events['SESSION_ACTIVITY']);
    var _eventObject = {};
    people = [];
    
    try {
        var _people = JSON.parse(xhrSearchClient.responseText).people;
        for (var i=0, iLength=_people.length; i<iLength; i++) {
            people.push(_people[i].attributes);
        }
    }
    catch (err) {
        _eventObject = {error: localDictionary.directoryErrorFetching, response: xhrSearchClient.responseText};
    }
    
    Ti.App.fireEvent(exports.events['SEARCH_COMPLETE'], _eventObject);
};

function onXhrSearchError (e) {
    Ti.App.fireEvent(exports.events['SEARCH_ERROR']);
};