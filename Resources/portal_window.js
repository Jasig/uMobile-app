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
Titanium.include('lib.js');
Titanium.include('skin.js');

var win, 
    portalView,
    portletView,
    portalGridView,
    createPortalView,
    drawHomeGrid,
    getShowPortletFunc;

win = Titanium.UI.currentWindow;

createPortalView = function () {
    if (portalView) {
        Ti.API.debug("Removing the existing portal home view");
        win.remove(portalView);
    }

    Ti.API.debug("Creating a new portal home view");
	portalView = Titanium.UI.createScrollView({
		backgroundColor: UPM.HOME_GRID_BACKGROUND_COLOR
	});
	
	var bar = Titanium.UI.createView({
	    backgroundColor: UPM.TITLEBAR_BACKGROUND_COLOR,
        height: UPM.TITLEBAR_HEIGHT,
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
	    image: "icons/tab-settings.png",
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
                    newWindow: 'map'
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
        
        var portlet, top, left, gridItem, gridItemLabel, gridItemIcon;
        
        portlet = portlets[i];
        Ti.API.debug("Adding portlet with title " + portlet.title + " to the home view");
        
        var completeWidth = UPM.HOME_GRID_ITEM_WIDTH + 2 * UPM.HOME_GRID_ITEM_PADDING;
        var completeHeight = UPM.HOME_GRID_ITEM_WIDTH + 2 * UPM.HOME_GRID_ITEM_PADDING;

        // calculate the appropriate number of columns based on the device
        // width and desired item size
        var numColumns = Math.floor(Ti.Platform.displayCaps.platformWidth / completeWidth);
        
        // calculate extra left padding to add to center the item grid
        var leftPadding = Math.floor(((Ti.Platform.displayCaps.platformWidth - (completeWidth * numColumns))) / 2);

        // Calculate the position for this grid item
        top = UPM.TITLEBAR_HEIGHT + UPM.HOME_GRID_ITEM_PADDING + Math.floor(i / numColumns) * completeHeight;
        left = leftPadding + UPM.HOME_GRID_ITEM_PADDING + (i % numColumns) * completeWidth;
        
        // Create the container for the grid item
        gridItem = Titanium.UI.createView({
            top: top,
            left: left,
            height:UPM.HOME_GRID_ITEM_HEIGHT,
            width:UPM.HOME_GRID_ITEM_WIDTH
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
            top: (UPM.HOME_GRID_ITEM_HEIGHT - 20), //Magic number, consider constant or another approach
            color: UPM.HOME_GRID_TEXT_COLOR,
            touchEnabled: false
        });
        gridItem.add(gridItemLabel);
        
        var iconUrl;
        if (!portlet.url && portlet.iconUrl) {
            iconUrl = portlet.iconUrl;
        } else if (portlet.iconUrl) {
            iconUrl = UPM.BASE_PORTAL_URL + portlet.iconUrl;
        } else {
            iconUrl = UPM.BASE_PORTAL_URL + '/ResourceServingWebapp/rs/tango/0.8.90/32x32/categories/applications-other.png';
        }
        
        //Add an icon to the grid item
        gridItemIcon = Titanium.UI.createImageView({
            image: iconUrl,
            height: UPM.HOME_GRID_ICON_HEIGHT,
            width: UPM.HOME_GRID_ICON_WIDTH
        });
        gridItem.add(gridItemIcon);
        
        //Place the item in the scrollview and listen for singletaps
        portalView.add(gridItem);
        gridItem.addEventListener("singletap", getShowPortletFunc(portlet));
        
    }
};

createPortalView();

var getPortletsForUser = function(onload) {
    var loader = Titanium.Network.createHTTPClient();

    // Sets the HTTP request method, and the URL to get data from  
    var jsonUrl = UPM.BASE_PORTAL_URL + UPM.PORTAL_CONTEXT + "/api/layoutDoc.json";
    Ti.API.info(jsonUrl);
    loader.open("GET", jsonUrl);
    
    // Runs the function when the data is ready for us to process  
    loader.onload = function() { 
        var layout = eval('('+this.responseText+')').layout;
        for (var i = 0; i < UPM.LOCAL_MODULES.length; i++) {
            layout.push(UPM.LOCAL_MODULES[i]);
        }
        drawHomeGrid(layout);
    };  

    // Send the HTTP request  
    loader.send();

};

UPM.establishSession(getPortletsForUser);

Ti.App.addEventListener('credentialUpdate', function(e){
    createPortalView();
    UPM.establishSession(getPortletsForUser);
});
