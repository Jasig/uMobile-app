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
    this._activeView;
    
    // Pseudo private UI objects
    this._view;
    this._locationDetailView;
    this._activityIndicator;
    this._mapView;
    this._searchBar;
    this._titleBar;
    this._bottomNavView;
    this._bottomNavButtons;
    this._zoomButtonBar;
    
    // Category Browsing UI
    this._categoryBrowsingView;
    this._categoryNavBar;
    this._categoryLocationsListView;
    
    // Favorites browsing UI
    this._favoritesBar;
    
    this.createView = function () {
        
        _self._view = Ti.UI.createView();
        _self._createMainView();
        _self._resetMapLocation();
        
        return _self._view;
    };
    
    this._createMainView = function() {
        var mapViewOpts;

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

        _self._bottomNavView = Ti.UI.createView(_self._app.styles.mapNavView);
        _self._view.add(_self._bottomNavView);

        _self._bottomNavButtons = Titanium.UI.createTabbedBar(_self._app.styles.mapButtonBar);
        _self._bottomNavButtons.labels = MapWindowView.navButtonValues;
        _self._bottomNavButtons.width = 225;
        _self._bottomNavView.add(_self._bottomNavButtons);
        
        _self._bottomNavButtons.addEventListener('click', function (e) {
            Ti.App.fireEvent(MapWindowView.events['NAV_BUTTON_CLICK'], {
                buttonName: MapWindowView.navButtonValues[e.index] || ''
            });
        });
        
        if (_self._app.models.deviceProxy.isIOS()) {
            // create controls for zoomin / zoomout
            // included in Android by default
            _self._bottomNavButtons.left = 5;

            _self._zoomButtonBar = Titanium.UI.createButtonBar(_self._app.styles.mapButtonBar);
            _self._zoomButtonBar.labels =  ['+', '-'];
            _self._zoomButtonBar.width = 75;
            _self._zoomButtonBar.right = 5;
            
            if (_self._mapView) {
                _self._bottomNavView.add(_self._zoomButtonBar);
            }
            else {
                Ti.API.error("mapView doesn't exist to place the _self._zoomButtonBar into.");
            }
            
            Titanium.App.addEventListener(ApplicationFacade.events['DIMENSION_CHANGES'], function (e) {
                _self._zoomButtonBar.top = _self._app.styles.mapButtonBar.top;
            });

            // add event listeners for the zoom buttons
            _self._zoomButtonBar.addEventListener('click', function(e) {
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
    
    this._plotPoints = function (points) {
        //Clears the map of all annotations, takes an array of points, creates annotations of them, and plots them on the map.
        _self._mapView.removeAllAnnotations();
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
        
        _self._mapView.setLocation(_self._app.models.mapProxy.getMapCenter());
        _self._activityIndicator.hide();
    };
    
    this.searchBlur = function (e) {
        Ti.API.debug("searchBlur() in MapWindowView");
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
    
    this.resetDimensions = function (e) {
        Ti.API.debug("resetDimensions() in MapWindowView");
        _self._mapView.height = _self._app.styles.mapView.height;
        _self._bottomNavView.top = _self._app.styles.mapNavView.top;
    };
    
    this._hideAllViews = function () {
        // This method hides all of the different views within this context,
        // so that the different methods don't have to worry about what views to close
        if (_self._searchBar) _self._searchBar.input.hide();
        if (_self._mapView) _self._mapView.hide();
        if (_self._favoritesBar) _self._favoritesBar.hide();
        if (_self._categoryNavBar) _self._categoryNavBar.view.hide();
        if (_self._categoryBrowsingView) _self._categoryBrowsingView.hide();
        if (_self._categoryLocationsListView) _self._categoryLocationsListView.hide();
    };
    
    this._createAndAddCategoryNav = function () {
        Ti.API.debug("_createAndAddCategoryNav() in MapWindowView");
        Ti.include('/js/views/SecondaryNav.js');
        _self._categoryNavBar = new SecondaryNav();
        _self._categoryNavBar.init(_self._app);
        _self._categoryNavBar.leftButton.text = _self._app.localDictionary.back;
        _self._view.add(_self._categoryNavBar.view);
        _self._categoryNavBar.view.top = _self._app.styles.titleBar.height;
        
        _self._categoryNavBar.rightButton.addEventListener('click', function (e) {
            Ti.App.fireEvent(MapWindowView.events['CATEGORY_RIGHT_BTN_CLICK']);
        });
    };
    
    this.openCategoryBrowsingView = function (categories) {
        Ti.API.debug("openCategoryBrowsingView() in MapWindowView. searchBar: " + _self._searchBar);
        _self._hideAllViews();
        
        // If there isn't a _categoryNavBar yet, go ahead and create one.
        if (!_self._categoryNavBar) _self._createAndAddCategoryNav();
        
        _self._categoryNavBar.view.show();
        _self._categoryNavBar.leftButton.hide();
        _self._categoryNavBar.titleLabel.text = _self._app.localDictionary.browseLocations;
        _self._categoryNavBar.rightButton.title = _self._app.localDictionary.map;
        
        if (!_self._categoryBrowsingView) {
            // Create the view to hold tableviews listing categories and locations.
            Ti.API.debug("Creating categoryBrowsingView in MapWindowView with categories: " + JSON.stringify(categories));
            _self._categoryBrowsingView = Ti.UI.createTableView({
                data: (function(c) {
                    var _data = [], _labelStyle = _self._app.styles.mapCategoryCount.clone(), _rowStyle = _self._app.styles.mapCategoryRow.clone(), _categoryName;
                    
                    // Iterate through array of categories and create table view rows for user to select.
                    for (var i=0, iLength = c.length; i<iLength; i++) {
                        // Create a row with the category name
                        _categoryName = c[i]['name'];
                        _rowStyle.title = _categoryName.toCapitalized();
                        _data.push(Titanium.UI.createTableViewRow(_rowStyle));
                        
                        // Add a count to the row with number of children for category.
                        _labelStyle.text = c[i]['numChildren'];
                        _data[i].add(Ti.UI.createLabel(_labelStyle));
                        
                        // Add a listener to the row to let the controller 
                        // know the user wants to explore the category
                        _data[i].addEventListener('click', function (e) {
                            Ti.App.fireEvent(MapWindowView.events['CATEGORY_ROW_CLICK'], { category : e.row.title.toLowerCase() });
                        });
                    }
                    
                    return _data;
                })(categories),
                height: _self._app.styles.mapView.height,
                top: _self._app.styles.mapView.top
            });
            _self._view.add(_self._categoryBrowsingView);
        }
        else {
            _self._categoryBrowsingView.show();
        }
    };
    
    this.openCategoryLocationsListView = function (viewModel) {
        Ti.API.debug("openCategoryLocationsListView() in MapWindowView");
        _self._hideAllViews();
        
        if (!_self._categoryLocationsListView) {
            _self._categoryLocationsListView = Ti.UI.createTableView({
                top: _self._app.styles.mapView.top,
                height: _self._app.styles.mapView.height
            });
            _self._view.add(_self._categoryLocationsListView);
        }
        
        _self._categoryLocationsListView.show();
        if (!_self._categoryNavBar) _self._createAndAddCategoryNav();
        _self._categoryNavBar.view.show();
        _self._categoryNavBar.leftButton.show();
        _self._categoryNavBar.titleLabel.text = viewModel.categoryName;
        _self._categoryNavBar.rightButton.title = _self._app.localDictionary.map;
        
        _self._categoryLocationsListView.setData(viewModel.locations);
    };
    
    this.openCategoryLocationsMapView = function (viewModel) {
        Ti.API.debug("openCategoryLocationsMapView() in MapWindowView");
        
        _self._hideAllViews();
        
        // If there isn't a _categoryNavBar yet, go ahead and create one.
        if (!_self._categoryNavBar) _self._createAndAddCategoryNav();
        
        _self._categoryNavBar.view.show();
        _self._mapView.show();

        _self._categoryNavBar.titleLabel.text = _self._app.localDictionary.browseLocations;
        _self._categoryNavBar.rightButton.title = _self._app.localDictionary.list;
        
        /*
            TODO Actually plot the points on the map.
        */
    };
    
    this.openSearchView = function () {
        Ti.API.debug("openSearchView() in MapWindowView");
        _self._hideAllViews();
        if (_self._searchBar) _self._searchBar.input.show();
        if (_self._mapView) {
            _self._mapView.show();
        }
        else {
            // TODO Create a mapview, although it should already exist
        }
    };
    
    this.openFavoritesBrowsingView = function () {
        Ti.API.debug("openFavoritesBrowsingView() in MapWindowView");
        _self._hideAllViews();
    };
    
    this.openFavoritesMapView = function () {
        Ti.API.debug("openFavoritesMapView() in MapWindowView");
        _self._hideAllViews();
    };
    
    this.getView = function () {
        return _self._activeView;
    };
    
    this.setView = function (newView, viewModel) {
        //First we want to make sure the newView is legit
        //And set the _activeView to newView if it is.
        for (var _view in MapWindowView.views) {
            if (MapWindowView.views.hasOwnProperty(_view)) {
                if (MapWindowView.views[_view] === newView) {
                    _self._activeView = newView;
                    break;
                }
            }
        }
        
        // Now we want to actually show the proper view, presuming 
        // the newView matches the (hopefully) newly set _self._activeView
        if (_self._activeView === newView) {
            switch (newView) {
                case MapWindowView.views['SEARCH']:
                    _self.openSearchView();
                    break;
                case MapWindowView.views['CATEGORY_BROWSING']:
                    _self.openCategoryBrowsingView(viewModel);
                    break;
                case MapWindowView.views['CATEGORY_LOCATIONS_MAP']:
                    _self.openCategoryLocationsMapView(viewModel);
                    break;
                case MapWindowView.views['CATEGORY_LOCATIONS_LIST']:
                    _self.openCategoryLocationsListView(viewModel);
                    break;
                case MapWindowView.views['FAVORITES_BROWSING']:
                    _self.openFavoritesBrowsingView();
                    break;
                case MapWindowView.views['FAVORITES_MAP']:
                    _self.openFavoritesMapView();
                    break;
            }
        }
    };
    
};
MapWindowView.events = {
    SEARCH_SUBMIT               : "MapViewSearchSubmit",
    MAPVIEW_CLICK               : "MapViewClick",
    NAV_BUTTON_CLICK            : "MapNavButtonClick",
    DETAIL_CLICK                : "MapViewDetailClick",
    CATEGORY_ROW_CLICK          : "MapViewCategoryRowClick",
    CATEGORY_RIGHT_BTN_CLICK    : "MapViewCategoryRightButtonClick"
};

if (typeof localDictionary === "undefined") Ti.include('/js/localization.js');
MapWindowView._locale = Titanium.App.Properties.getString('locale');
MapWindowView.navButtonValues = [
    localDictionary[MapWindowView._locale]['search'],
    localDictionary[MapWindowView._locale]['browse'],
    localDictionary[MapWindowView._locale]['favorites']
];

MapWindowView.views = {
    SEARCH                  : "MapWindowSearchView",
    CATEGORY_BROWSING       : "MapWindowCategoryBrowsing",
    CATEGORY_LOCATIONS_LIST : "MapWindowCategoryLocationsList",
    CATEGORY_LOCATIONS_MAP  : "MapWindowCategoryMap",
    FAVORITES_BROWSING      : "MapWindowFavoritesBrowsing",
    FAVORITES_MAP           : "MapWindowFavoritesMap"
};