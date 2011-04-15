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
    portalView, portletView, portalGridView, activityIndicator,
    init, createPortalView, drawHomeGrid, drawAndroidGrid, drawiOSGrid, getShowPortletFunc, getIconUrl, showSettings, getPortletsForUser,
    onGridItemPressUp, onCredentialUpdate,
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
    
	createPortalView();
	
	win.initialized = true;
};

createPortalView = function () {
    if (portalView) {
        Ti.API.debug("Removing the existing portal home view");
        win.remove(portalView);
    }
    
    Ti.API.debug("Creating a new portal home view");
	portalView = Titanium.UI.createView(app.styles.homeGrid);

    win.add(portalView);
    
    app.models.loginProxy.establishSession({ onsuccess: getPortletsForUser, onauthfailure: showSettings });

    Ti.App.addEventListener('credentialUpdate', onCredentialUpdate);
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

/**
 * This method is currently blocking.
 */
getPortletList = function() {
    var layoutUrl, layoutClient, layoutText, portlets;
    
    // Send a request to uPortal's main URL to get a JSON representation of the
    // user layout
    layoutUrl = app.UPM.BASE_PORTAL_URL + app.UPM.PORTAL_CONTEXT;
    layoutClient = Titanium.Network.createHTTPClient();
    layoutClient.open('GET', layoutUrl, false);
    layoutClient.send();

    // uPortal 3.2 isn't capable of sending the layout as JSON, so the response
    // will be an XML document with the appropriate JSON contained in a 
    // "json-layout" element.  Parse this element as JSON and use the data 
    // array as the initial module list.
    // Ti.API.debug("layoutClient XML: " + JSON.stringify(layoutClient.responseXML));
    Ti.API.debug("layoutClient text" + layoutClient.responseText);
    
    if(layoutClient.responseXML.getElementsByTagName('json-layout')) {
        layoutText = layoutClient.responseXML.getElementsByTagName('json-layout').item(0).text;
    }
    else {
        alert("Using hard-coded layout! XML wasn't valid");
        Ti.API.warn("Using hard-coded layout! XML wasn't valid");
        layoutText = '{ "layout": [ { "title": "Welcome", "url": "/uPortal/f/u24l1s5/p/snappy.u24l1n7/max/render.uP", "description": "Mockup image rotator thingy.", "newItemCount": "0", "iconUrl": "/ResourceServingWebapp/rs/tango/0.8.90/32x32/mimetypes/text-html.png" }, { "title": "Google Search", "url": "/uPortal/f/u24l1s5/p/google-portlet.u24l1n8/max/render.uP", "description": "Google Portlet from http://code.google.com/p/googleportlet/", "newItemCount": "0", "iconUrl": "${request.contextPath}/media/skins/icons/google.png" }, { "title": "", "url": "", "description": "The Weather Module allows you to access the latest weather conditions and 5-day forecasts for the cities you select.", "newItemCount": "0", "iconUrl": "/ResourceServingWebapp/rs/tango/0.8.90/32x32/status/weather-few-clouds.png" }, { "title": "Most Popular Apps", "url": "/uPortal/f/u24l1s12/p/popular-portlets.u24l1n14/max/render.uP", "description": "Shows which apps (portlets) have been added by users and how often", "newItemCount": "0", "iconUrl": "/ResourceServingWebapp/rs/tango/0.8.90/32x32/categories/preferences-system.png" }, { "title": "Calendar", "url": "/uPortal/f/u24l1s12/p/calendar.u24l1n16/max/render.uP", "description": "Small monthly calendar.", "newItemCount": "0", "iconUrl": "/ResourceServingWebapp/rs/tango/0.8.90/32x32/mimetypes/x-office-calendar.png" }, { "title": "Bookmarks", "url": "/uPortal/f/u24l1s12/p/pbookmarks.u24l1n17/max/render.uP", "description": "Bookmarks portlet", "newItemCount": "0", "iconUrl": "/ResourceServingWebapp/rs/tango/0.8.90/32x32/mimetypes/x-office-address-book.png" }, { "title": "Student Welcome", "url": "/uPortal/f/u22l1s5/p/student-feature.u22l1n7/max/render.uP", "description": "Student-targeted welcome screen", "newItemCount": "0", "iconUrl": "/ResourceServingWebapp/rs/tango/0.8.90/32x32/mimetypes/image-x-generic.png" }, { "title": "My Notifications", "url": "/uPortal/f/u22l1s5/p/notifications.u22l1n8/max/render.uP", "description": "Mockup notifications portlet.", "newItemCount": "0", "iconUrl": "/ResourceServingWebapp/rs/tango/0.8.90/32x32/apps/preferences-desktop-multimedia.png" }, { "title": "Who\'s Online", "url": "/uPortal/f/u22l1s5/p/whos-online.u22l1n10/max/render.uP", "description": "Mockup of a Who\'s Online portlet.", "newItemCount": "0", "iconUrl": "/ResourceServingWebapp/rs/tango/0.8.90/32x32/mimetypes/text-html.png" }, { "title": "", "url": "", "description": "Course links and announcements", "newItemCount": "0", "iconUrl": "/CoursesPortlet/notepad.png" } ] }';
    }    

    portlets = JSON.parse(layoutText).layout;

    // Add locally-configured modules to the module list.
    for (var i = 0; i < app.UPM.LOCAL_MODULES.length; i++) {
        portlets.push(app.UPM.LOCAL_MODULES[i]);
    }
    return portlets;

};

getPortletsForUser = function(onload) {
    var portlets;

    // Display a loading indicator until we can finish downloading the user
    // layout and creating the initial view
    activityIndicator.message = app.localDictionary.loading;
    activityIndicator.resetDimensions();
    activityIndicator.show();

    // Get the module list for this user from the portal server and create a 
    // layout based on this list.
    portlets = getPortletList();
    app.lastUpdate = new Date();
    drawHomeGrid(portlets);
    
    // Remove our loading indicator
    activityIndicator.hide();

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
if(!win.initialized) {
    init();
}