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


var tabGroup, portalWindow, portalTab, searchWindow, searchTab, mapWindow, mapTab, settingsWindow, settingsTab;

Titanium.UI.setBackgroundColor('#fff');
tabGroup = Titanium.UI.createTabGroup();


//
// MAIN PORTAL VIEW
//
portalWindow = Titanium.UI.createWindow({
    url: 'portal_window.js',
    navBarHidden: true
});
portalTab = Titanium.UI.createTab({  
    icon:'icons/tab-home.png',
    title:'Home',
    window:portalWindow
});


//
// SEARCH VIEW
//
searchWindow = Titanium.UI.createWindow({  
    url: 'search_window.js',
    navBarHidden: true
});
searchTab = Titanium.UI.createTab({  
    icon:'icons/tab-search.png',
    title:'Search',
    window:searchWindow
});


//
// MAP VIEW
//
mapWindow = Titanium.UI.createWindow({
    url: 'map_window.js',
    title: 'Map'
});
mapTab = Titanium.UI.createTab({  
    icon:'icons/tab-map.png',
    title:'Map',
    window:mapWindow
});


//
//  SETTINGS VIEW
//
settingsWindow = Titanium.UI.createWindow({  
    url: 'settings_window.js',
    title: 'Settings'
});
settingsTab = Titanium.UI.createTab({  
    icon:'icons/tab-settings.png',
    title:'Settings',
    window:settingsWindow
});


//
// Initialize tab group
//
tabGroup.addTab(portalTab);
tabGroup.addTab(searchTab);  
tabGroup.addTab(mapTab);  
tabGroup.addTab(settingsTab);  
tabGroup.open();
