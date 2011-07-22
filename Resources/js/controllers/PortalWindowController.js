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
    var win, app = facade, _self = this, init, Portal, PortalView, WindowManager, User, Device, Sessions, LoginProxy,
        initialized, 
        onGettingPortlets, onPortletsLoaded, onNetworkSessionSuccess, onNetworkSessionFailure, onPortalProxyNetworkError, onAndroidSearchClick,
        onWindowFocus, onAppWindowOpening, onAppWindowOpened, 
        pathToRoot = '../../';

    init = function () {
        //Assign the unique key
        _self.key = 'home';
        
        //Pointers to Facade members
        Device = app.models.deviceProxy;
        Portal = app.models.portalProxy;
        LocalDictionary = app.localDictionary;
        WindowManager = app.models.windowManager;
        SettingsWindow = app.controllers.settingsWindowController;
        Sessions = app.models.sessionProxy;
        LoginProxy = app.models.loginProxy;
        User = app.models.userProxy;

    	Ti.App.addEventListener("PortalProxyGettingPortlets", onGettingPortlets);
    	Ti.App.addEventListener("PortalProxyPortletsLoaded", onPortletsLoaded);
        Ti.App.addEventListener('PortalProxyNetworkError', onPortalProxyNetworkError);
        Ti.App.addEventListener('OpeningNewWindow', onAppWindowOpening);
        Ti.App.addEventListener('NewWindowOpened', onAppWindowOpened);
        Ti.App.addEventListener('EstablishNetworkSessionSuccess', onNetworkSessionSuccess);
        Ti.App.addEventListener('EstablishNetworkSessionFailure', onNetworkSessionFailure);
        Ti.App.addEventListener('HomeAndroidSearchButtonClicked', onAndroidSearchClick);
        
        initialized = true;
    };
    
    this.open = function () {
        Ti.API.debug("open() in PortalWindowController");
        
        // This will determine if a network session exists, and what 
        // window was open last time the app closed, and will manage the process
        // of establishing a session and opening the window.
        if (!app.models.deviceProxy.checkNetwork()) {
            Ti.App.fireEvent('networkConnectionError');
            return;
        }
        else if (!Sessions.isActive(LoginProxy.sessionTimeContexts.NETWORK)) {
            app.models.loginProxy.establishNetworkSession();
        }

        if (!PortalView) {
            Titanium.include('js/views/PortalWindowView.js');
            PortalView = new PortalWindowView(app);
            PortalView.open( [], { firstLoad: true });
        }
        else {
            PortalView.open( Portal.getPortlets(), { isGuestLayout: User.isGuestUser() });
        }
        
    };
    
    this.close = function () {
        if (PortalView) {
            PortalView.close();
        }
    };
    
    onAndroidSearchClick = function (e) {
    	Ti.API.debug("onAndroidSearchClick() in PortalWindowController");
    	var _searchPortlet = Portal.getPortletByFName('search'); 
    	if (_searchPortlet) {
    		Portal.getShowPortletFunc(_searchPortlet)();
    	}
    };
    
    onNetworkSessionSuccess = function (e) {
        Portal.getPortletsForUser();
    };
    
    onNetworkSessionFailure = function(e) {
        Ti.API.debug("onNetworkSessionFailure() in PortalWindowController");
        if (e.user && e.user === 'guest') {
            Portal.getPortletsForUser();
        }
        else if (!e.user) {
            if (Device.checkNetwork()) {
                PortalView.alert(LocalDictionary.error, LocalDictionary.failedToLoadPortlets);
            }
            else {
                Ti.App.fireEvent('networkConnectionError');
            }
            
        }
    };
    
    //PortalProxy events
    onGettingPortlets = function (e) {
        Ti.API.debug("onGettingPortlets() in PortalWindowController");
        // Display a loading indicator until we can finish downloading the user
        // layout and creating the initial view
    };
    
    onPortletsLoaded = function (e) {
        PortalView.updateModules(Portal.getPortlets(), {isGuestLayout: User.isGuestUser()});
    };
    
    onPortalProxyNetworkError = function (e) {
        //This event responds to any type of error in retrieving portlets from the sever.
        PortalView.alert(LocalDictionary.error, e.message);
    };
    
    onAppWindowOpened = function (e) {
        if (WindowManager.getCurrentWindow !== _self.key) {
            // PortalView.hideActivityIndicator();
        }
    };
    
    onAppWindowOpening = function (e) {
        if (win && win.visible) {
            // PortalView.showActivityIndicator(LocalDictionary.loading);
        }
    };
    
    if(!initialized) {
        init();
    }
};