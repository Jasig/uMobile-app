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

/* map_window.js contains setup information for the
 * map tab.
 */

// library includes
Titanium.include('lib.js');
Titanium.include('skin.js');
Titanium.include('js/MapService.js');


var win, 
    mapView, 
    createTitleBar, 
    createMapView,
    mapPoints = [], 
    loadPointDetail, 
    rawAnnotations = [],
    loadingIndicator;

win = Titanium.UI.currentWindow;

loadPointDetail = function (point) {
    var pointDetailWindow, bar, animation, details = [], detailTable;
    Ti.API.info('loadPointDetail()');
    
    pointDetailWindow = Titanium.UI.createWindow({
        title : point.title
    });

    detailTable = Titanium.UI.createTableView();
    if (point.abbreviation) {
        detailTable.appendRow(Titanium.UI.createTableViewRow({title: point.abbreviation}));
    }
    pointDetailWindow.add(detailTable);
    
    pointDetailWindow.open({
        modal:true,
        modalTransitionStyle: Ti.UI.iPhone.MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL,
        modalStyle: Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET
    });
    
};

createTitleBar = function () {
    var bar, title, homeButton, searchField;
    
    // create the view container for the title bar
    bar = Titanium.UI.createView({
        backgroundColor: UPM.TITLEBAR_BACKGROUND_COLOR,
        top: 0,
        height: UPM.TITLEBAR_HEIGHT
    });    
    win.add(bar);
    searchField = Titanium.UI.createSearchBar({
        backgroundColor : UPM.TITLEBAR_BACKGROUND_COLOR,
        backgroundGradient : {
            type : 'linear',
            startPoint : 0,
            endPoint : UPM.TITLEBAR_HEIGHT,
            colors : ["#000","#000"]
        },
        barColor:UPM.TITLEBAR_BACKGROUND_COLOR,
        height: UPM.TITLEBAR_HEIGHT,
        top:0,
        left:38
    });
    bar.add(searchField);
    searchField.addEventListener('return', function(e){
        Ti.API.info(e.source.value);
        MapService.search(e.source.value);
        searchField.blur();
    });
    
    // add a navigation button to allow users to return to the home screen
    homeButton = Titanium.UI.createImageView({
        image: "icons/tab-home.png",
        height: 18,
        width: 18,
        left: 10
    });
    bar.add(homeButton);

    // add an event listener for the home button
    homeButton.addEventListener('click', function (e) {
        searchField.blur();
        Ti.App.fireEvent(
            'showWindow', 
            {
                oldWindow: 'settings',
                newWindow: 'home'
            }
        );
    });
    
};

createMapView = function () {
    var annotations, buttonBar;

   // create the map view
   mapView = Titanium.Map.createView({
       top: UPM.TITLEBAR_HEIGHT,
       mapType: Titanium.Map.STANDARD_TYPE,
       region:{
           latitude:UPM.DEFAULT_LATITUDE, 
           longitude:UPM.DEFAULT_LONGITUDE, 
           latitudeDelta:0.01, 
           longitudeDelta:0.01
       },
       regionFit:true,
       userLocation:true
   });
   win.add(mapView);
   
   //Initialize the MapService, which manages the data for points on the map, 
   //including retrieval of data and searching array of points
   MapService.init(mapView);

   // create controls for zoomin / zoomout
   // included in Android by default
   if(Titanium.Platform.osname === "iphone") {
       buttonBar = Titanium.UI.createButtonBar({
           labels:['+', '-'], 
           backgroundColor:'#336699', 
           style:Titanium.UI.iPhone.SystemButtonStyle.BAR,
           top: Ti.Platform.displayCaps.platformHeight - 130,
           width: 100,
           height: 25
       });
       mapView.add(buttonBar);

       // add event listeners for the zoom buttons
       buttonBar.addEventListener('click', function (e) {
           if (e.index == 0) {
               mapView.zoom(1);
           } else {
               mapView.zoom(-1);
           }
       });
   }

/*  We'll worry about loading indicators later on. 
    loadingIndicator = Titanium.UI.createActivityIndicator({
       color : "#fff",
       backgroundColor : "#000",
       opacity : 0.75,
       message : "Map is loading"
   });   
   mapView.add(loadingIndicator);
   loadingIndicator.show();*/
};



createTitleBar();
createMapView();
