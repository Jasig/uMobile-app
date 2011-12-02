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

var peopleResult = [], defaultTableData = [], directoryProxy, directoryWindowView;

exports.open = function () {
    //Listen for events, mostly fired from models.DirectoryProxy
    directoryProxy = require('/js/models/DirectoryProxy');
    directoryWindowView = require('/js/views/DirectoryWindowView');
    
    Titanium.App.addEventListener(directoryProxy.events['SEARCHING'], onProxySearching);
    Titanium.App.addEventListener(directoryProxy.events['SEARCH_COMPLETE'], onProxySearchComplete);
    Titanium.App.addEventListener(directoryProxy.events['SEARCH_ERROR'], onProxySearchError);
    Titanium.App.addEventListener(directoryWindowView.events['SEARCH_CHANGE'], onDirectoryWindowSearchChange);
    Titanium.App.addEventListener(directoryWindowView.events['SEARCH_SUBMIT'], onSearchSubmit);
    
    directoryWindowView.open({
        defaultNumber: app.config.phoneDirectoryNumber,
        emergencyContacts: directoryProxy.retrieveEmergencyContacts()
    });
};

exports.close = function (options) {
    Titanium.App.removeEventListener(directoryProxy.events['SEARCHING'], onProxySearching);
    Titanium.App.removeEventListener(directoryProxy.events['SEARCH_COMPLETE'], onProxySearchComplete);
    Titanium.App.removeEventListener(directoryProxy.events['SEARCH_ERROR'], onProxySearchError);
    Titanium.App.removeEventListener(directoryWindowView.events['SEARCH_CHANGE'], onDirectoryWindowSearchChange);
    Titanium.App.removeEventListener(directoryWindowView.events['SEARCH_SUBMIT'], onSearchSubmit);
    
    directoryProxy = null;
    directoryWindowView.close();
    directoryWindowView = null;
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
    directoryWindowView.showActivityIndicator(app.localDictionary.searching);
};

onProxySearchComplete = function (e) {
    if (!e.error) {
        directoryWindowView.displaySearchResults(directoryProxy.retrievePeople());
    }
    else {
        directoryWindowView.alert({
            title: app.localDictionary.error,
            message: e.error
        });
    }
};

onProxySearchError = function (e) {
    directoryWindowView.alert({
        title: app.localDictionary.errorPerformingSearch,
        message: app.localDictionary.noSearchResults
    });
};