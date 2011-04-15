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

// library includes
Titanium.include('config.js');

var windows = {},
    app = facade,
    activityIndicator;


// Titanium.UI.setBackgroundColor(app.styles.backgroundColor);

//Let the user know that they need a network connection to use this app.
if (!Ti.Network.online) {
    alert(app.localDictionary.networkConnectionRequired);
}

//
// MAIN PORTAL VIEW
//
windows.home = Titanium.UI.createWindow({
    url: 'js/controllers/PortalWindowController.js',
    navBarHidden: true,
    app: app,
    key: 'home'
});

windows.home.open();


//
// PORTLET VIEW
//
windows.portlet = Titanium.UI.createWindow({
    url: 'js/controllers/PortletWindowController.js',
    navBarHidden: true,
    app: app,
    key: 'portlet'
});


//
//Directory VIEW
//
windows.directory = Titanium.UI.createWindow({
    url: 'js/controllers/DirectoryWindowController.js',
    backgroundColor: app.styles.backgroundColor,
    title: app.localDictionary.directory,
    app: app,
    key: 'directory',
    id: 'directoryWindowController'
});
// windows.directory.open();

//
// MAP VIEW
//
windows.map = Titanium.UI.createWindow({
    url: 'js/controllers/MapWindowController.js',
    title: app.localDictionary.map,
    app: app,
    key: 'map'
});
// windows.map.open();


//
//  SETTINGS VIEW
//
windows.settings = Titanium.UI.createWindow({
    url: 'js/controllers/SettingsWindowController.js',
    navBarHidden: true,
    app: app,
    key: 'settings'
});

activityIndicator = app.views.GlobalActivityIndicator;

Ti.App.addEventListener('showWindow', function (e) {
    Ti.API.debug("showWindow Event. New: " + e.newWindow + ", Old: " + e.oldWindow);

    if(windows[e.oldWindow] != windows[e.newWindow]) {
        windows[e.oldWindow].hide();

        if (windows[e.newWindow].initialized) {
            Ti.API.debug("new window is initialized");
            windows[e.newWindow].show();
        }     
        else {
            Ti.API.debug("new window is NOT initialized");
            windows[e.newWindow].open();
        }
    }
    else {
        Ti.API.debug("You're trying to navigate to the same window you're already in.");
    }
});

Ti.App.addEventListener('showPortlet', function (portlet) {
    
    Ti.API.info("Showing portlet window " + portlet.title);
    windows.home.hide();
    if (windows.portlet.initialized) {
        Titanium.App.fireEvent('includePortlet', portlet);
        windows.portlet.show();
    } 

    else {
        windows.portlet.addEventListener('open', function(e) {
            Titanium.App.fireEvent('includePortlet', portlet);
        });
        windows.portlet.open();
    }
    
    activityIndicator.hide();
});