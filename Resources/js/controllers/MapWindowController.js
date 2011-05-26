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
    var win, app = facade, _self = this, initialized, Map, Device, Styles, UI, LocalDictionary, UPM, MapDetailView,
    locationDetailViewOptions, mapPoints = [], rawAnnotations = [], 
    locationDetailView, activityIndicator, mapView, searchBar, loadingIndicator, titleBar, 
    createMainView, loadPointDetail, resetMapLocation, 
    onProxySearching, onProxyLoading, onProxyLoaded, onProxySearchComplete, onProxyEmptySearch, onProxyLoadError, onWindowFocus, onWindowBlur; 

    init = function() {
        _self.key = 'map';
    };
    
    this.open = function () {
        if (!initialized) {
            Titanium.include('/js/models/MapProxy.js');
            Titanium.include('js/views/MapDetailTop.js');
            Titanium.include('js/controllers/MapDetailViewController.js');
            
            app.registerModel('mapProxy', new MapProxy(app)); //Manages retrieval, storage, and search of map points. Gets all data from map portlet on uPortal, but stores locally.
            app.registerView('MapDetailTop', MapDetailTop);
            app.registerController('MapDetailViewController', MapDetailViewController); // Subcontext in MapWindowController to show details of a location on the map
            
            Ti.App.addEventListener('MapProxySearching', onProxySearching);
            Ti.App.addEventListener('MapProxySearchComplete', onProxySearchComplete);
            Ti.App.addEventListener('MapProxyEmptySearch', onProxyEmptySearch);
            Ti.App.addEventListener('MapProxyLoadError', onProxyLoadError);
            Ti.App.addEventListener('MapProxyLoading', onProxyLoading);
            Ti.App.addEventListener('MapProxyPointsLoaded', onProxyLoaded);

            //Declare pointers to facade members
            Map = app.models.mapProxy;
            Device = app.models.deviceProxy;
            Styles = app.styles;
            UI = app.UI;
            LocalDictionary = app.localDictionary;
            UPM = app.UPM;
            MapDetailView = app.controllers.MapDetailViewController;
            
            Map.init();
            
            initialized = true;
        }
        
        if (win) {
            win.close();
        }
        
        win = Titanium.UI.createWindow({
            backgroundColor: Styles.backgroundColor,
            exitOnClose: false,
            navBarHidden: true
            // orientationModes: [Ti.UI.PORTRAIT]
        });
        win.open();

        createMainView();
        resetMapLocation();
    };
    
    this.close = function (options) {
        Ti.API.debug("close() in MapWindowController");
        searchBlur();
        if (win) {
            win.close();
        }
    };

    createMainView = function() {
        var annotations, buttonBar, mapViewOpts;
        if (win) {
            titleBar = UI.createTitleBar({
                homeButton: true,
                settingsButton: false,
                title: LocalDictionary.map
            });
            win.add(titleBar);

            activityIndicator = UI.createActivityIndicator();
            win.add(activityIndicator);
            activityIndicator.hide();

            searchBar = UI.createSearchBar();
            win.add(searchBar.container);
            searchBar.input.addEventListener('return', searchSubmit);
            searchBar.input.addEventListener('cancel', searchBlur);

            if ((Device.isAndroid() && !mapView) || Device.isIOS()) {
                // create the map view
                mapViewOpts = Styles.mapView;
                if (UPM.DEFAULT_MAP_REGION) {
                    Ti.API.info("Temporarily disabled default region in map.");
                    mapViewOpts.region = UPM.DEFAULT_MAP_REGION;
                }

                mapView = Titanium.Map.createView(mapViewOpts);
                win.add(mapView);

                //This is how we have to listen for when a user clicks an annotation title, because Android is quirky with events on annotations.
                // mapView.addEventListener('touchstart', searchBlur);
                mapView.addEventListener('loaddetail', loadDetail);
                mapView.addEventListener("click", onMapViewClick);
                mapView.addEventListener('regionChanged', searchBlur);

                Ti.API.info("Map added with dimensions of: " + JSON.stringify(mapView.size) );
            }
            else {
                win.add(mapView);
            }

            if (Device.isIOS()) {
                // create controls for zoomin / zoomout
                // included in Android by default

                buttonBar = Titanium.UI.createButtonBar(Styles.mapButtonBar);
                if (mapView) {
                    mapView.add(buttonBar);
                }
                else {
                    Ti.API.error("mapView doesn't exist to place the buttonBar into.");
                }
                
                Titanium.App.addEventListener('dimensionchanges', function (e) {
                    buttonBar.top = Styles.mapButtonBar.top;
                });

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
        Ti.API.debug("resetMapLocation() in MapWindowController, with default location: " + JSON.stringify(Map.getMapCenter(true)));
        if (mapView && Map) {
            // mapView.setLocation(Map.getMapCenter(true));
            mapView.setLocation(Map.getMapCenter(true));

        }
        else {
            Ti.API.error("Either mapView or Map isn't set: " + mapView + ', ' + Map);
        }
    };
    
    loadDetail = function(e) {
        //Create and open the view for the map detail
        Ti.API.debug('loadDetail() in MapWindowController');
        activityIndicator.setLoadingMessage(LocalDictionary.loading);
        activityIndicator.show();
        searchBlur();

        locationDetailViewOptions = Styles.view;
        locationDetailViewOptions.data = e;
        locationDetailView = new MapDetailView(app, locationDetailViewOptions);
        win.add(locationDetailView);
        locationDetailView.show();

        Ti.API.debug("Hiding Activity Indicator in loadDetail()");
        activityIndicator.hide();
    };
    
    plotPoints = function (points) {
        //Clears the map of all annotations, takes an array of points, creates annotations of them, and plots them on the map.
        mapView.removeAllAnnotations();
        Ti.API.debug("plotPoints: " + JSON.stringify(points));
        Ti.API.debug("Annotation style: " + JSON.stringify(Styles.mapAnnotation));
        for (var i=0, iLength = points.length; i<iLength; i++) {
            var _annotationParams, _annotation;
            _annotationParams = Styles.mapAnnotation;
            _annotationParams.title = points[i].title || LocalDictionary.titleNotAvailable;
            _annotationParams.latitude = points[i].latitude;
            _annotationParams.longitude = points[i].longitude;
            _annotationParams.myid = 'annotation' + i;
            _annotationParams.subtitle = '';
            
            _annotation = Titanium.Map.createAnnotation(_annotationParams);
            mapView.addAnnotation(_annotation);
        }
        Ti.API.debug("Hiding Activity Indicator in plotPoints()");
        
        mapView.setLocation(Map.getMapCenter());
        activityIndicator.hide();
    };

    searchBlur = function (e) {
        searchBar.input.blur();
    };

    searchSubmit = function (e) {
        Ti.API.debug('searchSubmit() in MapWindowController');
        searchBlur();
        Map.search(searchBar.input.value);
    };
    
    onMapViewClick = function (e) {
        searchBlur();
        var _annotation;
        Ti.API.info("Map clicked, and source of click event is: " + JSON.stringify(e));
        if (e.clicksource === 'title' && e.title) {
            _annotation = Map.getAnnotationByTitle(e.title);
            mapView.fireEvent('loaddetail', _annotation);
        }
        else {
            Ti.API.info("Clicksource: " + e.clicksource);
            Ti.API.info("Title: " + e.title);
            Ti.API.info("Result of search: " + Map.getAnnotationByTitle(e.title));
        }
    };

    //Proxy Events
    onProxySearching = function (e) {
        Ti.API.debug('onProxySearching' + e.query);
        activityIndicator.setLoadingMessage(LocalDictionary.searching);
        activityIndicator.show();
    };
    
    onProxyLoading = function (e) {
        activityIndicator.setLoadingMessage(LocalDictionary.loading);
        activityIndicator.show();
    };
    
    onProxyLoaded = function (e) {
        Ti.API.info("onProxyLoaded in MapWindowController. Center: " + JSON.stringify(Map.getMapCenter()));
        resetMapLocation();
        activityIndicator.hide();
    };
    
    onProxySearchComplete = function (e) {
        var alertDialog;
        
        Ti.API.debug('onProxySearchComplete');
        activityIndicator.hide();
        
        if(e.points.length < 1) {
            alertDialog = Titanium.UI.createAlertDialog({
                title: LocalDictionary.noResults,
                message: LocalDictionary.mapNoSearchResults,
                buttonNames: [LocalDictionary.OK]
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
            case Map.requestErrors.NETWORK_UNAVAILABLE:
                alertDialog = Titanium.UI.createAlertDialog({
                    title: LocalDictionary.error,
                    message: LocalDictionary.map_NETWORK_UNAVAILABLE,
                    buttonNames: [LocalDictionary.OK]
                });
                alertDialog.show();
                break;
            case Map.requestErrors.REQUEST_TIMEOUT:
                alertDialog = Titanium.UI.createAlertDialog({
                    title: LocalDictionary.error,
                    message: LocalDictionary.map_REQUEST_TIMEOUT,
                    buttonNames: [LocalDictionary.OK]
                });
                alertDialog.show();
                break;
            case Map.requestErrors.SERVER_ERROR:
                alertDialog = Titanium.UI.createAlertDialog({
                    title: LocalDictionary.error,
                    message: LocalDictionary.map_SERVER_ERROR,
                    buttonNames: [LocalDictionary.OK]
                });
                alertDialog.show();
                break;
            case Map.requestErrors.NO_DATA_RETURNED:
                alertDialog = Titanium.UI.createAlertDialog({
                    title: LocalDictionary.error,
                    message: LocalDictionary.map_NO_DATA_RETURNED,
                    buttonNames: [LocalDictionary.OK]
                });
                alertDialog.show();
                break;
            case Map.requestErrors.INVALID_DATA_RETURNED: 
                alertDialog = Titanium.UI.createAlertDialog({
                    title: LocalDictionary.error,
                    message: LocalDictionary.map_INVALID_DATA_RETURNED,
                    buttonNames: [LocalDictionary.OK]
                });
                alertDialog.show();
                break;
            default:
                alertDialog = Titanium.UI.createAlertDialog({
                    title: LocalDictionary.error,
                    message: LocalDictionary.map_GENERAL_ERROR,
                    buttonNames: [LocalDictionary.OK]
                });
                alertDialog.show();
        }
    };

    if (!initialized) {
        init();
    }
};