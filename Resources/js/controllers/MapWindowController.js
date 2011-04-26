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
    mapProxy,
    titleBar,
    //Proxy Events
    onProxySearching, onProxyLoading, onProxyLoaded, onProxySearchComplete, onProxyEmptySearch, onProxyLoadError;

    init = function() {
        //Initializes when the map window is loaded, is passed an instance of the mapProxy proxy.
        mapProxy = app.models.mapProxy;
        
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
        
        Ti.App.addEventListener('MapProxySearching', onProxySearching);
        Ti.App.addEventListener('MapProxySearchComplete', onProxySearchComplete);
        Ti.App.addEventListener('MapProxyEmptySearch', onProxyEmptySearch);
        Ti.App.addEventListener('MapProxyLoadError', onProxyLoadError);
        Ti.App.addEventListener('MapProxyLoading', onProxyLoading);
        Ti.App.addEventListener('MapProxyPointsLoaded', onProxyLoaded);
        
        createMapView();
        
        searchBar = Titanium.UI.createSearchBar(app.styles.searchBar);
        win.add(searchBar);
        searchBar.addEventListener('return', searchSubmit);
        searchBar.addEventListener('cancel', searchBlur);
        
        
        win.initialized = true;
    };

    createMapView = function() {
        var annotations, buttonBar, mapViewOpts;

        // create the map view
        mapViewOpts = app.styles.mapView;
        if (app.UPM.DEFAULT_MAP_REGION) {
            Ti.API.info("Temporarily disabled default region in map.");
            // mapViewOpts.region = app.UPM.DEFAULT_MAP_REGION;
        }
        
        mapView = Titanium.Map.createView(mapViewOpts);
        win.add(mapView);

        //Initialize the mapProxy, which manages the data for points on the map,
        //including retrieval of data and searching array of points
        mapProxy.init();

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
        app.views.GlobalActivityIndicator.message = app.localDictionary.loading;
        app.views.GlobalActivityIndicator.show();
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
        Ti.API.debug("Hiding Activity Indicator in loadDetail()");
        app.views.GlobalActivityIndicator.hide();
    };
    
    plotPoints = function (points) {
        //Clears the map of all annotations, takes an array of points, creates annotations of them, and plots them on the map.
        mapView.removeAllAnnotations();
        Ti.API.debug("plotPoints: " + JSON.stringify(points));
        Ti.API.debug("Annotation style: " + JSON.stringify(app.styles.mapAnnotation));
        for (var i=0, iLength = points.length; i<iLength; i++) {
            var _annotationParams, _annotation;
            _annotationParams = app.styles.mapAnnotation;
            _annotationParams.title = points[i].title || app.localDictionary.titleNotAvailable;
            _annotationParams.latitude = points[i].latitude;
            _annotationParams.longitude = points[i].longitude;
            _annotationParams.myid = 'annotation' + i;
            _annotationParams.subtitle = '';
            
            _annotation = Titanium.Map.createAnnotation(_annotationParams);
            mapView.addAnnotation(_annotation);
        }
        Ti.API.debug("Hiding Activity Indicator in plotPoints()");
        app.views.GlobalActivityIndicator.hide();
        mapView.setLocation(mapProxy.getMapCenter());
    };

    searchBlur = function (e) {
        searchBar.blur();
    };

    searchSubmit = function (e) {
        Ti.API.debug('searchSubmit() in MapWindowController');
        searchBlur();
        mapProxy.search(searchBar.value);
    };

    // Event Handlers
    //Controller Events
    onWindowBlur = function (e) {
        Ti.API.info("Map blur event fired");
        searchBlur();
    };
    
    onMapViewClick = function (e) {
        searchBlur();
        var _annotation;
        Ti.API.info("Map clicked, and source of click event is: " + JSON.stringify(e));
        if (e.clicksource === 'title' && e.title) {
            _annotation = mapProxy.getAnnotationByTitle(e.title);
            mapView.fireEvent('loaddetail', _annotation);
        }
        else {
            Ti.API.info("Clicksource: " + e.clicksource);
            Ti.API.info("Title: " + e.title);
            Ti.API.info("Result of search: " + mapProxy.getAnnotationByTitle(e.title));
        }
    };

    //Proxy Events
    onProxySearching = function (e) {
        Ti.API.debug('onProxySearching' + e.query);
        app.views.GlobalActivityIndicator.message = app.localDictionary.searching;
        app.views.GlobalActivityIndicator.show();
    };
    
    onProxyLoading = function (e) {
        app.views.GlobalActivityIndicator.message = app.localDictionary.loading;
        app.views.GlobalActivityIndicator.show();
    };
    
    onProxyLoaded = function (e) {
        Ti.API.info("onProxyLoaded in MapWindowController. Center: " + JSON.stringify(mapProxy.getMapCenter()));
        mapView.setLocation(mapProxy.getMapCenter(true));
        app.views.GlobalActivityIndicator.hide();
    };
    
    onProxySearchComplete = function (e) {
        Ti.API.debug('onProxySearchComplete');
        app.views.GlobalActivityIndicator.hide();
        if(e.points.length < 1) {
            alert(app.localDictionary.mapNoSearchResults);
        }
        else {
            plotPoints(e.points);
        }
    };
    
    onProxyEmptySearch = function (e) {
        Ti.API.debug("Hiding activity indicator in onProxyEmptySearch()");
        app.views.GlobalActivityIndicator.hide();
        Ti.API.debug('onProxyEmptySearch' + e);
    };
    
    onProxyLoadError = function (e) {
        Ti.API.debug("Hiding activity indicator in onProxyLoadError()");
        app.views.GlobalActivityIndicator.hide();
        Ti.API.debug(JSON.stringify(e));
        switch (e.errorCode) {
            case mapProxy.requestErrors.NETWORK_UNAVAILABLE:
                alert(app.localDictionary.map_NETWORK_UNAVAILABLE);
                break;
            case mapProxy.requestErrors.REQUEST_TIMEOUT:
                alert(app.localDictionary.map_REQUEST_TIMEOUT);
                break;
            case mapProxy.requestErrors.SERVER_ERROR:
                alert(app.localDictionary.map_SERVER_ERROR);
                break;
            case mapProxy.requestErrors.NO_DATA_RETURNED:
                alert(app.localDictionary.map_NO_DATA_RETURNED);
                break;
            case mapProxy.requestErrors.INVALID_DATA_RETURNED: 
                alert(app.localDictionary.map_INVALID_DATA_RETURNED);
                break;
            default:
                alert(app.localDictionary.map_GENERAL_ERROR);
        }
    };

    init();
})();