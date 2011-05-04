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

var MapWindowController = function(facade) {
    var win, app = facade, self = {}, initialized, mapProxy, //Standard utility vars
    locationDetailViewOptions, mapPoints = [], rawAnnotations = [], //Data objects
    locationDetailView, activityIndicator, mapView, searchBar, loadingIndicator, titleBar, //View objects
    createMainView, loadPointDetail, resetMapLocation, //Methods
    onProxySearching, onProxyLoading, onProxyLoaded, onProxySearchComplete, onProxyEmptySearch, onProxyLoadError, onWindowFocus, onWindowBlur; //Events

    init = function() {
        self.key = 'map';
        mapProxy = app.models.mapProxy;
        
        Ti.App.addEventListener('MapProxySearching', onProxySearching);
        Ti.App.addEventListener('MapProxySearchComplete', onProxySearchComplete);
        Ti.App.addEventListener('MapProxyEmptySearch', onProxyEmptySearch);
        Ti.App.addEventListener('MapProxyLoadError', onProxyLoadError);
        Ti.App.addEventListener('MapProxyLoading', onProxyLoading);
        Ti.App.addEventListener('MapProxyPointsLoaded', onProxyLoaded);
        
        initialized = true;
    };
    
    self.open = function () {
        if (!win) {
            win = Titanium.UI.createWindow({
                backgroundColor: app.styles.backgroundColor,
                exitOnClose: false,
                navBarHidden: true,
                modal: true
            });
            if (Ti.Platform.osname === 'iphone') {
                win.top = 20;
            }
            win.open();
            
            //Initialize the mapProxy, which manages the data for points on the map,
            //including retrieval of data and searching array of points
            mapProxy.init();
        }
        else {
            win.open();
            resetMapLocation();
        }
        createMainView();
    };
    
    self.close = function () {
        if (win) {
            win.close();
        }
        searchBlur();
    };

    createMainView = function() {
        var annotations, buttonBar, mapViewOpts;
        if (win) {
            if (!titleBar) {
                titleBar = app.views.GenericTitleBar({
                    homeButton: true,
                    app: app,
                    settingsButton: false,
                    title: app.localDictionary.map,
                    windowKey: 'map'
                });
                win.add(titleBar);
            }

            if (!activityIndicator) {
                activityIndicator = app.views.GlobalActivityIndicator.createActivityIndicator();
                win.add(activityIndicator);
            }

            if (!searchBar) {
                searchBar = Titanium.UI.createSearchBar(app.styles.searchBar);
                win.add(searchBar);
                searchBar.addEventListener('return', searchSubmit);
                searchBar.addEventListener('cancel', searchBlur);            
            }

            if (!mapView) {
                // create the map view
                mapViewOpts = app.styles.mapView;
                if (app.UPM.DEFAULT_MAP_REGION) {
                    Ti.API.info("Temporarily disabled default region in map.");
                    mapViewOpts.region = app.UPM.DEFAULT_MAP_REGION;
                }

                mapView = Titanium.Map.createView(mapViewOpts);
                win.add(mapView);

                //This is how we have to listen for when a user clicks an annotation title, because Android is quirky with events on annotations.
                mapView.addEventListener('touchstart', searchBlur);
                mapView.addEventListener('loaddetail', loadDetail);
                mapView.addEventListener("click", onMapViewClick);
                mapView.addEventListener('regionChanged', searchBlur);

                Ti.API.info("Map added with dimensions of: " + JSON.stringify(mapView.size) );
            }

            if (!buttonBar && Titanium.Platform.osname === "iphone") {
                // create controls for zoomin / zoomout
                // included in Android by default

                buttonBar = Titanium.UI.createButtonBar(app.styles.mapButtonBar);
                if (mapView) {
                    mapView.add(buttonBar);
                }
                else {
                    Ti.API.error("mapView doesn't exist to place the buttonBar into.");
                }

                // add event listeners for the zoom buttons
                buttonBar.addEventListener('click', function(e) {
                    if (e.index == 0) {
                        mapView.zoom(1);
                    } else {
                        mapView.zoom( - 1);
                    }
                });
            }
        }
        else {
            Ti.API.error("No window exists in which to place the map view.");
        }

    };
    
    resetMapLocation = function () {
        Ti.API.debug("resetMapLocation() in MapWindowController, with default location: " + JSON.stringify(mapProxy.getMapCenter(true)));
        if (mapView && mapProxy) {
            // mapView.setLocation(mapProxy.getMapCenter(true));
            mapView.region = mapProxy.getMapCenter(true);
        }
        else {
            Ti.API.error("Either mapView or mapProxy isn't set: " + mapView + ', ' + mapProxy);
        }
    };
    
    loadDetail = function(e) {
        //Create and open the view for the map detail
        // locationDetailWinOptions = app.styles.view;
        // locationDetailViewOptions.url = app.app.models.resourceProxy.getResourcePath("/js/controllers/MapDetailViewController.js");
        Ti.API.debug('self.loadDetail');
        activityIndicator.loadingMessage(app.localDictionary.loading);
        activityIndicator.show();
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
        activityIndicator.hide();
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
        activityIndicator.hide();
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
        activityIndicator.loadingMessage(app.localDictionary.searching);
        activityIndicator.show();
    };
    
    onProxyLoading = function (e) {
        activityIndicator.loadingMessage(app.localDictionary.loading);
        activityIndicator.show();
    };
    
    onProxyLoaded = function (e) {
        Ti.API.info("onProxyLoaded in MapWindowController. Center: " + JSON.stringify(mapProxy.getMapCenter()));
        resetMapLocation();
        activityIndicator.hide();
    };
    
    onProxySearchComplete = function (e) {
        var alertDialog;
        
        Ti.API.debug('onProxySearchComplete');
        activityIndicator.hide();
        
        if(e.points.length < 1) {
            alertDialog = Titanium.UI.createAlertDialog({
                title: app.localDictionary.noResults,
                message: app.localDictionary.mapNoSearchResults,
                buttonNames: [app.localDictionary.OK]
            });
            alertDialog.show();
        }
        else {
            plotPoints(e.points);
        }
    };
    
    onProxyEmptySearch = function (e) {
        Ti.API.debug("Hiding activity indicator in onProxyEmptySearch()");
        activityIndicator.hide();
        Ti.API.debug('onProxyEmptySearch' + e);
    };
    
    onProxyLoadError = function (e) {
        var alertDialog;
        
        Ti.API.debug("Hiding activity indicator in onProxyLoadError()");
        activityIndicator.hide();
        Ti.API.debug(JSON.stringify(e));
        
        switch (e.errorCode) {
            case mapProxy.requestErrors.NETWORK_UNAVAILABLE:
                alertDialog = Titanium.UI.createAlertDialog({
                    title: app.localDictionary.error,
                    message: app.localDictionary.map_NETWORK_UNAVAILABLE,
                    buttonNames: [app.localDictionary.OK]
                });
                alertDialog.show();
                break;
            case mapProxy.requestErrors.REQUEST_TIMEOUT:
                alertDialog = Titanium.UI.createAlertDialog({
                    title: app.localDictionary.error,
                    message: app.localDictionary.map_REQUEST_TIMEOUT,
                    buttonNames: [app.localDictionary.OK]
                });
                alertDialog.show();
                break;
            case mapProxy.requestErrors.SERVER_ERROR:
                alertDialog = Titanium.UI.createAlertDialog({
                    title: app.localDictionary.error,
                    message: app.localDictionary.map_SERVER_ERROR,
                    buttonNames: [app.localDictionary.OK]
                });
                alertDialog.show();
                break;
            case mapProxy.requestErrors.NO_DATA_RETURNED:
                alertDialog = Titanium.UI.createAlertDialog({
                    title: app.localDictionary.error,
                    message: app.localDictionary.map_NO_DATA_RETURNED,
                    buttonNames: [app.localDictionary.OK]
                });
                alertDialog.show();
                break;
            case mapProxy.requestErrors.INVALID_DATA_RETURNED: 
                alertDialog = Titanium.UI.createAlertDialog({
                    title: app.localDictionary.error,
                    message: app.localDictionary.map_INVALID_DATA_RETURNED,
                    buttonNames: [app.localDictionary.OK]
                });
                alertDialog.show();
                break;
            default:
                alertDialog = Titanium.UI.createAlertDialog({
                    title: app.localDictionary.error,
                    message: app.localDictionary.map_GENERAL_ERROR,
                    buttonNames: [app.localDictionary.OK]
                });
                alertDialog.show();
        }
    };

    if (!initialized) {
        init();
    }
    
    
    return self;
};