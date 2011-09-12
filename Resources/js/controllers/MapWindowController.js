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
    var _self = this;
    
    // Pseudo private variables
    this._app = facade;
    this._initialized;
    this._locationDetailViewOptions;
    this._rawAnnotations = [];
    
    // Pseudo private UI variables
    this._win;
    this._locationDetailView;
    this._activityIndicator;
    this._mapView;
    this._searchBar;
    this._titleBar;

    init = function() {
        Ti.API.debug("init() in MapWindowController");
        _self.key = 'map';
        
        Titanium.include('/js/models/MapProxy.js');
        Titanium.include('/js/views/MapDetailView.js');
        
        _self._app.registerModel('mapProxy', new MapProxy(app)); //Manages retrieval, storage, and search of map points. Gets all data from map portlet on uPortal, but stores locally.
        _self._app.registerView('mapDetailView', new MapDetailView(app)); // Subcontext in MapWindowController to show details of a location on the map

        Ti.App.addEventListener(MapProxy.events['SEARCHING'], _self._onProxySearching);
        Ti.App.addEventListener(MapProxy.events['SEARCH_COMPLETE'], _self._onProxySearchComplete);
        Ti.App.addEventListener(MapProxy.events['EMPTY_SEARCH'], _self._onProxyEmptySearch);
        Ti.App.addEventListener(MapProxy.events['LOAD_ERROR'], _self._onProxyLoadError);
        Ti.App.addEventListener(MapProxy.events['LOADING'], _self._onProxyLoading);
        Ti.App.addEventListener(MapProxy.events['POINTS_LOADED'], _self._onProxyLoaded);
    };
    
    this.open = function () {        
        if (_self._win) {
            _self._win.close();
        }
        
        _self._win = Titanium.UI.createWindow({
            url: 'js/views/WindowContext.js',
            backgroundColor: _self._app.styles.backgroundColor,
            exitOnClose: false,
            navBarHidden: true,
            orientationModes: [
            	Titanium.UI.PORTRAIT,
            	Titanium.UI.UPSIDE_PORTRAIT,
            	Titanium.UI.LANDSCAPE_LEFT,
            	Titanium.UI.LANDSCAPE_RIGHT
            ]
        });
        _self._win.open();
        
        if (_self._app.models.deviceProxy.isAndroid()) {
        	 _self._win.addEventListener('android:search', _self._onAndroidSearch);
        }

        _self._createMainView();
        _self._resetMapLocation();
        
        if (! _self._initialized) {
            _self._app.models.mapProxy.init();
        }
        
        _self._initialized = true;
    };
    
    this.close = function (options) {
        Ti.API.debug("close() in MapWindowController");
        _self._searchBlur();
        if (_self._app.models.deviceProxy.isAndroid()) {
        	try {
        		 _self._win.removeEventListener('android:search', _self._onAndroidSearch);
        	}
        	catch (e) {
        		Ti.API.error("Couldn't remove search event from Map Window");
        	}
        }
        if (_self._win) {
            _self._win.close();
        }
    };

    this._createMainView = function() {
        var annotations, buttonBar, mapViewOpts;
        if (_self._win) {
            _self._titleBar = _self._app.UI.createTitleBar({
                homeButton: true,
                settingsButton: false,
                title: _self._app.localDictionary.map
            });
            _self._win.add(_self._titleBar);

            _self._activityIndicator = _self._app.UI.createActivityIndicator();
            _self._win.add(_self._activityIndicator);
            _self._activityIndicator.hide();

            _self._searchBar = _self._app.UI.createSearchBar();
            _self._win.add(_self._searchBar.container);
            _self._searchBar.input.addEventListener('return', _self._searchSubmit);
            _self._searchBar.input.addEventListener('cancel', _self._searchBlur);

            if ((_self._app.models.deviceProxy.isAndroid() && !_self._mapView) || _self._app.models.deviceProxy.isIOS()) {
                // create the map view
                mapViewOpts = _self._app.styles.mapView.clone();
                if (_self._app.config.DEFAULT_MAP_REGION) {
                    Ti.API.info("Temporarily disabled default region in map.");
                    mapViewOpts.region = _self._app.config.DEFAULT_MAP_REGION;
                }

                _self._mapView = Titanium.Map.createView(mapViewOpts);
                _self._win.add(_self._mapView);

                //This is how we have to listen for when a user clicks an annotation title, because Android is quirky with events on annotations.
                // mapView.addEventListener('touchstart', _self._searchBlur);
                _self._mapView.addEventListener('loaddetail', _self._loadDetail);
                _self._mapView.addEventListener("click", _self._onMapViewClick);
                _self._mapView.addEventListener('regionChanged', _self._searchBlur);

                Ti.API.info("Map added with dimensions of: " + JSON.stringify(_self._mapView.size) );
            }
            else {
                _self._win.add(_self._mapView);
            }

            if (_self._app.models.deviceProxy.isIOS()) {
                // create controls for zoomin / zoomout
                // included in Android by default

                buttonBar = Titanium.UI.createButtonBar(_self._app.styles.mapButtonBar);
                if (_self._mapView) {
                    _self._mapView.add(buttonBar);
                }
                else {
                    Ti.API.error("mapView doesn't exist to place the buttonBar into.");
                }
                
                Titanium.App.addEventListener(ApplicationFacade.events['DIMENSION_CHANGES'], function (e) {
                    buttonBar.top = _self._app.styles.mapButtonBar.top;
                });

                // add event listeners for the zoom buttons
                buttonBar.addEventListener('click', function(e) {
                    if (e.index == 0) {
                        _self._mapView.zoom(1);
                    } else {
                        _self._mapView.zoom( - 1);
                    }
                });
            }
        }
        else {
            Ti.API.error("No window exists in which to place the map view.");
        }
    };
    
    this._resetMapLocation = function () {
        Ti.API.debug("resetMapLocation() in MapWindowController, with default location: " + JSON.stringify(_self._app.models.mapProxy.getMapCenter(true)));
        if (_self._mapView && _self._app.models.mapProxy) {
            // mapView.setLocation(Map.getMapCenter(true));
            _self._mapView.setLocation(_self._app.models.mapProxy.getMapCenter(true));

        }
        else {
            Ti.API.error("Either mapView or Map isn't set: " + _self._mapView + ', ' + _self._app.models.mapProxy);
        }
    };
    
    this._loadDetail = function(e) {
        //Create and open the view for the map detail
        Ti.API.debug('loadDetail() in MapWindowController');
        _self._activityIndicator.setLoadingMessage(_self._app.localDictionary.loading);
        _self._activityIndicator.show();
        _self._searchBlur();

        
        if (!_self._locationDetailView || _self._app.models.deviceProxy.isIOS()) {
            _self._locationDetailViewOptions = _self._app.styles.view.clone();
            _self._locationDetailViewOptions.data = e;
            _self._locationDetailView = _self._app.views.mapDetailView.getDetailView();
            _self._win.add(_self._locationDetailView);
        }
        _self._app.views.mapDetailView.render(e);
        
        _self._locationDetailView.show();

        _self._activityIndicator.hide();
    };
    
    this._plotPoints = function (points) {
        //Clears the map of all annotations, takes an array of points, creates annotations of them, and plots them on the map.
        _self._mapView.removeAllAnnotations();
        Ti.API.debug("plotPoints: " + JSON.stringify(points));
        Ti.API.debug("Annotation style: " + JSON.stringify(_self._app.styles.mapAnnotation));
        for (var i=0, iLength = points.length; i<iLength; i++) {
            var _annotationParams, _annotation;
            _annotationParams = _self._app.styles.mapAnnotation;
            _annotationParams.title = points[i].title || _self._app.localDictionary.titleNotAvailable;
            _annotationParams.latitude = points[i].latitude;
            _annotationParams.longitude = points[i].longitude;
            _annotationParams.myid = 'annotation' + i;
            _annotationParams.subtitle = '';
            _annotationParams.rightButton = Titanium.UI.iPhone.SystemButtonStyle.BORDERED;
            
            _annotation = Titanium.Map.createAnnotation(_annotationParams);
            _self._mapView.addAnnotation(_annotation);
        }
        Ti.API.debug("Hiding Activity Indicator in plotPoints()");
        
        _self._mapView.setLocation(_self._app.models.mapProxy.getMapCenter());
        _self._activityIndicator.hide();
    };

    this._searchBlur = function (e) {
        _self._searchBar.input.blur();
    };

    this._searchSubmit = function (e) {
        Ti.API.debug('searchSubmit() in MapWindowController');
        _self._searchBlur();
        _self._app.models.mapProxy.search(_self._searchBar.input.value);
    };
    
    this._onMapViewClick = function (e) {
        _self._searchBlur();
        var _annotation;
        Ti.API.info("Map clicked, and source of click event is: " + JSON.stringify(e));
        if (e.clicksource === 'title' && e.title) {
            _annotation = _self._app.models.mapProxy.getAnnotationByTitle(e.title);
            _self._mapView.fireEvent(MapWindowController.events['LOAD_DETAIL'], _annotation);
        }
        else {
            Ti.API.info("Clicksource: " + e.clicksource);
            Ti.API.info("Title: " + e.title);
            Ti.API.info("Result of search: " + _self._app.models.mapProxy.getAnnotationByTitle(e.title));
        }
    };

    //Proxy Events
    this._onProxySearching = function (e) {
        Ti.API.debug('onProxySearching' + e.query);
        _self._activityIndicator.setLoadingMessage(_self._app.localDictionary.searching);
        _self._activityIndicator.show();
    };
    
    this._onProxyLoading = function (e) {
        Ti.API.debug("onProxyLoading() in MapWindowController. Setting activity indicator text to: " + _self._app.localDictionary.mapLoadingLocations);
        Ti.API.debug("Is activityIndicator defined? " + _self._activityIndicator);
        Ti.API.debug("Is activityIndicator.setLoadingMessage defined? " + _self._activityIndicator.setLoadingMessage);
        _self._activityIndicator.setLoadingMessage(_self._app.localDictionary.mapLoadingLocations);
        _self._activityIndicator.show();
    };
    
    this._onProxyLoaded = function (e) {
        Ti.API.info("onProxyLoaded in MapWindowController. Center: " + JSON.stringify(_self._app.models.mapProxy.getMapCenter()));
        _self._resetMapLocation();
        _self._activityIndicator.hide();
    };
    
    this._onProxySearchComplete = function (e) {
        var alertDialog;
        
        Ti.API.debug('onProxySearchComplete');
        _self._activityIndicator.hide();
        
        if(e.points.length < 1) {
            if (_self._win.visible) {
                try {
                    alertDialog = Titanium.UI.createAlertDialog({
                        title: _self._app.localDictionary.noResults,
                        message: _self._app.localDictionary.mapNoSearchResults,
                        buttonNames: [_self._app.localDictionary.OK]
                    });
                    alertDialog.show();
                }
                catch (e) {
                    Ti.API.error("Couldn't show alert in MapWindowController: " + e);
                }
            }
        }
        else {
            _self._plotPoints(e.points);
        }
    };
    
    this._onProxyEmptySearch = function (e) {
        Ti.API.debug("Hiding activity indicator in onProxyEmptySearch()");
        _self._activityIndicator.hide();
        Ti.API.debug('onProxyEmptySearch' + e);
    };
    
    this._onAndroidSearch = function (e) {
    	Ti.API.debug("onAndroidSearch() in MapWindowController");
    	if (_self._searchBar && _self._searchBar.input) {
    		_self._searchBar.input.focus();
    	}
    	if (_self._locationDetailView) {
    		_self._locationDetailView.hide();
    	}
    };
    
    this._onProxyLoadError = function (e) {
        var alertDialog;
        
        Ti.API.debug("Hiding activity indicator in onProxyLoadError()");
        _self._activityIndicator.hide();
        Ti.API.debug(JSON.stringify(e));
        if (_self._win.visible) {
            try {
                switch (e.errorCode) {
                    case MapProxy.requestErrors.NETWORK_UNAVAILABLE:
                        alertDialog = Titanium.UI.createAlertDialog({
                            title: _self._app.localDictionary.error,
                            message: _self._app.localDictionary.map_NETWORK_UNAVAILABLE,
                            buttonNames: [_self._app.localDictionary.OK]
                        });
                        alertDialog.show();
                        break;
                    case MapProxy.requestErrors.REQUEST_TIMEOUT:
                        alertDialog = Titanium.UI.createAlertDialog({
                            title: _self._app.localDictionary.error,
                            message: _self._app.localDictionary.map_REQUEST_TIMEOUT,
                            buttonNames: [_self._app.localDictionary.OK]
                        });
                        alertDialog.show();
                        break;
                    case MapProxy.requestErrors.SERVER_ERROR:
                        alertDialog = Titanium.UI.createAlertDialog({
                            title: _self._app.localDictionary.error,
                            message: _self._app.localDictionary.map_SERVER_ERROR,
                            buttonNames: [_self._app.localDictionary.OK]
                        });
                        alertDialog.show();
                        break;
                    case MapProxy.requestErrors.NO_DATA_RETURNED:
                        alertDialog = Titanium.UI.createAlertDialog({
                            title: _self._app.localDictionary.error,
                            message: _self._app.localDictionary.map_NO_DATA_RETURNED,
                            buttonNames: [_self._app.localDictionary.OK]
                        });
                        alertDialog.show();
                        break;
                    case MapProxy.requestErrors.INVALID_DATA_RETURNED: 
                        alertDialog = Titanium.UI.createAlertDialog({
                            title: _self._app.localDictionary.error,
                            message: _self._app.localDictionary.map_INVALID_DATA_RETURNED,
                            buttonNames: [_self._app.localDictionary.OK]
                        });
                        alertDialog.show();
                        break;
                    default:
                        alertDialog = Titanium.UI.createAlertDialog({
                            title: _self._app.localDictionary.error,
                            message: _self._app.localDictionary.map_GENERAL_ERROR,
                            buttonNames: [_self._app.localDictionary.OK]
                        });
                        alertDialog.show();
                }
            }
            catch (e) {
                Ti.API.error("Couldn't show alert in MapWindowController: " + e);
            }
        }
    };

    if (!_self._initialized) {
        init();
    }
};
MapWindowController.events = {
    LOAD_DETAIL : 'loaddetail'
};