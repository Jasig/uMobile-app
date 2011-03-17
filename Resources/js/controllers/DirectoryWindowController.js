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

var DirectoryWindowController = function () {
    var win = Titanium.UI.currentWindow,
        app = win.app,
        self = {},
        directoryProxy = app.models.directoryProxy,
        titleBar,
        searchField,
        searchSubmit,
        proxySearching,
        proxySearchComplete,
        proxySearchError;
        
    self.init = function () {
        win.backgroundColor('#fff');
    };
    
    searchSubmit = function(e) {
        searchField.blur();
        Ti.API.info("Directory Search submitted.");
        directoryProxy.search(searchField.value);
    };
        
    titleBar = new win.app.views.GenericTitleBar({
        app: app,
        title: app.localDictionary.directory,
        homeButton: true,
        settingsButton: false,
        windowKey: win.key
    });
    win.add(titleBar);
    
    searchField = Titanium.UI.createTextField({
        height: 30,
        width: Ti.Platform.displayCaps.platformWidth - 43,
        clearButtonMode: Ti.UI.INPUT_BUTTONMODE_ALWAYS,
        borderStyle: Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
        left:38
    });
    searchField.addEventListener('return', searchSubmit);
    titleBar.add(searchField);
    
    //Proxy events

    proxySearching = function (e) {
        Ti.API.info("Searching...");
    };
    proxySearchComplete = function (e) {
        Ti.API.info("Search Complete");
    };
    proxySearchError = function (e) {
        Ti.API.info("Directory Proxy Search Error");
    };
    
    Titanium.addEventListener('DirectoryProxySearching', proxySearching);
    Titanium.addEventListener('DirectoryProxySearchComplete',proxySearchComplete);
    Titanium.addEventListener('DirectoryProxySearchError',proxySearchError);

    Ti.API.info(JSON.stringify(new app.models.DirectoryPersonVO("Jeff",{mail:['jcross@unicon.net'],username:'jeffbcross',"user.login.id":'jeffbcross',displayName:'Jeff Cross'})));
    return self;
},
controller = new DirectoryWindowController();