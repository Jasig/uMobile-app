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
 * PortalWindowController.js reacts to events from PortalProxy.js 
 * and manages the main home grid view at PortalWindowView.js
 */

/**
* @constructor
*/
var PortalWindowController = function (facade) {
    var win, app = facade, _self = this, init, Portal, PortalView,
        initialized, isGuestLayout = true,
        onGettingPortlets, onPortletsLoaded, onNetworkSessionSuccess, onNetworkSessionFailure, onPortalProxyNetworkError,
        onWindowFocus, onAppWindowOpening, onAppWindowOpened, 
        pathToRoot = '../../';

    init = function () {
        //Assign the unique key
        _self.key = 'home';
        
        //Pointers to Facade members
        Portal = app.models.portalProxy;
        LocalDictionary = app.localDictionary;
        
        SettingsWindow = app.controllers.settingsWindowController;

    	Ti.App.addEventListener("PortalProxyGettingPortlets", onGettingPortlets);
    	Ti.App.addEventListener("PortalProxyPortletsLoaded", onPortletsLoaded);
        Ti.App.addEventListener('PortalProxyNetworkError', onPortalProxyNetworkError);
        Ti.App.addEventListener('OpeningNewWindow', onAppWindowOpening);
        Ti.App.addEventListener('NewWindowOpened', onAppWindowOpened);
        Ti.App.addEventListener('EstablishNetworkSessionSuccess', onNetworkSessionSuccess);
        Ti.App.addEventListener('EstablishNetworkSessionFailure', onNetworkSessionFailure);
        
        initialized = true;
    };
    
    this.open = function () {
        Ti.API.debug("open() in PortalWindowController");
        if (!PortalView) {
            Titanium.include('js/views/PortalWindowView.js');
            PortalView = new PortalWindowView(app);
        }
        PortalView.open( Portal.getPortlets(), { isGuestLayout: isGuestLayout });
    };
    
    this.close = function () {
        if (PortalView) {
            PortalView.close();
        }
    };
    
    onNetworkSessionSuccess = function (e) {
        if (e.user && e.user === 'guest') {
            isGuestLayout = true;
        }
        else {
            isGuestLayout = false;
        }
        Portal.getPortletsForUser();
    };
    
    onNetworkSessionFailure = function(e) {
        Ti.API.debug("onNetworkSessionFailure() in PortalWindowController");
        if (e.user && e.user === 'guest') {
            isGuestLayout = true;
            Portal.getPortletsForUser();
        }
        else {
            isGuestLayout = false;
        }
    };
    
    //PortalProxy events
    onGettingPortlets = function (e) {
        Ti.API.debug("onGettingPortlets() in PortalWindowController");
        // Display a loading indicator until we can finish downloading the user
        // layout and creating the initial view
    };
    
    onPortletsLoaded = function (e) {
        if (win && win.visible) {
            PortalView.updateModules(Portal.getPortlets(), {isGuestLayout: isGuestLayout});
        }
    };
    
    onPortalProxyNetworkError = function (e) {
        //This event responds to any type of error in retrieving portlets from the sever.
        Ti.UI.createAlertDialog({ title: LocalDictionary.error,
            message: e.message, buttonNames: [LocalDictionary.OK]
            }).show();
    };
    
    onAppWindowOpened = function (e) {
        PortalView.hideActivityIndicator();
    };
    
    onAppWindowOpening = function (e) {
        if (win && win.visible) {
            PortalView.showActivityIndicator(LocalDictionary.loading);
        }
    };
    
    if(!initialized) {
        init();
    }
};