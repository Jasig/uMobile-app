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
Titanium.include('lib.js');
Titanium.include('style.js');
Titanium.include('localization.js');
Titanium.include('js/models/MapProxy.js');
Titanium.include('js/models/DirectoryProxy.js');
Titanium.include('js/views/GenericTitleBar.js');
Titanium.include('js/views/GlobalActivityIndicator.js');
Titanium.include('js/views/MapDetailTop.js');
Titanium.include('js/views/PersonDetailTableView.js');
Titanium.include('js/views/SecondaryNavBar.js');
Titanium.include('js/controllers/DirectoryDetailController.js');
Titanium.include('js/controllers/MapDetailViewController.js');

var windows = {},
    facade,
    activityIndicator;
    
facade = {
    UPM: UPM,
    localDictionary: localDictionary[Titanium.App.Properties.getString('locale')], //Returns a localized object of all application strings, based on locale property set in config.js.
    styles: styles
};

facade.models = {
    mapService: new MapService(facade),
    directoryProxy: new DirectoryProxy(facade)
};

facade.views = {
    MapDetailTop: MapDetailTop,
    GenericTitleBar: GenericTitleBar,
    PersonDetailTableView: PersonDetailTableView,
    GlobalActivityIndicator: new GlobalActivityIndicator(facade),
    SecondaryNavBar: SecondaryNavBar
};

facade.controllers = {
    DirectoryDetailController: DirectoryDetailController,
    MapDetailViewController: MapDetailViewController
};

Titanium.UI.setBackgroundColor(facade.styles.backgroundColor);

//Let the user know that they need a network connection to use this app.
if (!Ti.Network.online) {
    alert(facade.localDictionary.networkConnectionRequired);
}

//
// MAIN PORTAL VIEW
//
windows.home = Titanium.UI.createWindow({
    url: 'js/controllers/PortalWindowController.js',
    navBarHidden: true,
    app: facade,
    key: 'home'
});

windows.home.open();


//
// PORTLET VIEW
//
windows.portlet = Titanium.UI.createWindow({
    url: 'js/controllers/PortletWindowController.js',
    navBarHidden: true,
    app: facade,
    key: 'portlet'
});


//
//Directory VIEW
//
windows.directory = Titanium.UI.createWindow({
    url: 'js/controllers/DirectoryWindowController.js',
    backgroundColor: facade.styles.backgroundColor,
    title: facade.localDictionary.directory,
    app: facade,
    key: 'directory',
    id: 'directoryWindowController'
});
// windows.directory.open();

//
// MAP VIEW
//
windows.map = Titanium.UI.createWindow({
    url: 'js/controllers/MapWindowController.js',
    title: facade.localDictionary.map,
    app: facade,
    key: 'map'
});
// windows.map.open();


//
//  SETTINGS VIEW
//
windows.settings = Titanium.UI.createWindow({
    url: 'js/controllers/SettingsWindowController.js',
    navBarHidden: true,
    app: facade,
    key: 'settings'
});

activityIndicator = facade.views.GlobalActivityIndicator;

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