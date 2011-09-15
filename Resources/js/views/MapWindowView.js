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
var MapWindowView = function (facade) {
    var _self = this;
    
    //Pseudo private variables
    this._app = facade;
    
    // Pseudo private UI objects
    this._view;
    this._locationDetailView;
    this._activityIndicator;
    this._mapView;
    this._searchBar;
    this._titleBar;
    
    this.createView = function () {
        
        _self._view = Ti.UI.createView();
        _self._createMainView();
        _self._resetMapLocation();
        
        return _self._view;
    };
    
    this._createMainView = function() {
        var annotations, buttonBar, mapViewOpts;

        _self._titleBar = _self._app.UI.createTitleBar({
            homeButton: true,
            settingsButton: false,
            title: _self._app.localDictionary.map
        });
        _self._view.add(_self._titleBar);

        _self._activityIndicator = _self._app.UI.createActivityIndicator();
        _self._view.add(_self._activityIndicator);
        _self._activityIndicator.hide();

        _self._searchBar = _self._app.UI.createSearchBar();
        _self._view.add(_self._searchBar.container);
        _self._searchBar.input.addEventListener('return', _self._searchSubmit);
        _self._searchBar.input.addEventListener('cancel', _self.searchBlur);

        if ((_self._app.models.deviceProxy.isAndroid() && !_self._mapView) || _self._app.models.deviceProxy.isIOS()) {
            // create the map view
            mapViewOpts = _self._app.styles.mapView.clone();
            if (_self._app.config.DEFAULT_MAP_REGION) {
                Ti.API.info("Temporarily disabled default region in map.");
                mapViewOpts.region = _self._app.config.DEFAULT_MAP_REGION;
            }

            _self._mapView = Titanium.Map.createView(mapViewOpts);
            _self._view.add(_self._mapView);

            //This is how we have to listen for when a user clicks an annotation title, because Android is quirky with events on annotations.
            _self._mapView.addEventListener("click", _self._onMapViewClick);
            _self._mapView.addEventListener('regionChanged', _self.searchBlur);

            Ti.API.info("Map added with dimensions of: " + JSON.stringify(_self._mapView.size) );
        }
        else {
            _self._view.add(_self._mapView);
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
    };
    
    this._resetMapLocation = function () {
        Ti.API.debug("resetMapLocation() in MapWindowView");
        if (_self._mapView && _self._app.models.mapProxy) {
            _self._mapView.setLocation(_self._app.models.mapProxy.getMapCenter(true));
        }
    };
    
    this._plotPoints = function (_newPoints) {
        //Clears the map of all annotations, takes an array of points, creates annotations of them, and plots them on the map.
        _self._mapView.removeAllAnnotations();
        for (var i=0, iLength = _newPoints.length; i<iLength; i++) {
            var _annotationParams, _annotation;
            _annotationParams = _self._app.styles.mapAnnotation;
            _annotationParams.title = _newPoints[i].title || _self._app.localDictionary.titleNotAvailable;
            _annotationParams.latitude = _newPoints[i].latitude;
            _annotationParams.longitude = _newPoints[i].longitude;
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
    
    this.searchBlur = function (e) {
        _self._searchBar.input.blur();
    };

    this._searchSubmit = function (e) {
        Ti.API.debug('searchSubmit() in MapWindowController');
        _self.searchBlur();
        Ti.App.fireEvent(MapWindowView.events['SEARCH_SUBMIT'],{
            value: _self._searchBar.input.value
        });
    };
    
    this._onMapViewClick = function (e) {
        _self.searchBlur();
        Ti.App.fireEvent(MapWindowView.events['MAPVIEW_CLICK'], {
            clicksource : e.clicksource,
            title       : e.title
        });
    };
    
};
MapWindowView.events = {
    SEARCH_SUBMIT   : "MapViewSearchSubmit",
    MAPVIEW_CLICK   : "MapViewClick"
};