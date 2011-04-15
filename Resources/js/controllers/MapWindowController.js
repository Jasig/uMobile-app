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
    mapView,
    searchBar,
    createMapView,
    mapPoints = [],
    loadPointDetail,
    rawAnnotations = [],
    loadingIndicator,
    mapService,
    titleBar;

    init = function() {
        //Initializes when the map window is loaded, is passed an instance of the MapService proxy.
        mapService = app.models.mapService;
        
        win.add(app.views.GlobalActivityIndicator);
        Ti.App.addEventListener('showWindow', onWindowBlur);
        app.views.GlobalActivityIndicator.message = app.localDictionary.loading;
        app.views.GlobalActivityIndicator.show();

        titleBar = app.views.GenericTitleBar({
            homeButton: true,
            app: app,
            settingsButton: false,
            title: app.localDictionary.map,
            windowKey: 'map'
        });
        win.add(titleBar);
        
        searchBar = Titanium.UI.createSearchBar(app.styles.searchBar);
        win.add(searchBar);
        searchBar.addEventListener('return', searchSubmit);
        searchBar.addEventListener('cancel', searchBlur);
        
        Ti.App.addEventListener('MapProxySearching', onProxySearching);
        Ti.App.addEventListener('MapProxySearchComplete', onProxySearchComplete);
        Ti.App.addEventListener('MapProxyEmptySearch', onProxyEmptySearch);
        Ti.App.addEventListener('MapProxyLoadError', onProxyLoadError);
        
        createMapView();
        
        app.views.GlobalActivityIndicator.hide();
        
        win.initialized = true;
    };

    createMapView = function() {
        var annotations,
        buttonBar;

        // create the map view
        mapView = Titanium.Map.createView(app.styles.mapView);
        win.add(mapView);

        //Initialize the MapService, which manages the data for points on the map,
        //including retrieval of data and searching array of points
        mapService.init();

        //This is how we have to listen for when a user clicks an annotation title, because Android is quirky with events on annotations.
        mapView.addEventListener('touchstart', searchBlur);
        mapView.addEventListener('loaddetail', loadDetail);
        mapView.addEventListener("click", onMapViewClick);
        mapView.addEventListener('regionChanged', searchBlur);

        // create controls for zoomin / zoomout
        // included in Android by default
        if (Titanium.Platform.osname === "iphone") {
            buttonBar = Titanium.UI.createButtonBar(app.styles.mapButtonBar);
            mapView.add(buttonBar);

            // add event listeners for the zoom buttons
            buttonBar.addEventListener('click',
            function(e) {
                if (e.index == 0) {
                    mapView.zoom(1);
                } else {
                    mapView.zoom( - 1);
                }
            });
        }
    };
    loadDetail = function(e) {
        //Create and open the view for the map detail
        // locationDetailWinOptions = app.styles.view;
        // locationDetailViewOptions.url = app.app.models.resourceProxy.getResourcePath("/js/controllers/MapDetailViewController.js");
        Ti.API.debug('self.loadDetail');
        searchBlur();
        if (!locationDetailView) {
            Ti.API.debug("locationDetailView not defined");
            locationDetailViewOptions = app.styles.view;
            locationDetailViewOptions.data = e;
            locationDetailView = new app.controllers.MapDetailViewController(app, locationDetailViewOptions);
            win.add(locationDetailView);
            locationDetailView.show();
        }
        else {
            Ti.API.debug("locationDetailView defined");
            locationDetailView.updateAndShow(e);
        }
    };
    
    function plotPoints (points) {
        //Clears the map of all annotations, takes an array of points, creates annotations of them, and plots them on the map.
        mapView.removeAllAnnotations();
        Ti.API.debug("plotPoints: " + JSON.stringify(points));
        for (var i=0, iLength = points.length; i<iLength; i++) {
            var _annotation = Titanium.Map.createAnnotation({
                title: points[i].title || app.localDictionary.titleNotAvailable,
                latitude: points[i].latitude,
                longitude: points[i].longitude,
                pincolor:Titanium.Map.ANNOTATION_RED
            });
            mapView.addAnnotation(_annotation);
        }
        app.views.GlobalActivityIndicator.hide();
    }

    function searchBlur(e) {
        searchBar.blur();
    }

    function searchSubmit(e) {
        Ti.API.debug('searchSubmit() in MapWindowController');
        searchBlur();
        mapService.search(searchBar.value);
    }

    // Event Handlers
    //Controller Events
    function onWindowBlur(e) {
        Ti.API.info("Map blur event fired");
        searchBlur();
    }
    function onMapViewClick(e) {
        searchBlur();
        var _annotation;
        Ti.API.info("Map clicked, and source of click event is: " + JSON.stringify(e));
        if (e.clicksource === 'title' && e.title) {
            _annotation = mapService.getAnnotationByTitle(e.title);
            mapView.fireEvent('loaddetail', _annotation);
        }
        else {
            Ti.API.info("Clicksource: " + e.clicksource);
            Ti.API.info("Title: " + e.title);
            Ti.API.info("Result of search: " + mapService.getAnnotationByTitle(e.title));
        }
    }

    //Proxy Events
    function onProxySearching (e) {
        Ti.API.debug('onProxySearching' + e.query);
        app.views.GlobalActivityIndicator.message = app.localDictionary.searching;
        app.views.GlobalActivityIndicator.show();
    }
    function onProxySearchComplete (e) {
        Ti.API.debug('onProxySearchComplete');
        plotPoints(e.points);
    }
    function onProxyEmptySearch (e) {
        app.views.GlobalActivityIndicator.hide();
        Ti.API.debug('onProxyEmptySearch' + e);
    }
    function onProxyLoadError (e) {
        Ti.API.debug(JSON.stringify(e));
        switch (e.errorCode) {
            case mapService.requestErrors.NETWORK_UNAVAILABLE:
                alert(app.localDictionary.map_NETWORK_UNAVAILABLE);
                break;
            case mapService.requestErrors.REQUEST_TIMEOUT:
                alert(app.localDictionary.map_REQUEST_TIMEOUT);
                break;
            case mapService.requestErrors.SERVER_ERROR:
                alert(app.localDictionary.map_SERVER_ERROR);
                break;
            case mapService.requestErrors.NO_DATA_RETURNED:
                alert(app.localDictionary.map_NO_DATA_RETURNED);
                break;
            case mapService.requestErrors.INVALID_DATA_RETURNED: 
                alert(app.localDictionary.map_INVALID_DATA_RETURNED);
                break;
            default:
                alert(app.localDictionary.map_GENERAL_ERROR);
        }
    }

    init();
})();