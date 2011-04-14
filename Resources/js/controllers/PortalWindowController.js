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

var win = Titanium.UI.currentWindow,
    app = win.app,
    portalView, portletView, portalGridView, createPortalView,
    drawHomeGrid, drawAndroidGrid, drawiOSGrid, getShowPortletFunc, getIconUrl, onGridItemPressUp, showSettings, getPortletsForUser,
    onCredentialUpdate,
    pathToRoot = '../../';

createPortalView = function () {
    if (portalView) {
        Ti.API.debug("Removing the existing portal home view");
        win.remove(portalView);
    }
    
    

    Ti.API.debug("Creating a new portal home view");
	portalView = Titanium.UI.createView(app.styles.homeGrid);

	var titleBar = new app.views.GenericTitleBar({
	    app: app,
	    windowKey: 'home',
	    title:app.localDictionary.uMobile,
	    settingsButton: true,
	    homeButton: false
	});
	win.add(titleBar);
    win.add(portalView);

    win.app.UPM.establishSession({ onsuccess: getPortletsForUser, onauthfailure: showSettings });

    Ti.App.addEventListener('credentialUpdate', onCredentialUpdate);

    win.initialized = true;
};

getShowPortletFunc = function (portlet) {
    return function () {
        if (portlet.url) {
            Titanium.App.fireEvent('showPortlet', portlet);
        } else {
            Titanium.App.fireEvent(
                'showWindow', 
                {
                    oldWindow: 'home',
                    newWindow: portlet.window
                }
            );
        }
    };
};

var sortPortlets = function(a, b) {

    // get the values for the configured property from 
    // each object and transform them to lower case
    var aprop = a.title.toLowerCase();
    var bprop = b.title.toLowerCase();

    // if the values are identical, indicate an equals
    if (aprop === bprop) {
        return 0;
    }

    // otherwise perform a normal alphabetic sort
    if (aprop > bprop) {
        return 1;
    } else {
        return -1;
    }

};

getIconUrl = function (p) {
    var _iconUrl;

    if (p.iconUrl && p.iconUrl.indexOf('/') == 0) {
        _iconUrl = win.app.UPM.BASE_PORTAL_URL + p.iconUrl;
    } 
    else if (p.iconUrl) {
        _iconUrl = pathToRoot + p.iconUrl;
    } 
    else {
        _iconUrl = win.app.UPM.BASE_PORTAL_URL + '/ResourceServingWebapp/rs/tango/0.8.90/32x32/categories/applications-other.png';
    }

    return _iconUrl;
};


drawHomeGrid = function (portlets) {
    Ti.API.debug("Preparing to iterate through portlets in drawAndroidGrid");
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
        gridItemIconDefaults.image = getIconUrl(_portlet);
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
        gridItem.addEventListener("singletap", getShowPortletFunc(_portlet));
        gridItem.addEventListener("touchstart", onGridItemPressDown);
        gridItem.addEventListener("touchend", onGridItemPressUp);
    }
};

getPortletsForUser = function(onload) {
    var portlets;

    // Display a loading indicator until we can finish downloading the user
    // layout and creating the initial view
    win.add(app.views.GlobalActivityIndicator);
    app.views.GlobalActivityIndicator.message = app.localDictionary.loading;
    app.views.GlobalActivityIndicator.show();

    // Get the module list for this user from the portal server and create a 
    // layout based on this list.
    portlets = app.UPM.getPortletList();
    app.lastUpdate = new Date();
    drawHomeGrid(portlets);
    
    // Remove our loading indicator
    app.views.GlobalActivityIndicator.hide();

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

onCredentialUpdate = function (e) {
    createPortalView();
};

onGridItemPressDown = function (e) {
    e.source.opacity = app.styles.gridItem.pressOpacity;
};

onGridItemPressUp = function (e) {
    e.source.opacity = 1;
};

createPortalView();