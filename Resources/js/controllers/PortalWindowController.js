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
    var win, app = facade, _self = this, init, firstTimeOpened=true,
        initialized, _newNetworkDowntime = true, //This var is to prevent multiple notifications of network downtime. Set to false as soon as downtime is encountered
        onGettingPortlets, onPortletsLoaded, onNetworkSessionSuccess, onNetworkSessionFailure, onPortalProxyNetworkError, onAndroidSearchClick,
        onWindowFocus, onAppWindowOpening, onAppWindowOpened, onPortalDownNotificationClicked,
        pathToRoot = '../../';

    init = function () {
        Ti.API.debug("init() in PortalWindowController");
        //Assign the unique key
        _self.key = 'home';

    	Ti.App.addEventListener(PortalProxy.events['GETTING_PORTLETS'], onGettingPortlets);
    	Ti.App.addEventListener(PortalProxy.events['PORTLETS_LOADED'], onPortletsLoaded);
        Ti.App.addEventListener(PortalProxy.events['NETWORK_ERROR'], onPortalProxyNetworkError);
        Ti.App.addEventListener(WindowManager.events['WINDOW_OPENING'], onAppWindowOpening);
        Ti.App.addEventListener(WindowManager.events['WINDOW_OPENED'], onAppWindowOpened);
        Ti.App.addEventListener(LoginProxy.events['NETWORK_SESSION_SUCCESS'], onNetworkSessionSuccess);
        Ti.App.addEventListener(PortalWindowView.events['NOTIFICATION_CLICKED'], onPortalDownNotificationClicked);
        Ti.App.addEventListener(LoginProxy.events['NETWORK_SESSION_FAILURE'], onNetworkSessionFailure);
        Ti.App.addEventListener(PortalWindowView.events['ANDROID_SEARCH_CLICKED'], onAndroidSearchClick);
        
        initialized = true;
    };
    
    this.open = function () {
        Ti.API.debug("open() in PortalWindowController");
        
        // This will determine if a network session exists, and what 
        // window was open last time the app closed, and will manage the process
        // of establishing a session and opening the window.
        if (!app.models.deviceProxy.checkNetwork()) {
            Ti.App.fireEvent(ApplicationFacade.events['NETWORK_ERROR']);
            return;
        }
        else if (!app.models.sessionProxy.isActive(app.models.loginProxy.sessionTimeContexts.NETWORK)) {
            app.models.loginProxy.establishNetworkSession();
        }

        if (firstTimeOpened) {
            app.views.portalWindowView.open( [], { firstLoad: true });
            firstTimeOpened = false;
        }
        else {
            app.views.portalWindowView.open( app.models.portalProxy.getPortlets(), { isGuestLayout: app.models.userProxy.isGuestUser(), isPortalReachable: app.models.portalProxy.getIsPortalReachable() });
        }
        
    };
    
    this.close = function () {
        if (app.views.portalWindowView) {
            app.views.portalWindowView.close();
        }
    };
    
    onAndroidSearchClick = function (e) {
    	Ti.API.debug("onAndroidSearchClick() in PortalWindowController");
    	var _searchPortlet = app.models.portalProxy.getPortletByFName('search'); 
    	if (_searchPortlet) {
    		app.models.portalProxy.getShowPortletFunc(_searchPortlet)();
    	}
    };
    
    onNetworkSessionSuccess = function (e) {
        _newNetworkDowntime = true;
        app.models.portalProxy.getPortletsForUser();
    };
    
    onNetworkSessionFailure = function(e) {
        Ti.API.debug("onNetworkSessionFailure() in PortalWindowController");
        // if (e.user && e.user === 'guest') {
            app.models.portalProxy.getPortletsForUser();
        // }
        // else if (!e.user) {
        if (!e.user) {
            Ti.API.debug("Checking network and opening portalwindowview. isPortalReachable?" + app.models.portalProxy.getIsPortalReachable());
            if (app.models.deviceProxy.checkNetwork()) {
                if (_newNetworkDowntime) {
                    app.views.portalWindowView.alert(app.localDictionary.error, app.localDictionary.failedToLoadPortlets);
                    _newNetworkDowntime = false;
                }
                app.views.portalWindowView.updateModules( app.models.portalProxy.getPortlets(), {
                    isPortalReachable: app.models.portalProxy.getIsPortalReachable()
                });
            }
            else {
                Ti.App.fireEvent(ApplicationFacade.events['NETWORK_ERROR']);
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
        app.views.portalWindowView.updateModules(app.models.portalProxy.getPortlets(), {isGuestLayout: app.models.userProxy.isGuestUser(), isPortalReachable: app.models.portalProxy.getIsPortalReachable() });
    };
    
    onPortalProxyNetworkError = function (e) {
        //This event responds to any type of error in retrieving portlets from the sever.
        // app.views.portalWindowView.alert(app.localDictionary.error, e.message);
    };
    
    onPortalDownNotificationClicked = function (e) {
        _newNetworkDowntime = true;
        app.models.loginProxy.establishNetworkSession();
    };
    
    onAppWindowOpened = function (e) {
        if (app.models.windowManager.getCurrentWindow !== _self.key) {
            // app.views.portalWindowView.hideActivityIndicator();
        }
    };
    
    onAppWindowOpening = function (e) {
        if (win && win.visible) {
            // app.views.portalWindowView.showActivityIndicator(app.localDictionary.loading);
        }
    };
    
    if(!initialized) {
        init();
    }
};