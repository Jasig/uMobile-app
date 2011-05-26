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
 * portal_window.js contains setup information for the
 * main portal navigation tab.
 */

/**
* @constructor
*/
var PortalWindowController = function (facade) {
    var win, app = facade, _self = this, Portal, Device, Styles, UI, LocalDictionary, WindowManager, SettingsWindow,
        initialized, isGuestLayout = true,
        contentLayer, portalView, portletView, portalGridView, activityIndicator, pressedItem, titleBar, guestNotificationView, guestNotificationLabel,
        init, open, close, createPortalView, drawHomeGrid, drawAndroidGrid, drawiOSGrid, 
        onGridItemClick, onGridItemPressUp, onGridItemPressDown,
        onGettingPortlets, onPortletsLoaded, onNetworkSessionSuccess, onNetworkSessionFailure, onPortalProxyNetworkError,
        onWindowFocus, onAppWindowOpening, onAppWindowOpened, 
        pathToRoot = '../../';

    init = function () {
        //Assign the unique key
        _self.key = 'home';
        
        //Pointers to Facade members
        Portal = app.models.portalProxy;
        Device = app.models.deviceProxy;
        Styles = app.styles;
        UI = app.UI;
        LocalDictionary = app.localDictionary;
        WindowManager = app.models.windowManager;
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
        createPortalView();
    };
    
    this.close = function () {
        if (win && (Device.isIOS())) {
            win.close();
        }
        else if (win) {
            win.hide();
        }
    };

    createPortalView = function () {
        if (win) {
            if (Device.isIOS()) {
                Ti.API.debug("Platform is iOS in createPortalView() in PortalWindowController");
                titleBar = UI.createTitleBar({
            	    title: LocalDictionary.jasig11,
            	    settingsButton: true,
            	    homeButton: false
            	});
            	win.add(titleBar);
            	
            	contentLayer = Ti.UI.createView(Styles.portalContentLayer);
                win.add(contentLayer);
                
                activityIndicator = UI.createActivityIndicator();
                win.add(activityIndicator);
                activityIndicator.show();
                
                Ti.API.debug("Creating a new portal home view");
            	portalView = Ti.UI.createScrollView(Styles.homeGrid);
            	portalView.height = isGuestLayout ? win.height - titleBar.height - Styles.homeGuestNote.height : win.height - titleBar.height;
                contentLayer.add(portalView);
                
                if (isGuestLayout) {
                    guestNotificationView = Ti.UI.createView(Styles.homeGuestNote);
                    guestNotificationView.top = win.height - titleBar.height - Styles.homeGuestNote.height;
                    guestNotificationLabel = Ti.UI.createLabel(Styles.homeGuestNoteLabel);
                    guestNotificationLabel.text = LocalDictionary.viewingGuestLayout;
                    guestNotificationView.add(guestNotificationLabel);
                    contentLayer.add(guestNotificationView);

                    guestNotificationView.addEventListener('click', function (e){
                        WindowManager.openWindow(SettingsWindow.key);
                    });
                }
                
                if (Portal.getPortlets().length > 0) {
                    drawHomeGrid(Portal.getPortlets());
                }
            }
            else if (Device.isAndroid()) {
                Ti.API.debug("Platform is Android in createPortalView() in PortalWindowController");
                if (!titleBar) {
                    Ti.API.debug("Creating and adding titleBar");
                    titleBar = UI.createTitleBar({
                	    title: LocalDictionary.jasig11,
                	    settingsButton: true,
                	    homeButton: false
                	});
                	win.add(titleBar);
                }
                
                if (!contentLayer) {
                    Ti.API.debug("Creating and adding contentLayer");
                    contentLayer = Ti.UI.createView(Styles.portalContentLayer);
                    win.add(contentLayer);
                }
                
                if (!activityIndicator) {
                    Ti.API.debug("Creating and adding activityIndicator");
                    activityIndicator = UI.createActivityIndicator();
                    win.add(activityIndicator);
                }
                activityIndicator.show();
                
                if (!portalView) {
                    Ti.API.debug("Creating and adding portalView");
                    portalView = Ti.UI.createScrollView(Styles.homeGrid);
                	portalView.height = isGuestLayout ? win.height - titleBar.height - Styles.homeGuestNote.height : win.height - titleBar.height;
                    contentLayer.add(portalView);
                }
                
                if (isGuestLayout) {
                    Ti.API.debug("Creating and adding Guest Layout Note");
                    if (!guestNotificationView) {
                        Ti.API.debug("No guestNotificationView...");
                        guestNotificationView = Ti.UI.createView(Styles.homeGuestNote);
                        guestNotificationView.top = win.height - titleBar.height - Styles.homeGuestNote.height;
                        guestNotificationLabel = Ti.UI.createLabel(Styles.homeGuestNoteLabel);
                        guestNotificationLabel.text = LocalDictionary.viewingGuestLayout;
                        guestNotificationView.add(guestNotificationLabel);
                        contentLayer.add(guestNotificationView);
                        guestNotificationView.addEventListener('click', function (e){
                            WindowManager.openWindow(SettingsWindow.key);
                        });
                    }
                    else {
                        Ti.API.debug("Yes guestNotificationView");
                        contentLayer.add(guestNotificationView);
                        guestNotificationView.show();
                    }
                }
                
                if (Portal.getPortlets().length > 0) {
                    Ti.API.debug("Portal.getPortlets().length is greater than 0: " + Portal.getPortlets().length);
                    if (portalView) { contentLayer.remove(portalView); }
                    portalView = Ti.UI.createScrollView(Styles.homeGrid);
                	portalView.height = isGuestLayout ? win.height - titleBar.height - Styles.homeGuestNote.height : win.height - titleBar.height;
                    contentLayer.add(portalView);
                    drawHomeGrid(Portal.getPortlets());
                }
                else {
                    Ti.API.debug("Portal.getPortlets().length is NOT greater than 0: " + Portal.getPortlets().length);
                }
            }
        }
        else {
            Ti.API.error("No win exists in PortalWindowController>createPortalView()");
        }
    };


    drawHomeGrid = function (portlets) {
        var completeWidth, completeHeight, numColumns, leftPadding;
        Ti.API.debug("Preparing to iterate through portlets in drawHomeGrid: " + portlets.length);
        
        completeWidth = Styles.gridItem.width + 2 * Styles.gridItem.padding;
        completeHeight = Styles.gridItem.width + 2 * Styles.gridItem.padding;
        numColumns = Math.floor(Ti.Platform.displayCaps.platformWidth / completeWidth);
        leftPadding = Math.floor(((Ti.Platform.displayCaps.platformWidth - (completeWidth * numColumns))) / 2);
        
        for (var i=0, iLength = portlets.length; i<iLength; i++ ) {
            var _portlet, top, left, gridItem, gridItemLabel, gridItemIconDefaults, gridItemIcon, gridBadgeBackground, gridBadgeNumber;
            _portlet = portlets[i];
            
            // Calculate the position for this grid item
            top = Styles.gridItem.padding + Math.floor(i / numColumns) * completeHeight;
            left = leftPadding + Styles.gridItem.padding + (i % numColumns) * completeWidth;

            // Create the container for the grid item
            var gridItemDefaults = Styles.gridItem;
            gridItemDefaults.top = top;
            gridItemDefaults.left = left;
            gridItem = Ti.UI.createView(gridItemDefaults);
            
            gridItem.portlet = _portlet;

            //Add a label to the grid item
            if (_portlet.title) {
                var gridItemLabelDefaults = Styles.gridItemLabel;
                gridItemLabelDefaults.text =  _portlet.title.toLowerCase();
                gridItemLabel = Ti.UI.createLabel(gridItemLabelDefaults);
                gridItem.add(gridItemLabel);                
            }

            //Add an icon to the grid item
            gridItemIconDefaults = Styles.gridIcon;
            gridItemIconDefaults.image = Portal.getIconUrl(_portlet);
            gridItemIcon = Ti.UI.createImageView(gridItemIconDefaults);
            gridItemIcon.portlet = _portlet;
            gridItem.add(gridItemIcon);

            // if the module has a new item count of more than zero (no new items)
            // add a badge number to the home screen icon
            if (_portlet.newItemCount > 0) {
                var gridBadgeBackgroundDefaults = Styles.gridBadgeBackground;
                gridBadgeBackground = Ti.UI.createImageView(gridBadgeBackgroundDefaults);
                gridItem.add(gridBadgeBackground);

                var gridBadgeNumberDefaults = Styles.gridBadgeNumber;
                gridBadgeNumberDefaults.text = _portlet.newItemCount;
                gridBadgeNumber = Ti.UI.createLabel(gridBadgeNumberDefaults);
                gridItem.add(gridBadgeNumber);
            }

            //Place the item in the scrollview and listen for singletaps
            portalView.add(gridItem);
            gridItemIcon.addEventListener("singletap", onGridItemClick);
            gridItemIcon.addEventListener("touchstart", onGridItemPressDown);
            gridItemIcon.addEventListener(Device.isAndroid() ? 'touchcancel' : 'touchend', onGridItemPressUp);
        }
        Ti.API.info("Done placing portlets");
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
    
    //PortalProxy events
    onGettingPortlets = function (e) {
        Ti.API.debug("onGettingPortlets() in PortalWindowController");
        // Display a loading indicator until we can finish downloading the user
        // layout and creating the initial view
    };
    
    onPortletsLoaded = function (e) {
        if (win && win.visible) {
            createPortalView();
        }
    };
    
    onPortalProxyNetworkError = function (e) {
        //This event responds to any type of error in retrieving portlets from the sever.
        Ti.UI.createAlertDialog({ title: LocalDictionary.error,
            message: e.message, buttonNames: [LocalDictionary.OK]
            }).show();
    };
    
    onAppWindowOpened = function (e) {
        if (activityIndicator) {
            activityIndicator.hide();
        }
    };
    
    onAppWindowOpening = function (e) {
        if (win && win.visible && activityIndicator) {
            activityIndicator.setLoadingMessage(LocalDictionary.loading);
            activityIndicator.show();
        }
    };
    
    if(!initialized) {
        init();
    }
};