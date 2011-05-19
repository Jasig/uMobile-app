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



var PortalWindowController = function(facade) {
    var win, app = facade, self = {}, portalProxy, initialized, isGuestLayout = true,
        contentLayer, portalView, portletView, portalGridView, activityIndicator, pressedItem, titleBar, guestNotificationView, guestNotificationLabel,
        init, createPortalView, drawHomeGrid, drawAndroidGrid, drawiOSGrid, 
        onGridItemClick, onGridItemPressUp, onGridItemPressDown,
        onGettingPortlets, onPortletsLoaded, onNetworkSessionSuccess, onNetworkSessionFailure, onPortalProxyNetworkError,
        onWindowFocus, onAppWindowOpening, onAppWindowOpened, 
        pathToRoot = '../../';

    init = function () {
        self.key = 'home';
        
        portalProxy = app.models.portalProxy;
        
    	Ti.App.addEventListener("PortalProxyGettingPortlets", onGettingPortlets);
    	Ti.App.addEventListener("PortalProxyPortletsLoaded", onPortletsLoaded);
        Ti.App.addEventListener('PortalProxyNetworkError', onPortalProxyNetworkError);
        Ti.App.addEventListener('EstablishNetworkSessionSuccess', onNetworkSessionSuccess);
        Ti.App.addEventListener('EstablishNetworkSessionFailure', onNetworkSessionFailure);
        Ti.App.addEventListener('OpeningNewWindow', onAppWindowOpening);
        Ti.App.addEventListener('NewWindowOpened', onAppWindowOpened);

    	initialized = true;
    };
    
    self.open = function () {
        Ti.API.debug("open() in PortalWindowController");
        if (!win || Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
            Ti.API.debug("Create and open the portal window");
            //We want to create a new window and redraw the whole UI each time on iOS
            win = Titanium.UI.createWindow({
                exitOnClose: false,
                navBarHidden: true,
                fullScreen: false
            });
            win.open();
        }
        else if (win && !win.visible) {
            Ti.API.debug("Just show the portal window");
            win.show();
        }
        createPortalView();
    };
    
    self.close = function () {
        if (win && (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad')) {
            win.close();
        }
        else if (win) {
            win.hide();
        }
    };

    createPortalView = function () {
        if (win) {
            if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
                Ti.API.debug("Platform is iOS in createPortalView() in PortalWindowController");
                titleBar = app.UI.createTitleBar({
            	    title: app.localDictionary.jasig11,
            	    settingsButton: true,
            	    homeButton: false
            	});
            	win.add(titleBar);
            	
            	contentLayer = Titanium.UI.createView(app.styles.portalContentLayer);
                win.add(contentLayer);
                
                activityIndicator = app.UI.createActivityIndicator();
                win.add(activityIndicator);
                activityIndicator.show();
                
                Ti.API.debug("Creating a new portal home view");
            	portalView = Titanium.UI.createScrollView(app.styles.homeGrid);
            	portalView.height = isGuestLayout ? win.height - titleBar.height - app.styles.homeGuestNote.height : win.height - titleBar.height;
                contentLayer.add(portalView);
                
                if (isGuestLayout) {
                    guestNotificationView = Ti.UI.createView(app.styles.homeGuestNote);
                    guestNotificationView.top = win.height - titleBar.height - app.styles.homeGuestNote.height;
                    guestNotificationLabel = Ti.UI.createLabel(app.styles.homeGuestNoteLabel);
                    guestNotificationLabel.text = app.localDictionary.viewingGuestLayout;
                    guestNotificationView.add(guestNotificationLabel);
                    contentLayer.add(guestNotificationView);

                    guestNotificationView.addEventListener('click', function (e){
                        app.models.windowManager.openWindow(app.controllers.settingsWindowController.key);
                    });
                }
                
                if (portalProxy.getPortlets().length > 0) {
                    drawHomeGrid(portalProxy.getPortlets());
                }
            }
            else if (Ti.Platform.osname === 'android') {
                Ti.API.debug("Platform is Android in createPortalView() in PortalWindowController");
                if (!titleBar) {
                    Ti.API.debug("Creating and adding titleBar");
                    titleBar = app.UI.createTitleBar({
                	    title: app.localDictionary.jasig11,
                	    settingsButton: true,
                	    homeButton: false
                	});
                	win.add(titleBar);
                }
                
                if (!contentLayer) {
                    Ti.API.debug("Creating and adding contentLayer");
                    contentLayer = Titanium.UI.createView(app.styles.portalContentLayer);
                    win.add(contentLayer);
                }
                
                if (!activityIndicator) {
                    Ti.API.debug("Creating and adding activityIndicator");
                    activityIndicator = app.UI.createActivityIndicator();
                    win.add(activityIndicator);
                }
                activityIndicator.show();
                
                if (!portalView) {
                    Ti.API.debug("Creating and adding portalView");
                    portalView = Titanium.UI.createScrollView(app.styles.homeGrid);
                	portalView.height = isGuestLayout ? win.height - titleBar.height - app.styles.homeGuestNote.height : win.height - titleBar.height;
                    contentLayer.add(portalView);
                }
                
                if (isGuestLayout) {
                    Ti.API.debug("Creating and adding Guest Layout Note");
                    if (!guestNotificationView) {
                        Ti.API.debug("No guestNotificationView...");
                        guestNotificationView = Ti.UI.createView(app.styles.homeGuestNote);
                        guestNotificationView.top = win.height - titleBar.height - app.styles.homeGuestNote.height;
                        guestNotificationLabel = Ti.UI.createLabel(app.styles.homeGuestNoteLabel);
                        guestNotificationLabel.text = app.localDictionary.viewingGuestLayout;
                        guestNotificationView.add(guestNotificationLabel);
                        contentLayer.add(guestNotificationView);
                        guestNotificationView.addEventListener('click', function (e){
                            app.models.windowManager.openWindow(app.controllers.settingsWindowController.key);
                        });
                    }
                    else {
                        Ti.API.debug("Yes guestNotificationView");
                        contentLayer.add(guestNotificationView);
                        guestNotificationView.show();
                    }
                }
                
                if (portalProxy.getPortlets().length > 0) {
                    Ti.API.debug("portalProxy.getPortlets().length is greater than 0: " + portalProxy.getPortlets().length);
                    if (portalView) { contentLayer.remove(portalView); }
                    portalView = Titanium.UI.createScrollView(app.styles.homeGrid);
                	portalView.height = isGuestLayout ? win.height - titleBar.height - app.styles.homeGuestNote.height : win.height - titleBar.height;
                    contentLayer.add(portalView);
                    drawHomeGrid(portalProxy.getPortlets());
                }
                else {
                    Ti.API.debug("portalProxy.getPortlets().length is NOT greater than 0: " + portalProxy.getPortlets().length);
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
        
        completeWidth = app.styles.gridItem.width + 2 * app.styles.gridItem.padding;
        completeHeight = app.styles.gridItem.width + 2 * app.styles.gridItem.padding;
        numColumns = Math.floor(Ti.Platform.displayCaps.platformWidth / completeWidth);
        leftPadding = Math.floor(((Ti.Platform.displayCaps.platformWidth - (completeWidth * numColumns))) / 2);
        
        for (var i=0, iLength = portlets.length; i<iLength; i++ ) {
            var _portlet, top, left, gridItem, gridItemLabel, gridItemIconDefaults, gridItemIcon, gridBadgeBackground, gridBadgeNumber;
            _portlet = portlets[i];
            
            // Calculate the position for this grid item
            top = app.styles.gridItem.padding + Math.floor(i / numColumns) * completeHeight;
            left = leftPadding + app.styles.gridItem.padding + (i % numColumns) * completeWidth;

            // Create the container for the grid item
            var gridItemDefaults = app.styles.gridItem;
            gridItemDefaults.top = top;
            gridItemDefaults.left = left;
            gridItem = Titanium.UI.createView(gridItemDefaults);
            
            gridItem.portlet = _portlet;

            //Add a label to the grid item
            if (_portlet.title) {
                var gridItemLabelDefaults = app.styles.gridItemLabel;
                gridItemLabelDefaults.text =  _portlet.title.toLowerCase();
                gridItemLabel = Titanium.UI.createLabel(gridItemLabelDefaults);
                gridItem.add(gridItemLabel);                
            }

            //Add an icon to the grid item
            gridItemIconDefaults = app.styles.gridIcon;
            gridItemIconDefaults.image = app.models.portalProxy.getIconUrl(_portlet);
            gridItemIcon = Titanium.UI.createImageView(gridItemIconDefaults);
            gridItemIcon.portlet = _portlet;
            gridItem.add(gridItemIcon);

            // if the module has a new item count of more than zero (no new items)
            // add a badge number to the home screen icon
            if (_portlet.newItemCount > 0) {
                var gridBadgeBackgroundDefaults = app.styles.gridBadgeBackground;
                gridBadgeBackground = Titanium.UI.createImageView(gridBadgeBackgroundDefaults);
                gridItem.add(gridBadgeBackground);

                var gridBadgeNumberDefaults = app.styles.gridBadgeNumber;
                gridBadgeNumberDefaults.text = _portlet.newItemCount;
                gridBadgeNumber = Titanium.UI.createLabel(gridBadgeNumberDefaults);
                gridItem.add(gridBadgeNumber);
            }

            //Place the item in the scrollview and listen for singletaps
            portalView.add(gridItem);
            gridItemIcon.addEventListener("singletap", onGridItemClick);
            gridItemIcon.addEventListener("touchstart", onGridItemPressDown);
            gridItemIcon.addEventListener(Ti.Platform.osname === 'android' ? 'touchcancel' : 'touchend', onGridItemPressUp);
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
        portalProxy.getPortletsForUser();
    };
    
    onNetworkSessionFailure = function(e) {
        Ti.API.debug("onNetworkSessionFailure() in PortalWindowController");
        if (e.user && e.user === 'guest') {
            isGuestLayout = true;
            portalProxy.getPortletsForUser();
        }
        else {
            isGuestLayout = false;
        }
    };
    
    onGridItemClick = function (e) {
        var func;
        Ti.API.debug("onGridItemClick() in PortalWindowController " + JSON.stringify(e.source.portlet));
        if (e.source.portlet) {
            func = app.models.portalProxy.getShowPortletFunc(e.source.portlet);
            func();
        }
        else {
            Ti.API.error("No portlet was attached to the icon.");
        }
    };

    onGridItemPressDown = function (e) {
        Ti.API.debug("Home button pressed down, source: " + e.source.type);
        if(Ti.Platform.osname === 'iphone') {
            if (e.source.type === 'gridIcon') {
                e.source.getParent().opacity = app.styles.gridItem.pressOpacity;
            }
            else {
                e.source.opacity = app.styles.gridItem.pressOpacity;
            }
        }
        else {
            Ti.API.debug("Not setting opacity of icon because Android doesn't support it.");
        }
    };

    onGridItemPressUp = function (e) {
        Ti.API.debug("Home button pressed up");
        if(Ti.Platform.osname === 'iphone') {
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
        Titanium.UI.createAlertDialog({ title: app.localDictionary.error,
            message: e.message, buttonNames: [app.localDictionary.OK]
            }).show();
    };
    
    onAppWindowOpened = function (e) {
        if (activityIndicator) {
            activityIndicator.hide();
        }
    };
    
    onAppWindowOpening = function (e) {
        if (win && win.visible && activityIndicator) {
            activityIndicator.setLoadingMessage(app.localDictionary.loading);
            activityIndicator.show();
        }
    };
    
    if(!initialized) {
        init();
    }
    
    return self;
};