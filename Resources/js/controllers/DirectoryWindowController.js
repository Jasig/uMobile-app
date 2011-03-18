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

// library includes
/*Titanium.include('lib.js');
Titanium.include('skin.js');*/
Ti.API.info("Directory Window Opened");
var DirectoryWindowController = function () {
    var win = Titanium.UI.currentWindow,
        app = win.app,
        self = {},
        directoryProxy = app.models.directoryProxy,
        titleBar,
        searchBar,
        contentScrollView,
        peopleListTable,
        searchSubmit,
        blurSearch,
        onProxySearching,
        onProxySearchComplete,
        onProxySearchError,
        displaySearchResults;
        
    self.init = function () {
        Ti.API.debug("DirectoryWindowController.init()");
        win.backgroundColor = '#fff';
        titleBar = new win.app.views.GenericTitleBar({
            app: app,
            title: app.localDictionary.directory,
            homeButton: true,
            settingsButton: false,
            windowKey: win.key
        });
        win.add(titleBar);
        
        searchBar = Titanium.UI.createSearchBar({
            top: titleBar.size.height,
            height:50,
            backgroundGradient: app.UPM.GLOBAL_STYLES.titleBarGradient,
            clearButtonMode: Ti.UI.INPUT_BUTTONMODE_ALWAYS,
            hintText: app.localDictionary.directorySearchHintText
        });
        win.add(searchBar);
        searchBar.addEventListener('return',onSearchSubmit);
        searchBar.focus();
        
        contentScrollView = Titanium.UI.createScrollView({
            top: searchBar.size.height + searchBar.top,
            height: Ti.Platform.displayCaps.platformHeight - titleBar.height
        });
        win.add(contentScrollView);
        contentScrollView.addEventListener('touchstart', blurSearch);
        
/*        defaultTable = Titanium.UI.createTableView({
            
        });*/
        
        peopleListTable = Titanium.UI.createTableView();
        contentScrollView.add(peopleListTable);
        peopleListTable.hide();
    };
    
    displaySearchResults = function () {
        Ti.API.debug("displaySearchResults function called in DirectoryWindowController");
        _people = directoryProxy.getPeople();
        if(_people.length > 0) {
            peopleListTable.show();
            for (var i=0, iLength=_people.length; i<iLength; i++) {
                peopleListTable.appendRow(Titanium.UI.createTableViewRow({
                    title: _people[i].name
                }));
            }
        }
        else {
            peopleListTable.hide();
        }
    };
    
    blurSearch = function () {
        searchBar.blur();
    };
    
    // Controller Events
    
    onSearchSubmit = function(e) {
        searchBar.blur();
        Ti.API.info("Directory Search submitted.");
        directoryProxy.search(searchBar.value);
    };    
    
    //Proxy events

    onProxySearching = function (e) {
        Ti.API.info("Searching...");
    };
    
    onProxySearchComplete = function (e) {
        Ti.API.info("Directory Search Complete");
        displaySearchResults();
    };
    
    onProxySearchError = function (e) {
        Ti.API.info("Directory Proxy Search Error");
    };
    
    Titanium.App.addEventListener('DirectoryProxySearching', onProxySearching);
    Titanium.App.addEventListener('DirectoryProxySearchComplete', onProxySearchComplete);
    Titanium.App.addEventListener('DirectoryProxySearchError', onProxySearchError);
    Titanium.App.addEventListener('showWindow', blurSearch);
    

    self.init();

    return self;
},
controller;
if(!controller) {
    controller = new DirectoryWindowController();
} 