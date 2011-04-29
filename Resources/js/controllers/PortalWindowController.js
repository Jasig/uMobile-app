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

// library includes
(function(){
    var win = Titanium.UI.currentWindow, app = win.app, loginProxy,
        portalView, portletView, portalGridView, activityIndicator, pressedItem,
        init, createPortalView, drawHomeGrid, drawAndroidGrid, drawiOSGrid, showSettings,
        onGridItemPressUp, onGettingPortlets, onPortletsLoaded, onWindowFocus, 
        pathToRoot = '../../';

    init = function () {
        var titleBar = new app.views.GenericTitleBar({
    	    app: app,
    	    windowKey: 'home',
    	    title: app.localDictionary.uMobile,
    	    settingsButton: true,
    	    homeButton: false
    	});
    	win.add(titleBar);

    	activityIndicator = app.views.GlobalActivityIndicator;
        win.add(activityIndicator);

        loginProxy = app.models.loginProxy;

    	createPortalView();
    	
    	Ti.App.addEventListener("PortalProxyGettingPortlets", onGettingPortlets);
    	Ti.App.addEventListener("PortalProxyPortletsLoaded", onPortletsLoaded);
        Ti.App.addEventListener('PortalProxyNetworkError', onPortalProxyNetworkError);
    	win.addEventListener('focus', onWindowFocus);

    	win.initialized = true;
    };

    createPortalView = function () {
        if (portalView) {
            Ti.API.debug("Removing the existing portal home view");
            win.remove(portalView);
        }

        Ti.API.debug("Creating a new portal home view");
    	portalView = Titanium.UI.createScrollView(app.styles.homeGrid);

        win.add(portalView);
        
        // if(!loginProxy.isValidNetworkSession) {
           loginProxy.establishNetworkSession();
        // }
        //         else {
        //             Ti.API.info("No need to login, a session already exists.");
        //         }
        
        Ti.App.addEventListener('EstablishNetworkSessionSuccess', app.models.portalProxy.getPortletsForUser);
        Ti.App.addEventListener('EstablishNetworkSessionFailure', showSettings);
    };


    drawHomeGrid = function (portlets) {
        Ti.API.debug("Preparing to iterate through portlets in drawHomeGrid: " + portlets.length);
        for (var i=0, iLength = portlets.length; i<iLength; i++ ) {
            Ti.API.debug("Portlet iteration " + i + ", " + portlets[i].title);
            var _portlet, top, left, gridItem, gridItemLabel, gridItemIcon, gridBadgeBackground, gridBadgeNumber;
            _portlet = portlets[i];

            var completeWidth = app.styles.gridItem.width + 2 * app.styles.gridItem.padding;
            var completeHeight = app.styles.gridItem.width + 2 * app.styles.gridItem.padding;

            // calculate the appropriate number of columns based on the device
            // width and desired item size
            var numColumns = Math.floor(Ti.Platform.displayCaps.platformWidth / completeWidth);

            // calculate extra left padding to add to center the item grid
            var leftPadding = Math.floor(((Ti.Platform.displayCaps.platformWidth - (completeWidth * numColumns))) / 2);

            // Calculate the position for this grid item
            top = app.styles.gridItem.padding + Math.floor(i / numColumns) * completeHeight;
            left = leftPadding + app.styles.gridItem.padding + (i % numColumns) * completeWidth;

            // Create the container for the grid item
            var gridItemDefaults = app.styles.gridItem;
            gridItemDefaults.top = top;
            gridItemDefaults.left = left;
            gridItem = Titanium.UI.createView(gridItemDefaults);

            //Add a label to the grid item
            var gridItemLabelDefaults = app.styles.gridItemLabel;
            gridItemLabelDefaults.text =  _portlet.title.toLowerCase();
            gridItemLabel = Titanium.UI.createLabel(gridItemLabelDefaults);
            gridItem.add(gridItemLabel);

            //Add an icon to the grid item
            gridItemIconDefaults = app.styles.gridIcon;
            gridItemIconDefaults.image = app.models.portalProxy.getIconUrl(_portlet);
            gridItemIcon = Titanium.UI.createImageView(gridItemIconDefaults);
            gridItem.add(gridItemIcon);


            // if the module has a new item count of more than zero (no new items)
            // add a badge number to the home screen icon
            if (_portlet.newItemCount > 0) {
                var gridBadgeBackgroundDefaults = app.styles.gridBadgeBackground;
                gridBadgeBackgroundDefaults.image = "../../icons/badgeBackground.png";
                gridBadgeBackground = Titanium.UI.createImageView(gridBadgeBackgroundDefaults);
                gridItem.add(gridBadgeBackground);

                var gridBadgeNumberDefaults = app.styles.gridBadgeNumber;
                gridBadgeNumberDefaults.text = _portlet.newItemCount;
                gridBadgeNumber = Titanium.UI.createLabel(gridBadgeNumberDefaults);
                gridItem.add(gridBadgeNumber);
            }

            Ti.API.debug("Placing the portlet in the portalView");
            //Place the item in the scrollview and listen for singletaps
            portalView.add(gridItem);
            gridItem.addEventListener("singletap", app.models.portalProxy.getShowPortletFunc(_portlet));
            gridItem.addEventListener("touchstart", onGridItemPressDown);
            gridItem.addEventListener(Ti.Platform.osname === 'android' ? 'touchcancel' : 'touchend', onGridItemPressUp);
        }
        
        activityIndicator.hideAnimate();
    };



    showSettings = function() {
        Ti.App.fireEvent(
            'showWindow', 
            {
                oldWindow: 'home',
                newWindow: 'settings',
                transition: Titanium.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT 
            }
        );
    };

    onGridItemPressDown = function (e) {
        Ti.API.debug("Home button pressed down");
        if(Ti.Platform.osname === 'iphone') {
            e.source.opacity = app.styles.gridItem.pressOpacity;
        }
        else {
            Ti.API.debug("Not setting opacity of icon because Android doesn't support it.");
        }
    };

    onGridItemPressUp = function (e) {
        Ti.API.debug("Home button pressed up");
        if(Ti.Platform.osname === 'iphone') {
            e.source.setOpacity(1.0);
        }
        else {
            Ti.API.debug("onGridItemPressUp condition wasn't met");
        }
    };
    
    onWindowFocus = function (e) {
        Ti.API.debug("PortalWindowController has gained focus.");
    };
    
    //PortalProxy events
    onGettingPortlets = function (e) {
        // Display a loading indicator until we can finish downloading the user
        // layout and creating the initial view
        activityIndicator.loadingMessage(app.localDictionary.loading);
        activityIndicator.resetDimensions();
        activityIndicator.showAnimate();
    };
    
    onPortletsLoaded = function (e) {
        drawHomeGrid(app.models.portalProxy.getPortlets());
    };
    
    onPortalProxyNetworkError = function (e) {
        //This event responds to any type of error in retrieving portlets from the sever.
        Titanium.UI.createAlertDialog({ title: app.localDictionary.error,
            message: e.message, buttonNames: [app.localDictionary.OK]
            }).show();
    };
    
    if(!win.initialized) {
        init();
    }
})();