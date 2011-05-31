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
    var app = facade, init, _self = this, Styles, UI, LocalDictionary, Device, WindowManager, Portal, SettingsWindow,
    portlets, isGuestLayout,
    win, contentLayer, gridView,
    titleBar, activityIndicator, 
    createWindow, createContentLayer, createGridView, drawChrome, addGuestLayoutIndicator,
    onGridItemClick, onGridItemPressUp, onGridItemPressDown;
    
    init = function () {
        Styles = app.styles;
        UI = app.UI;
        Portal = app.models.portalProxy;
        Device = app.models.deviceProxy;
        LocalDictionary = app.localDictionary;
        WindowManager = app.models.windowManager;
        SettingsWindow = app.controllers.settingsWindowController;
        // _self = Ti.UI.createScrollView(Styles.homeGrid);
    };
    
    this.open = function (modules, options) {
        portlets = modules;
        
        createWindow();
        createContentLayer();
        createGridView();
        drawChrome();
        if (options.isGuestLayout) {
            Ti.API.debug("Is guest layout");
            isGuestLayout = true;
            addGuestLayoutIndicator();
        }
        else {
            Ti.API.debug("Not guest layout");
            isGuestLayout = false;
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
        if (options.isGuestLayout) {
            isGuestLayout = true;
        }
        else {
            isGuestLayout = false;
        }
        portlets = modules;
        createGridView();
    };
    
    this.showActivityIndicator = function (message) {
        if (activityIndicator) {
            if (message) {
                activityIndicator.setLoadingMessage(message);
            }
            activityIndicator.show();
        }
    };
    
    this.hideActivityIndicator = function () {
        if (activityIndicator) {
            activityIndicator.hide();
        }
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
        var completeWidth, completeHeight, numColumns, leftPadding, gridViewDefaults;
        Ti.API.debug("Preparing to iterate through portlets in drawHomeGrid: " + portlets.length);
        
        //Remove existing gridView...if exists
        if (gridView && gridView.getParent()) {
            gridView.getParent().remove(gridView);
        }
        
        gridView = Titanium.UI.createScrollView(Styles.homeGrid);
        gridView.height = isGuestLayout ? Styles.homeGrid.height - Styles.homeGuestNote.height : Styles.homeGrid.height;
        contentLayer.add(gridView);
        
        completeWidth = Styles.gridItem.width + 2 * Styles.gridItem.padding;
        completeHeight = Styles.gridItem.width + 2 * Styles.gridItem.padding;
        numColumns = Math.floor(Device.getWidth() / completeWidth);
        leftPadding = Math.floor(((Device.getWidth() - (completeWidth * numColumns))) / 2);
        
        for (var i=0, iLength = portlets.length; i<iLength; i++ ) {
            //Place the item in the scrollview and listen for singletaps
            gridView.add(createGridItem(Styles.gridItem.padding + Math.floor(i / numColumns) * completeHeight, //Top
                leftPadding + Styles.gridItem.padding + (i % numColumns) * completeWidth, //Left
                portlets[i]));
        }
        Ti.API.info("Done placing portlets");
    };
    
    function createGridItem (top, left, portlet) {
        // Create the container for the grid item
        var gridItem, gridItemLabel, gridItemIcon, gridBadgeBackground, gridBadgeNumber,
        gridItemDefaults = Styles.gridItem, gridItemIconDefaults, gridBadgeBackgroundDefaults, gridBadgeNumberDefaults;
        
        gridItemDefaults.top = top;
        gridItemDefaults.left = left;
        gridItem = Ti.UI.createView(gridItemDefaults);

        gridItem.portlet = portlet;

        //Add a label to the grid item
        if (portlet.title) {
            var gridItemLabelDefaults = Styles.gridItemLabel;
            gridItemLabelDefaults.text =  portlet.title.toLowerCase();
            gridItemLabel = Ti.UI.createLabel(gridItemLabelDefaults);
            gridItem.add(gridItemLabel);
        }

        //Add an icon to the grid item
        gridItemIconDefaults = Styles.gridIcon;
        gridItemIconDefaults.image = Portal.getIconUrl(portlet);
        gridItemIcon = Ti.UI.createImageView(gridItemIconDefaults);
        gridItemIcon.portlet = portlet;
        gridItem.add(gridItemIcon);
        
        // if the module has a new item count of more than zero (no new items)
        // add a badge number to the home screen icon
        if (portlet.newItemCount > 0) {
            gridBadgeBackgroundDefaults = Styles.gridBadgeBackground;
            gridBadgeBackground = Ti.UI.createImageView(gridBadgeBackgroundDefaults);
            gridItem.add(gridBadgeBackground);

            gridBadgeNumberDefaults = Styles.gridBadgeNumber;
            gridBadgeNumberDefaults.text = portlet.newItemCount;
            gridBadgeNumber = Ti.UI.createLabel(gridBadgeNumberDefaults);
            gridItem.add(gridBadgeNumber);
        }
        
        gridItemIcon.addEventListener("singletap", onGridItemClick);
        gridItemIcon.addEventListener("touchstart", onGridItemPressDown);
        gridItemIcon.addEventListener(Device.isAndroid() ? 'touchcancel' : 'touchend', onGridItemPressUp);
        
        return gridItem;
    }
    
    drawChrome = function () {
        titleBar = UI.createTitleBar({
    	    title: LocalDictionary.jasig11,
    	    settingsButton: true,
    	    homeButton: false
    	});
        win.add(titleBar);
    	
    	activityIndicator = UI.createActivityIndicator();
        win.add(activityIndicator);
    };
    
    addGuestLayoutIndicator = function () {
        var guestNotificationView, guestNotificationLabel;
        
        guestNotificationView = Ti.UI.createView(Styles.homeGuestNote);
        guestNotificationView.top = win.height - titleBar.height - Styles.homeGuestNote.height;
        
        guestNotificationLabel = Ti.UI.createLabel(Styles.homeGuestNoteLabel);
        guestNotificationLabel.text = LocalDictionary.viewingGuestLayout;
        guestNotificationView.add(guestNotificationLabel);
        
        contentLayer.add(guestNotificationView);
        
        guestNotificationView.addEventListener('touchstart', function (e){
            Ti.API.info("Clicked guest notification, opening settings");
            WindowManager.openWindow(SettingsWindow.key);
        });
        
        
    };
    
    onGridItemClick = function (e) {
        var func;
        Ti.API.debug("onGridItemClick() in PortalWindowController " + JSON.stringify(e.source.portlet));
        if (e.source.portlet) {
            func = Portal.getShowPortletFunc(e.source.portlet);
            func();
        }
        else {
            Ti.API.error("No portlet was attached to the icon.");
        }
    };
    onGridItemPressDown = function (e) {
        Ti.API.debug("Home button pressed down, source: " + e.source.type);
        if(Device.isIOS()) {
            if (e.source.type === 'gridIcon') {
                e.source.getParent().opacity = Styles.gridItem.pressOpacity;
            }
            else {
                e.source.opacity = Styles.gridItem.pressOpacity;
            }
        }
        else {
            Ti.API.debug("Not setting opacity of icon because Android doesn't support it.");
        }
    };

    onGridItemPressUp = function (e) {
        Ti.API.debug("Home button pressed up");
        if(Device.isIOS()) {
            if (e.source.type === 'gridIcon') {
                e.source.getParent().setOpacity(1.0);
            }
            else {
                e.source.setOpacity(1.0);
            }
        }
        else {
            Ti.API.debug("onGridItemPressUp condition wasn't met");
        }
    };
    
    init();
};