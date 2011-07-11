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

/**
 * settings_window.js contains setup information for the
 * user settings tab.
 */

 /**
  * @constructor
  */
var DirectoryWindowController = function (facade) {
    var app = facade, _self = this, Directory, LocalDictionary, Config, init, DirectoryWindow,
        // Data and variables
        initialized, peopleResult = [], defaultTableData = [], 
        //Methods
        resetHome, searchSubmit,
        //Event Handlers
        onNewWindowOpened, onProxySearching, onProxySearchComplete, onProxySearchError, onDirectoryWindowSearchChange, onSearchSubmit;
    
    init = function () {
        Ti.API.debug("init() in DirectoryWindowController");
        _self.key = 'directory';        
    };
    
    this.open = function () {
        Ti.API.debug("open() in DirectoryWindowController");
        if (!initialized) {
            Titanium.include('js/models/DirectoryProxy.js');
            Titanium.include('js/views/DirectoryWindowView.js');
            
            app.registerView('directoryWindowView', new DirectoryWindowView(app));
            app.registerModel('directoryProxy', new DirectoryProxy(app)); //Manages real-time searching the uPortal service for directory entries, used primarily by DirectoryWindowController.
            
            //Listen for events, mostly fired from models.DirectoryProxy
            Titanium.App.addEventListener('DirectoryProxySearching', onProxySearching);
            Titanium.App.addEventListener('DirectoryProxySearchComplete', onProxySearchComplete);
            Titanium.App.addEventListener('DirectoryProxySearchError', onProxySearchError);
            Titanium.App.addEventListener('DirectoryWindowSearchChange', onDirectoryWindowSearchChange);
            Titanium.App.addEventListener('DirectoryWindowSearchSubmit', onSearchSubmit);

            //Set pointers to necessary members of facade
            Directory = app.models.directoryProxy;
            DirectoryWindow = app.views.directoryWindowView;
            LocalDictionary = app.localDictionary;
            Config = app.config;
            
            initialized = true;
        }
        
        DirectoryWindow.open({
            defaultNumber: Config.phoneDirectoryNumber,
            emergencyContacts: Directory.getEmergencyContacts()
        });
    };
    
    this.close = function (options) {
        DirectoryWindow.close();
    };
    
    resetHome = function () {
        Ti.API.debug("resetHome() in DirectoryWindowController");
        Directory.clear();
        DirectoryWindow.reset();
    };
    
    // Window Events
    onDirectoryWindowSearchChange = function (e) {
        Directory.clear();
    };
    onSearchSubmit = function(e) {
        Ti.API.debug('onSearchSubmit() in DirectoryWindowController');
        Directory.search(e.value);
    };
    
    //Proxy events

    onProxySearching = function (e) {
        Ti.API.info("Searching...");
        DirectoryWindow.showActivityIndicator(LocalDictionary.searching);
    };
    
    onProxySearchComplete = function (e) {
        Ti.API.info("Directory Search Complete");
        if (!e.error) {
            DirectoryWindow.displaySearchResults(Directory.getPeople());
        }
        else {
            DirectoryWindow.alert({
                title: LocalDictionary.error,
                message: e.error
            });
        }
    };
    
    onProxySearchError = function (e) {
        Ti.API.error("Directory Proxy Search Error");
        DirectoryWindow.alert({
            title: LocalDictionary.errorPerformingSearch,
            message: LocalDictionary.noSearchResults
        });
    };
    
    if(!initialized) {
        init();
    }
};