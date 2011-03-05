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

var win, 
	portalView, 
	portalGridView,
	createPortalView,
	drawHomeGrid,
	ICON_WIDTH = 80,
	ICON_HEIGHT = 100,
	NUM_GRID_COLUMNS = 4,
	numGridRows;

win = Titanium.UI.currentWindow;

drawHomeGrid = function () {
	var gridItemArray = UPM.getHomeNav();
	
	for (var i=0,iLength=gridItemArray.length; i<iLength; i++) {
		
		//Create and position grid item in the grid
		var gridItem = Titanium.UI.createView({
			top:(Math.floor(i / NUM_GRID_COLUMNS) * ICON_HEIGHT),
			left:(((i / NUM_GRID_COLUMNS) - Math.floor(i / NUM_GRID_COLUMNS)) * (NUM_GRID_COLUMNS * ICON_WIDTH)),
			height:ICON_HEIGHT,
			width:ICON_WIDTH,
			backgroundColor:"#eee",
			borderColor:"#fff",
			borderWidth:1
		});
		
		//Add a label to the grid item
		var gridItemLabel = Titanium.UI.createLabel({
			textAlign:"center",
			text:gridItemArray[i].label,
			top:(ICON_HEIGHT - 35), //Magic number, consider constant or another approach
			touchEnabled: false
		});
		gridItem.add(gridItemLabel);
		
		//Add an icon to the grid item
		var gridItemIcon = Titanium.UI.createImageView({
			image:gridItemArray[i].icon,
			top:-20 //Magic number, consider constant or another approach
		});
		gridItem.add(gridItemIcon);
		
		//Place the item in the scrollview and listen for clicks
		portalView.add(gridItem);
		// gridItem.addEventListener("click",handleGridItemClick);
		numGridRows=(gridItem.top / ICON_HEIGHT) + 1;
	}
};

createPortalView = function () {
    if (portalView) {
        win.remove(portalView);
    }
	if(UPM.isUserLoggedIn) {
		portalView = Titanium.UI.createScrollView({
			backgroundColor:"#000"
		});
		drawHomeGrid();
	} else {
		portalView = Titanium.UI.createWebView({ 
	        url: UPM.getMainPortalUrl() 
	    });
	}
    win.add(portalView);
};

// initiale the portal web view
createPortalView();

// when user credentials are authenticated, replace the
// existing web view with one referencing the new login URL
Ti.App.addEventListener('credentialUpdate', function (input) {
    createPortalView();
});