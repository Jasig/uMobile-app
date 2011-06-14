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
 * PortalWindowView.js contains the main home view, controlled
 * by PortalWindowController.js
 */

/**
* @constructor
*/
var PortalWindowView = function (facade) {
    var app = facade, init, _self = this, Styles, UI, LocalDictionary, Device, WindowManager, Portal, SettingsWindow, PortalWindow, GridView,
    portlets, isGuestLayout, _state,
    win, contentLayer, gridView,
    titleBar, activityIndicator, guestNotificationView,
    createWindow, createContentLayer, createGridView, drawChrome, addGuestLayoutIndicator,
    onPortalGridViewStateChange, onDimensionChanges;
    
    init = function () {
        Styles = app.styles;
        UI = app.UI;
        Portal = app.models.portalProxy;
        Device = app.models.deviceProxy;
        LocalDictionary = app.localDictionary;
        WindowManager = app.models.windowManager;
        SettingsWindow = app.controllers.settingsWindowController;
        PortalWindow = app.controllers.portalWindowController;
        
        _self.states = {
            INITIALIZED: "Initialized",
            OPENED: "Opened",
            CLOSED: "Closed"
        };
        
        Ti.App.addEventListener('updatestylereference', function (e) {
            Styles = app.styles;
        });
        Ti.App.addEventListener('PortalGridViewStateChange', onPortalGridViewStateChange);
        Ti.App.addEventListener('dimensionchanges', onDimensionChanges);
        
        _self.setState(_self.states.INITIALIZED);
    };
    
    this.open = function (modules, options) {
        portlets = modules;
        
        if (!win || Device.isIOS()) {
            Ti.API.debug("Create and open the portal window");
            //We want to create a new window and redraw the whole UI each time on iOS
            win = Ti.UI.createWindow(Styles.portalWindow);
            win.open();
        }
        else if (win && !win.visible) {
            Ti.API.debug("Just show the portal window");
            win.show();
        }
        
        if (!GridView) {
            Ti.include('js/views/PortalGridView.js');
            GridView = new PortalGridView(app);
        }
        
        contentLayer = Ti.UI.createView(Styles.portalContentLayer);
        win.add(contentLayer);
        
        if (options.isGuestLayout) {
            Ti.API.debug("Is guest layout");
            isGuestLayout = true;
            addGuestLayoutIndicator();
        }
        else {
            Ti.API.debug("Not guest layout");
            isGuestLayout = false;
        }
        if (!activityIndicator || Device.isIOS()) {
            activityIndicator = UI.createActivityIndicator();
        }
        else {
            try {
                win.remove(activityIndicator);
            }
            catch (e) {
                Ti.API.debug("No activityIndicator to remove from win in this.open() in PortalWindowView");
            }            
        }
        
        win.add(activityIndicator);
        
        contentLayer.add(GridView.getGridView({isGuestLayout: isGuestLayout }));
        _self.showActivityIndicator();
        GridView.updateGrid(portlets);
        
        titleBar = UI.createTitleBar({
    	    title: LocalDictionary.homeTitle,
    	    settingsButton: true,
    	    homeButton: false
    	});
        win.add(titleBar);
    	
        if (options.firstLoad) {
            _self.showActivityIndicator(LocalDictionary.gettingPortlets);
        }
        else {
            Ti.API.debug("This isn't the first time we're loading");
        }
        _self.setState(_self.states.OPENED);
    };
    
    this.close = function () {
        if (win && (Device.isIOS())) {
            win.close();
        }
        else if (win) {
            win.hide();
        }
        _self.setState(_self.states.CLOSED);
    };
    
    this.setState = function (newState) {
        _state = newState;
    };
    
    this.getState = function () {
        return _state;
    };
    
    this.updateModules = function (modules, options) {
        Ti.API.debug("updateModules() in PortalWindowView");
        if (options.isGuestLayout) {
            isGuestLayout = true;
        }
        else {
            isGuestLayout = false;
        }
        portlets = modules;
        if (WindowManager.getCurrentWindow() === PortalWindow.key) {
            if (GridView) {
                GridView.updateGrid(portlets);
                _self.showActivityIndicator();
            }
        }
        if (isGuestLayout) {
            addGuestLayoutIndicator();
        }
    };
    
    this.showActivityIndicator = function (message) {
        if (activityIndicator) {
            if (message) {
                activityIndicator.setLoadingMessage(message);
            }
            else {
                activityIndicator.setLoadingMessage(LocalDictionary.loading);
            }
            activityIndicator.show();
        }
        else {
            Ti.API.error("Activity Indicator isn't defined.");
        }
    };
    
    this.hideActivityIndicator = function () {
        Ti.API.debug("hideActivityIndicator() in PortalWindowView");
        if (activityIndicator) {
            activityIndicator.hide();
        }
        else {
            Ti.API.debug("activityIndicator not defined.");
        }
    };
    
    this.alert = function (title, message) {
        _self.hideActivityIndicator();
        Titanium.UI.createAlertDialog({ title: title,
            message: message, buttonNames: [LocalDictionary.OK]
            }).show();
    };
    
    addGuestLayoutIndicator = function () {
        var guestNotificationLabel;
        
        guestNotificationView = Ti.UI.createView(Styles.homeGuestNote);
        guestNotificationView.top = win.height - Styles.titleBar.height - Styles.homeGuestNote.height;
        
        guestNotificationLabel = Ti.UI.createLabel(Styles.homeGuestNoteLabel);
        guestNotificationLabel.text = LocalDictionary.viewingGuestLayout;
        guestNotificationView.add(guestNotificationLabel);
        
        contentLayer.add(guestNotificationView);
        
        guestNotificationView.addEventListener('click', function (e){
            Ti.API.info("Clicked guest notification, opening settings");
            WindowManager.openWindow(SettingsWindow.key);
        });  
    };
    
    onDimensionChanges = function (e) {
        Ti.API.debug('onDimensionChanges() in PortalWindowView');
        if (contentLayer && Device.isIOS()) {
            contentLayer.width = Styles.portalContentLayer.width;
            contentLayer.height = Styles.portalContentLayer.height;
        }
        else {
            Ti.API.error("There's no contentLayer");
        }
        if (guestNotificationView) {
            guestNotificationView.top = win.height - Styles.titleBar.height - Styles.homeGuestNote.height;
        }
    };
    
    onPortalGridViewStateChange = function (e) {
        Ti.API.debug("onPortalGridViewStateChange() in PortalWindowView. State is: " + e.state);
        if (GridView && activityIndicator && e.state === GridView.states.COMPLETE && portlets.length > 0) {
            _self.hideActivityIndicator();
        }
    };
    
    
    
    init();
};