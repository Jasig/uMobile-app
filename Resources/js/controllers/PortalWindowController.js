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

var win, 
    portalView,
    portletView,
    portalGridView,
    createPortalView,
    drawHomeGrid,
    getShowPortletFunc,
    pathToRoot = '../../';

win = Titanium.UI.currentWindow;

createPortalView = function () {
    if (portalView) {
        Ti.API.debug("Removing the existing portal home view");
        win.remove(portalView);
    }

    Ti.API.debug("Creating a new portal home view");
	portalView = Titanium.UI.createScrollView({
		backgroundColor: win.app.UPM.HOME_GRID_BACKGROUND_COLOR
	});
	
	var bar = Titanium.UI.createView({
	    backgroundColor: win.app.UPM.TITLEBAR_BACKGROUND_COLOR,
        height: win.app.UPM.TITLEBAR_HEIGHT,
        top: 0
    });
	var title = Titanium.UI.createLabel({
        textAlign: "center",
        text: "uMobile",
        color: "#fff",
        font: { fontWeight: "bold" }
    });
	bar.add(title);
	var settingsButton = Titanium.UI.createImageView({
	    height: 18,
	    width: 18,
	    image: pathToRoot + "icons/tab-settings.png",
	    left: Ti.Platform.displayCaps.platformWidth - 28
	});
	bar.add(settingsButton);
	portalView.add(bar);
	
    win.add(portalView);
    
    settingsButton.addEventListener('singletap', function (e) {
        Ti.App.fireEvent(
            'showWindow', 
            {
                oldWindow: 'home',
                newWindow: 'settings',
                transition: Titanium.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT 
            }
        );
    });

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

drawHomeGrid = function(portlets) {
    
    Ti.API.debug("Preparing to add " + portlets.length + " portlets to the home view");
    
    portlets.sort(sortPortlets);

    for (var i=0, iLength=portlets.length; i<iLength; i++) {
        
        var portlet, top, left, gridItem, gridItemLabel, gridItemIcon, gridBadgeBackground, gridBadgeNumber;
        
        portlet = portlets[i];
        Ti.API.debug("Adding portlet with title " + portlet.title + " to the home view");
        
        var completeWidth = win.app.UPM.HOME_GRID_ITEM_WIDTH + 2 * win.app.UPM.HOME_GRID_ITEM_PADDING;
        var completeHeight = win.app.UPM.HOME_GRID_ITEM_WIDTH + 2 * win.app.UPM.HOME_GRID_ITEM_PADDING;

        // calculate the appropriate number of columns based on the device
        // width and desired item size
        var numColumns = Math.floor(Ti.Platform.displayCaps.platformWidth / completeWidth);
        
        // calculate extra left padding to add to center the item grid
        var leftPadding = Math.floor(((Ti.Platform.displayCaps.platformWidth - (completeWidth * numColumns))) / 2);

        // Calculate the position for this grid item
        top = win.app.UPM.TITLEBAR_HEIGHT + win.app.UPM.HOME_GRID_ITEM_PADDING + Math.floor(i / numColumns) * completeHeight;
        left = leftPadding + win.app.UPM.HOME_GRID_ITEM_PADDING + (i % numColumns) * completeWidth;
        
        // Create the container for the grid item
        gridItem = Titanium.UI.createView({
            top: top,
            left: left,
            height: win.app.UPM.HOME_GRID_ITEM_HEIGHT,
            width: win.app.UPM.HOME_GRID_ITEM_WIDTH
        });
        
        //Add a label to the grid item
        gridItemLabel = Titanium.UI.createLabel({
            textAlign: "center",
            text: portlet.title.toLowerCase(),
            shadowColor: "#fff",
            shadowOffset: { x:0 , y:1 },
            font: { 
                fontSize: 12
            },
            top: (win.app.UPM.HOME_GRID_ITEM_HEIGHT - 20), //Magic number, consider constant or another approach
            color: win.app.UPM.HOME_GRID_TEXT_COLOR,
            touchEnabled: false
        });
        gridItem.add(gridItemLabel);
        
        var iconUrl;
        if (!portlet.url && portlet.iconUrl) {
            iconUrl = pathToRoot + portlet.iconUrl;
        } else if (portlet.iconUrl) {
            iconUrl = win.app.UPM.BASE_PORTAL_URL + portlet.iconUrl;
        } else {
            iconUrl = win.app.UPM.BASE_PORTAL_URL + '/ResourceServingWebapp/rs/tango/0.8.90/32x32/categories/applications-other.png';
        }
        
        //Add an icon to the grid item
        gridItemIcon = Titanium.UI.createImageView({
            image: iconUrl,
            height: win.app.UPM.HOME_GRID_ICON_HEIGHT,
            width: win.app.UPM.HOME_GRID_ICON_WIDTH
        });
        gridItem.add(gridItemIcon);
        
        // TODO: hook up to actual badge icon service
        if (portlet.title == 'Blackboard') {
            Ti.API.info("blackboard");
            gridBadgeBackground = Titanium.UI.createImageView({
                image: "../../icons/badgeBackground.png",
                top: win.app.UPM.HOME_GRID_ITEM_PADDING+5, //Magic number, consider constant or another approach
                right: win.app.UPM.HOME_GRID_ITEM_PADDING+5,
                height: 20,
                width: 20
            });
            gridItem.add(gridBadgeBackground);
            gridBadgeNumber = Titanium.UI.createLabel({
                textAlign: "center",
                color: "#fff",
                text: "1",
                height: 16,
                width: 16,
                font: { 
                    fontSize: 12,
                    fontWeight: "bold"
                },
                top: win.app.UPM.HOME_GRID_ITEM_PADDING+6, //Magic number, consider constant or another approach
                right: win.app.UPM.HOME_GRID_ITEM_PADDING+7,
                touchEnabled: false
            });
            gridItem.add(gridBadgeNumber);
        }
        
        //Place the item in the scrollview and listen for singletaps
        portalView.add(gridItem);
        gridItem.addEventListener("singletap", getShowPortletFunc(portlet));
        
    }
    win.initialized = true;
};

createPortalView();

var getPortletsForUser = function(onload) {
    var loader = Titanium.Network.createHTTPClient();

    // Sets the HTTP request method, and the URL to get data from  
    var jsonUrl = win.app.UPM.BASE_PORTAL_URL + win.app.UPM.PORTAL_CONTEXT + "/api/layoutDoc.json";
    Ti.API.info(jsonUrl);
    loader.open("GET", jsonUrl);
    
    // Runs the function when the data is ready for us to process  
    loader.onload = function() { 
        var layout = eval('('+this.responseText+')').layout;
        for (var i = 0; i < win.app.UPM.LOCAL_MODULES.length; i++) {
            layout.push(win.app.UPM.LOCAL_MODULES[i]);
        }
        drawHomeGrid(layout);
    };  

    // Send the HTTP request  
    loader.send();

};

win.app.UPM.establishSession(getPortletsForUser);

Ti.App.addEventListener('credentialUpdate', function(e){
    createPortalView();
    win.app.UPM.establishSession(getPortletsForUser);
});
