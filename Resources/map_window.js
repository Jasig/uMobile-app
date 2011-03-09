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


var win, 
    mapView, 
    createTitleBar, 
    createMapView, 
    mapService = {}, 
    mapPoints = [], 
    loadPointDetail, 
    rawAnnotations = [],
    loadingIndicator;

win = Titanium.UI.currentWindow;

loadPointDetail = function (point) {
    var pointDetailWindow, bar, animation, details = [], detailTable;
    
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
    searchField.addEventListener('change', function(e){
        Ti.API.info(e.source.value);
        mapService.search(e.source.value);
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

   // create controls for zoomin / zoomout
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

   loadingIndicator = Titanium.UI.createActivityIndicator({
       color : "#fff",
       backgroundColor : "#000",
       opacity : 0.75,
       message : "Map is loading"
   });   
   mapView.add(loadingIndicator);
   loadingIndicator.show();
};





mapService.search = function (query, opts) {
    var searchBusy;
    query = query.toLowerCase();
    
    //If a search isn't already executing
    if(!searchBusy) {
        searchBusy = true;
        mapPoints = [];
        for (var i=0, iLength = rawAnnotations.length; i<iLength; i++) {
            if (rawAnnotations[i].title.toLowerCase().search(query) != -1) {
                mapPoints.push(Titanium.Map.createAnnotation(rawAnnotations[i]));
            }
        }
        mapView.annotations = mapPoints;
    }
    searchBusy = false;
};
mapService.updateMapPoints = function (filters) {
    //Default returns all points for an institution.
    //Can be filtered by campus, admin-defined categories
    if (!mapService.pointCache) {
        loadingIndicator.show();
        request = Titanium.Network.createHTTPClient ({
            connectionType : 'GET',
            onload : mapService.newPointsLoaded,
            onerror : function (e) {
                Ti.API.info("Error with map service" + this.responseText);
                loadingIndicator.message = "An error has occurred.";
            }
        });
        request.open("GET", UPM.MAP_SERVICE_URL);
        request.send();
    }
};
mapService.newPointsLoaded = function (e) {
    var response = JSON.parse(e.source.responseText),
        mapAnnotation;

    for (var i = 0, iLength = response.buildings.length; i < iLength; i++) {
        response.buildings[i].title = response.buildings[i].name;
        response.buildings[i].leftView = Titanium.UI.createImageView({
            // image : response.buildings[i].img
            image : UPM.BASE_PORTAL_URL + UPM.PORTAL_CONTEXT + '/media/skins/icons/google.png', //temporary since images in feed are no good.
            width : 32,
            height :32
        });
        rawAnnotations.push(response.buildings[i]);
        /*mapAnnotation = Titanium.Map.createAnnotation(response.buildings[i]);
        mapAnnotation.addEventListener("click",function(e){
            Ti.API.info("clicked a point" + e.source);
            loadPointDetail(e.source);
        });
        mapPoints.push(mapAnnotation);*/
    }
    // mapView.annotations = mapPoints;
    loadingIndicator.hide();
};

createTitleBar();
createMapView();
mapService.updateMapPoints();
