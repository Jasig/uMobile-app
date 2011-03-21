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

(function() {
    var win, 
        self = {},
        mapView, 
        createTitleBar, 
        searchField,
        createMapView,
        mapPoints = [], 
        loadPointDetail, 
        rawAnnotations = [],
        loadingIndicator,
        mapService;

    win = Titanium.UI.currentWindow;
    
    self.init = function () {
        //Initializes when the map window is loaded, is passed an instance of the MapService proxy.
        mapService = win.app.models.mapService;
        self.createTitleBar();
        self.createMapView();
        win.initialized = true;
    };
    
    self.createTitleBar = function () {
        var bar, title, homeButton, searchSubmit;

        searchSubmit = function(e) {
            searchField.blur();
            mapService.search(searchField.value);
        };
        
        // Create the view container for the title bar
        bar = win.app.views.GenericTitleBar({
            homeButton: true,
            app: win.app,
            windowKey: 'map'
        });
        win.add(bar);
        
        searchField = Titanium.UI.createTextField({
            backgroundGradient: win.app.UPM.GLOBAL_STYLES.textFieldGradient,
            height: 30,
            width: Ti.Platform.displayCaps.platformWidth - 43,
            clearButtonMode: Ti.UI.INPUT_BUTTONMODE_ALWAYS,
            borderStyle: Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
            left:38
        });
        
        if(Titanium.Platform.osname === "android") {
            var btnSearch = Ti.UI.createButton({
                width: 30,
                right: 10,
                title: 'Go'
                
            });
            bar.add(btnSearch);
            btnSearch.addEventListener('click',searchSubmit);
            searchField.width = Ti.Platform.displayCaps.platformWidth - 83;
        }
       if(Titanium.Platform.osname === "iphone") {
            searchField.borderRadius = 10;
            searchField.borderWidth = 1;
            searchField.borderColor = "#333";
        }
        bar.add(searchField);
        searchField.addEventListener('return', searchSubmit);

    };
    self.createMapView = function () {
        var annotations, buttonBar;

       // create the map view
       mapView = Titanium.Map.createView({
           top: win.app.UPM.TITLEBAR_HEIGHT,
           mapType: Titanium.Map.STANDARD_TYPE,
           region:{
               latitude: win.app.UPM.DEFAULT_LATITUDE,
               longitude: win.app.UPM.DEFAULT_LONGITUDE,
               latitudeDelta:0.01,
               longitudeDelta:0.01
           },
           regionFit:false,
           userLocation:true
       });
       win.add(mapView);
       mapView.addEventListener('touchstart',function(e){
           searchField.blur();
       });
       mapView.addEventListener('loaddetail',self.loadDetail);

       //Initialize the MapService, which manages the data for points on the map, 
       //including retrieval of data and searching array of points
       mapService.init(mapView);
       
       mapView.addEventListener("click", function(e) {
            var _annotation;
            Ti.API.info("Map clicked, and source of click event is: " + JSON.stringify(e));
            if(e.clicksource === 'title' && e.title) {
                _annotation = mapService.getAnnotationByTitle(e.title);
                mapView.fireEvent('loaddetail',_annotation);
            }
            else {
                Ti.API.info("Clicksource: " + e.clicksource);
                Ti.API.info("Title: " + e.title);
                Ti.API.info("Result of search: " + mapService.getAnnotationByTitle(e.title));
            }
        });

       // create controls for zoomin / zoomout
       // included in Android by default
       if(Titanium.Platform.osname === "iphone") {
           buttonBar = Titanium.UI.createButtonBar({
               labels: ['+', '-'], 
               backgroundColor: '#336699', 
               style: Titanium.UI.iPhone.SystemButtonStyle.BAR,
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
    };
    self.loadDetail = function(e) {
        var locationDetailWin;
        
        //Create and open the window for the map detail
        locationDetailWin = Titanium.UI.createWindow({
           backgroundColor: "#fff",
           url: win.app.UPM.getResourcePath("/js/controllers/MapDetailViewController.js"),
           data: e,
           app: win.app
        });
        locationDetailWin.open();
    };
    self.init();
    return self;
})();



/*  We'll worry about loading indicators later on. 
    loadingIndicator = Titanium.UI.createActivityIndicator({
       color : "#fff",
       backgroundColor : "#000",
       opacity : 0.75,
       message : "Map is loading"
   });   
   mapView.add(loadingIndicator);
   loadingIndicator.show();*/



