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
Titanium.include('skin.js');
Titanium.include('localization.js');
Titanium.include('js/models/MapProxy.js');
Titanium.include('js/models/DirectoryPersonVO.js');
Titanium.include('js/models/DirectoryProxy.js');
Titanium.include('js/views/GenericTitleBar.js');
Titanium.include('js/views/GlobalActivityIndicator.js');
Titanium.include('js/views/MapDetailTop.js');
Titanium.include('js/views/PersonDetailTableView.js');
Titanium.include('js/controllers/DirectoryDetailController.js');

var windows = {},
    facade = {};
    
facade = {
    UPM: UPM,
    localDictionary: localDictionary[Titanium.App.Properties.getString('locale')] //Returns a localized object of all application strings, based on locale property set in config.js.
};

facade.models = {
    mapService: new MapService(facade),
    directoryProxy: new DirectoryProxy(facade),
    DirectoryPersonVO: DirectoryPersonVO
};

facade.views = {
    MapDetailTop: MapDetailTop,
    GenericTitleBar: GenericTitleBar,
    PersonDetailTableView: PersonDetailTableView,
    GlobalActivityIndicator: new GlobalActivityIndicator(facade)
};

facade.controllers = {
    DirectoryDetailController: DirectoryDetailController
};

Titanium.UI.setBackgroundColor(UPM.HOME_GRID_BACKGROUND_COLOR);

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

Ti.App.addEventListener('showWindow', function (e) {
    windows[e.oldWindow].hide();
    
    if (windows[e.newWindow].initialized) {
        windows[e.newWindow].show();
    } 
    
    else {
        windows[e.newWindow].open();
    }        

});

Ti.App.addEventListener('showPortlet', function (portlet) {

    windows.home.hide();
    Ti.API.info("Showing portlet window " + portlet.title);
    
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
});