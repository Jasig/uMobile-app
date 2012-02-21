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

var peopleResult = [], defaultTableData = [], directoryProxy, directoryWindowView, config, localDictionary, showUser;

exports.open = function (parameters) {
    Ti.API.debug(parameters);
    //Listen for events, mostly fired from models.DirectoryProxy
    directoryProxy = directoryProxy || require('/js/models/DirectoryProxy');
    directoryWindowView = directoryWindowView || require('/js/views/DirectoryWindowView');
    config = config || require('/js/config');
    localDictionary = localDictionary || require('/js/localization')[Ti.App.Properties.getString('locale')];
    
    Titanium.App.addEventListener(directoryProxy.events['SEARCHING'], onProxySearching);
    Titanium.App.addEventListener(directoryProxy.events['SEARCH_COMPLETE'], onProxySearchComplete);
    Titanium.App.addEventListener(directoryProxy.events['SEARCH_ERROR'], onProxySearchError);
    Titanium.App.addEventListener(directoryWindowView.events['SEARCH_CHANGE'], onDirectoryWindowSearchChange);
    Titanium.App.addEventListener(directoryWindowView.events['SEARCH_SUBMIT'], onSearchSubmit);
    
    directoryWindowView.open({
        defaultNumber: config.phoneDirectoryNumber,
        emergencyContacts: directoryProxy.retrieveEmergencyContacts()
    });
    
    //Unless a parameters object exists with an id, we're done opening the window.
    //If parameters.id exists, we will open a specific user.
    if (!parameters || !parameters.id) return;
    showUser(parameters);
    
};

exports.close = function (options) {
    Titanium.App.removeEventListener(directoryProxy.events['SEARCHING'], onProxySearching);
    Titanium.App.removeEventListener(directoryProxy.events['SEARCH_COMPLETE'], onProxySearchComplete);
    Titanium.App.removeEventListener(directoryProxy.events['SEARCH_ERROR'], onProxySearchError);
    Titanium.App.removeEventListener(directoryWindowView.events['SEARCH_CHANGE'], onDirectoryWindowSearchChange);
    Titanium.App.removeEventListener(directoryWindowView.events['SEARCH_SUBMIT'], onSearchSubmit);
    
    directoryWindowView.close();
};

exports.rotate = function (orientation) {
    // Everything rotates automatically
};

showUser = function (parameters) {
    directoryWindowView.showActivityIndicator(localDictionary.gettingContactInfo);
    var _xhr = Ti.Network.createHTTPClient({
        onload: function(e) {
            directoryWindowView.hideActivityIndicator();
            try {
                directoryWindowView.showDetail(JSON.parse(_xhr.responseText).people[0].attributes);
            }
            catch (e) {
                Ti.API.error('Could not load person in Directory.');
                directoryWindowView.alert(localDictionary.couldNotLoadUser);
            }
        },
        onerror: function (e) {
            Ti.API.error('Could not load person in Directory.');
            directoryWindowView.hideActivityIndicator();
            directoryWindowView.alert(localDictionary.couldNotLoadUser);
        }
    });
    
    _xhr.open('GET', config.DIRECTORY_SERVICE_URL + '?searchTerms[]=username&username='+ parameters.id);
    _xhr.send();
};

resetHome = function () {
    directoryProxy.clear();
    directoryWindowView.reset();
};

// Window Events
onDirectoryWindowSearchChange = function (e) {
    directoryProxy.clear();
};
onSearchSubmit = function(e) {
    directoryProxy.search(e.value);
};

//Proxy events

onProxySearching = function (e) {
    directoryWindowView.showActivityIndicator(localDictionary.searching);
};

onProxySearchComplete = function (e) {
    if (!e.error) {
        directoryWindowView.displaySearchResults(directoryProxy.retrievePeople());
    }
    else {
        directoryWindowView.alert({
            title: localDictionary.error,
            message: e.error + ' ' +e.response
        });
    }
};

onProxySearchError = function (e) {
    directoryWindowView.alert({
        title: localDictionary.errorPerformingSearch,
        message: localDictionary.noSearchResults
    });
};