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
Titanium.include('lib.js');
Titanium.include('skin.js');
Titanium.include('js/MapService.js');
Titanium.include('js/views/GenericTitleBar.js');
Titanium.include('js/views/MapDetailTop.js');
Titanium.include('config.js');



var windows = {},
    facade = {
        UPM: UPM,
        views: {
            MapDetailTop: MapDetailTop,
            GenericTitleBar: GenericTitleBar
        },
        models: {
            mapServiceInstance: new MapService()
        },
        controllers: {}
    };

Titanium.UI.setBackgroundColor(UPM.HOME_GRID_BACKGROUND_COLOR);

//
// MAIN PORTAL VIEW
//
windows.home = Titanium.UI.createWindow({
    url: 'portal_window.js',
    navBarHidden: true,
    app: facade
});
// windows.home.open();


//
// PORTLET VIEW
//
windows.portlet = Titanium.UI.createWindow({
 url: 'portlet_window.js',
 navBarHidden: true,
 app: facade
});


//
// MAP VIEW
//
windows.map = Titanium.UI.createWindow({
    url: 'map_window.js',
    title: 'Map',
    app: facade
});
windows.map.open();


//
//  SETTINGS VIEW
//
windows.settings = Titanium.UI.createWindow({
    url: 'settings_window.js',
    navBarHidden: true,
    app: facade
});

Ti.App.addEventListener('showWindow', function (e) {
    var opts = {};
    if (e.transition) {
        opts.transition = e.transition;
    }
    windows[e.oldWindow].close(opts);
    windows[e.newWindow].open();
});

Ti.App.addEventListener('showPortlet', function (portlet) {

    windows.portlet.addEventListener('open', function(e) {
        Titanium.App.fireEvent('includePortlet', portlet);
    });
    
    // transition to the portlet window
    windows.home.close();
    windows.portlet.open();
});