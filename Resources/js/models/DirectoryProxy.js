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
var DirectoryProxy = function (facade,opts) {
    var app=facade, init, _self = this, Config, Login, Device, LocalDictionary,
        getQualifiedURL, xhrSearchClient, doXhrSearch,
        xhrSearchOnLoad, xhrSearchOnError,
        person, people = [];

    init = function () {
        Config = app.config;
        Login = app.models.loginProxy;
        Device = app.models.deviceProxy;
        LocalDictionary = app.localDictionary;
        
        //Generate the HTTP request to be used each time a search is performed
        xhrSearchClient = Titanium.Network.createHTTPClient({
            onload: onXhrSearchLoad,
            onerror: onXhrSearchError
        });
    };
    
    this.search = function (query) {
        if (!Device.checkNetwork()) {
            return;
        }        
        else if (query === '') {
            people = [];
            Ti.App.fireEvent(DirectoryProxy.events['SEARCH_COMPLETE']);
        }
        else {
            doXhrSearch(query);
        }
    };
    this.clear = function () {
        people = [];
        xhrSearchClient.abort();
    };
    
    this.getPeople = function (index) {
        //If no index is provided, return all people. Otherwise, provide one Person.
        if(!index) {
            return people;
        }
        else {
            return people[index];
        }
    };
    
    this.getEmergencyContacts = function () {
        return Config.directoryEmergencyContacts || false;
    };
    
    doXhrSearch = function (query) {
        var url, separator;
     

        url = Config.DIRECTORY_SERVICE_URL;
        separator = '?';
        
        for (var i = 0; i < Config.DIRECTORY_SERVICE_SEARCH_FIELDS.length; i++) {
            url += separator + 'searchTerms[]=' + Config.DIRECTORY_SERVICE_SEARCH_FIELDS[i];
            separator = '&';
        }
        separator = '&';
        for (i = 0; i < Config.DIRECTORY_SERVICE_SEARCH_FIELDS.length; i++) {
            url += separator + Config.DIRECTORY_SERVICE_SEARCH_FIELDS[i] + '=' + query;
            separator = '&';
        }

        xhrSearchClient.open('GET', url);
        if (app.models.deviceProxy.isAndroid()) xhrSearchClient.setRequestHeader('Cookie', Ti.App.Properties.getString("androidCookie"));
        xhrSearchClient.send();
        
        Ti.App.fireEvent(DirectoryProxy.events['SEARCHING']);
    };
    
    onXhrSearchLoad = function (e) {
        //When the search is complete, reset the main people array
        Ti.App.fireEvent(ApplicationFacade.events['SESSION_ACTIVITY'], {context: Login.sessionTimeContexts.NETWORK});

        people = [];
        (function() {
            try {
                var _people = JSON.parse(xhrSearchClient.responseText).people;
                for (var i=0, iLength=_people.length; i<iLength; i++) {
                    Ti.API.info('calling method');
                    people.push(_people[i].attributes);
                }
                Ti.App.fireEvent(DirectoryProxy.events['SEARCH_COMPLETE']);
            }
            catch (err) {
                Ti.App.fireEvent(DirectoryProxy.events['SEARCH_COMPLETE'], {error: LocalDictionary.directoryErrorFetching});
            }            
        })();
    };
    
    onXhrSearchError = function (e) {
        Ti.App.fireEvent(DirectoryProxy.events['SEARCH_ERROR']);
    };
    
    init();
};
DirectoryProxy.events = {
    SEARCHING       : 'DirectoryProxySearching',
    SEARCH_COMPLETE : 'DirectoryProxySearchComplete',
    SEARCH_ERROR    : 'DirectoryProxySearchError'
    
};