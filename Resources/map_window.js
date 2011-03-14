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

var MapWindowController = function() {
    var win, 
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
    
    this.init = function () {
        //Initializes when the map window is loaded, is passed an instance of the MapService proxy.
        mapService = win.app.models.mapServiceInstance;
        this.createTitleBar();
        this.createMapView();
    };
    
    this.createTitleBar = function () {
        var bar, title, homeButton;

        // Create the view container for the title bar
        bar = Titanium.UI.createView({
            backgroundColor: win.app.UPM.TITLEBAR_BACKGROUND_COLOR,
            top: 0,
            height: win.app.UPM.TITLEBAR_HEIGHT
        });    
        win.add(bar);
        searchField = Titanium.UI.createTextField({
            backgroundGradient: win.app.UPM.GLOBAL_STYLES.textFieldGradient,
            paddingLeft: 10,
            height: 30,
            width: Ti.Platform.displayCaps.platformWidth - 43,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#333",
            clearButtonMode: Ti.UI.INPUT_BUTTONMODE_ALWAYS,
            left:38
        });
        bar.add(searchField);
        searchField.addEventListener('return', function(e){
            searchField.blur();
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
            searchField.blur();
            Ti.App.fireEvent(
                'showWindow', 
                {
                    oldWindow: 'map',
                    newWindow: 'home'
                }
            );
        });
    };
    this.createMapView = function () {
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
           regionFit:true,
           userLocation:true
       });
       win.add(mapView);
       mapView.addEventListener('touchstart',function(e){
           searchField.blur();
       });
       mapView.addEventListener('loaddetail',this.loadDetail);

       //Initialize the MapService, which manages the data for points on the map, 
       //including retrieval of data and searching array of points
       Ti.API.info('mapView = ' + mapView);
       Ti.API.info('win.app = ' + win.app);
       Ti.API.info('mapService = ' + mapService);
       mapService.init(mapView,win.app);

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
    this.loadDetail = function(e) {
        var locationDetailWin;
        
        //Create and open the window for the map detail
        locationDetailWin = Titanium.UI.createWindow({
           backgroundColor: "#fff",
           url: "js/controllers/MapDetailViewController.js",
           data: e,
           app: win.app
        });
        locationDetailWin.open();

    };
    this.init();
},
controller = new MapWindowController();



/*  We'll worry about loading indicators later on. 
    loadingIndicator = Titanium.UI.createActivityIndicator({
       color : "#fff",
       backgroundColor : "#000",
       opacity : 0.75,
       message : "Map is loading"
   });   
   mapView.add(loadingIndicator);
   loadingIndicator.show();*/



