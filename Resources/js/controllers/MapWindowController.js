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
    var win = Titanium.UI.currentWindow,
        locationDetailViewOptions,
        locationDetailView,
        app = win.app,
        self = {},
        mapView,
        searchBar,
        createMapView,
        mapPoints = [], 
        loadPointDetail, 
        rawAnnotations = [],
        loadingIndicator,
        mapService,
        searchSubmit,
        titleBar;
    
    self.init = function () {
        //Initializes when the map window is loaded, is passed an instance of the MapService proxy.
        mapService = app.models.mapService;
        self.createMapView();
        win.initialized = true;
        
        titleBar = app.views.GenericTitleBar({
            homeButton: true,
            app: app,
            settingsButton: true,
            title: app.localDictionary.map,
            windowKey: 'map'
        });
        win.add(titleBar);
        
        searchBar = Titanium.UI.createSearchBar(app.styles.searchBar);
        win.add(searchBar);
        searchBar.addEventListener('return',searchSubmit);
    };

    self.createMapView = function () {
        var annotations, buttonBar;

       // create the map view
       mapView = Titanium.Map.createView(app.styles.mapView);
       win.add(mapView);
       mapView.addEventListener('touchstart',function(e){
           searchBar.blur();
       });
       mapView.addEventListener('loaddetail',self.loadDetail);

       //Initialize the MapService, which manages the data for points on the map, 
       //including retrieval of data and searching array of points
       mapService.init(mapView);
       
       //This is how we have to listen for when a user clicks an annotation title, because Android is quirky with events on annotations.
       mapView.addEventListener("click", function(e) {
            searchBar.blur();
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
        mapView.addEventListener('regionChanged',function(e){
            searchBar.blur();
        });

       // create controls for zoomin / zoomout
       // included in Android by default
       if(Titanium.Platform.osname === "iphone") {
           buttonBar = Titanium.UI.createButtonBar(app.styles.mapButtonBar);
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
        //Create and open the view for the map detail
        // locationDetailWinOptions = app.styles.view;
        // locationDetailViewOptions.url = app.UPM.getResourcePath("/js/controllers/MapDetailViewController.js");
        Ti.API.debug('self.loadDetail');
        searchBar.blur();
        if(!locationDetailView) {
            Ti.API.debug("locationDetailView not defined");
            locationDetailViewOptions = app.styles.view;
            locationDetailViewOptions.data = e;
            locationDetailView = new app.controllers.MapDetailViewController (app,locationDetailViewOptions);
            win.add(locationDetailView);
            locationDetailView.show();            
        }
        else {
            Ti.API.debug("locationDetailView defined");
            locationDetailView.updateAndShow(e);
        }
    };
    
    searchSubmit = function(e) {
        searchBar.blur();
        mapService.search(searchBar.value);
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



