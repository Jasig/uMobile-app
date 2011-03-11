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
Titanium.include('js/views/MapDetailTop.js');
Titanium.include('js/views/GenericTitleBar.js');

var MapWindowController = function() {
    var win, 
        mapView, 
        createTitleBar, 
        searchField,
        createMapView,
        mapPoints = [], 
        loadPointDetail, 
        rawAnnotations = [],
        loadingIndicator;

    win = Titanium.UI.currentWindow;
    
    this.init = function () {
        this.createTitleBar();
        this.createMapView();
    };
    
    this.createTitleBar = function () {
        var bar, title, homeButton;

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
            searchField.blur();
            MapService.search(e.source.value);
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
    this.createMapView = function () {
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
       mapView.addEventListener('click',function(e){
           searchField.blur();
       });
       mapView.addEventListener('loaddetail',this.loadDetail);

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
    };
    this.loadDetail = function(e) {
        var locationDetailWin,
            locationDetailTitleBar,
            locationDetailMap,
            locationDetail,
            locationPhotos,
            titleBackButton;
        
        //Create and open the window for the map detail
        locationDetailWin = Titanium.UI.createWindow({
           backgroundColor: "#fff"
        });
        locationDetailWin.open();
        
        //Create a scrollable view to contain the contents of the detail view
        locationDetailScroll = Titanium.UI.createScrollView({
            contentWidth:'auto',
            contentHeight:'auto'
        });
        locationDetailWin.add(locationDetailScroll);
        
        //Create a back button to be added to the title bar to take the user back to the map
        titleBackButton = Titanium.UI.createButton({
            title: "Map"
        });
        titleBackButton.addEventListener("click",function(e){
            locationDetailWin.close();
        });
        
        //Create the title bar for the top of the detail view
        locationDetailTitleBar = new GenericTitleBar({
            title: e.title,
            settingsButton: true,
            backButton: titleBackButton
        });
        locationDetailScroll.add(locationDetailTitleBar);
        
        //Create the top area of the detail view, containing the map icon, address, and directions link.
        topDetailView = new MapDetailTop({
            details: e,
            top: 50
        });
        locationDetailScroll.add(topDetailView);
        
        //Display a photo of the location, if one is available.
        if(e.img){
            Ti.API.info(e.img);
            locationPhoto = Titanium.UI.createImageView({
                image: e.img.replace(/\/thumbnail\//,'/photo/'),
                width: Titanium.Platform.displayCaps.platformWidth - 20,
                left: 10,
                top: topDetailView.height + topDetailView.top + 10,
                backgroundColor: "#eee",
                borderRadius: 10,
                borderWidth: 10,
                borderColor: "#eee"
            });
            locationDetailScroll.add(locationPhoto);
        }
    };
    this.init();
};

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



