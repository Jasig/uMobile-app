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
    portlets, isGuestLayout,
    win, contentLayer, gridView,
    titleBar, activityIndicator, guestNotificationView,
    createWindow, createContentLayer, createGridView, drawChrome, addGuestLayoutIndicator;
    
    init = function () {
        Styles = app.styles;
        UI = app.UI;
        Portal = app.models.portalProxy;
        Device = app.models.deviceProxy;
        LocalDictionary = app.localDictionary;
        WindowManager = app.models.windowManager;
        SettingsWindow = app.controllers.settingsWindowController;
        PortalWindow = app.controllers.portalWindowController;
        
        Ti.App.addEventListener('updatestylereference', function (e) {
            Styles = app.styles;
        });
        
        Ti.App.addEventListener('dimensionchanges', function (e) {
            if (contentLayer) {
                contentLayer.width = Styles.portalContentLayer.width;
                contentLayer.height = Styles.portalContentLayer.height;
                
            }
            guestNotificationView.top = win.height - Styles.titleBar.height - Styles.homeGuestNote.height;
        });
    };
    
    this.open = function (modules, options) {
        if (!GridView) {
            Ti.include('js/views/PortalGridView.js');
            GridView = new PortalGridView(app);
        }
        portlets = modules;
        
        createWindow();
        createContentLayer();
        
        if (options.isGuestLayout) {
            Ti.API.debug("Is guest layout");
            isGuestLayout = true;
            addGuestLayoutIndicator();
        }
        else {
            Ti.API.debug("Not guest layout");
            isGuestLayout = false;
        }
        
        createGridView();
        drawChrome();
        
        if (options.firstLoad) {
            _self.showActivityIndicator(LocalDictionary.gettingPortlets);
        }
        else {
            Ti.API.debug("This isn't the first time we're loading");
        }
    };
    
    this.close = function () {
        if (win && (Device.isIOS())) {
            win.close();
        }
        else if (win) {
            win.hide();
        }
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
            createGridView();
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
        Titanium.UI.createAlertDialog({ title: title,
            message: message, buttonNames: [LocalDictionary.OK]
            }).show();
    };
    
    createWindow = function () {
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
    };
    
    createContentLayer = function () {
        contentLayer = Ti.UI.createView(Styles.portalContentLayer);
        win.add(contentLayer);
    };
    
    createGridView = function () {
        Ti.API.debug("Preparing to iterate through portlets in drawHomeGrid: " + portlets.length);  

        contentLayer.add(GridView.getGridView({isGuestLayout: isGuestLayout }));
        GridView.updateGrid(portlets);
        _self.hideActivityIndicator();
    };
    
    drawChrome = function (options) {
        Ti.API.debug("drawChrome() in PortalWindowView");
        titleBar = UI.createTitleBar({
    	    title: LocalDictionary.homeTitle,
    	    settingsButton: true,
    	    homeButton: false
    	});
        win.add(titleBar);
    	
    	activityIndicator = UI.createActivityIndicator();
        win.add(activityIndicator);
        activityIndicator.hide();
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
    
    
    
    init();
};