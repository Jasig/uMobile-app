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

var view, activityIndicator, mapView, searchBar, titleBar, bottomNavView, bottomNavButtons, zoomButtonBar, categoryBrowsingView, categoryNavBar, categoryLocationsListView, favoritesBar;


// Public methods
exports.createView = function () {
    view = Ti.UI.createView();
    _createMainView();
    exports.resetMapLocation();
    
    return view;
};

exports.plotPoints = function (points) {
    //Clears the map of all annotations, takes an array of points, creates annotations of them, and plots them on the map.
    mapView.removeAllAnnotations();
    for (var i=0, iLength = points.length; i<iLength; i++) {
        var _annotationParams, _annotation;
        _annotationParams = app.styles.mapAnnotation;
        _annotationParams.title = points[i].title || app.localDictionary.titleNotAvailable;
        _annotationParams.latitude = points[i].latitude;
        _annotationParams.longitude = points[i].longitude;
        _annotationParams.myid = 'annotation' + i;
        _annotationParams.subtitle = '';
        _annotationParams.rightButton = Titanium.UI.iPhone.SystemButtonStyle.BORDERED;
        
        _annotation = Titanium.Map.createAnnotation(_annotationParams);
        mapView.addAnnotation(_annotation);
    }
    
    mapView.setLocation(app.models.mapProxy.getMapCenter());
    activityIndicator.hide();
};

exports.hideActivityIndicator = function () {
    activityIndicator.hide();
};

exports.showActivityIndicator = function () {
    activityIndicator.show();
};

exports.setActivityIndicatorMessage = function (message) {
    activityIndicator.setLoadingMessage(message);
};

exports.resetDimensions = function (e) {
    if (mapView) mapView.height = app.styles.mapView.height;
    if (bottomNavView) bottomNavView.top = app.styles.mapNavView.top;
};

exports.resetMapLocation = function () {
    Ti.API.debug("resetMapLocation() in MapWindowView");
    if (mapView && app.models.mapProxy) {
        mapView.setLocation(app.models.mapProxy.getMapCenter(true));
    }
};

exports.searchBlur = function (e) {
    searchBar.input.blur();
};

exports.openCategoryBrowsingView = function (categories) {
    Ti.API.debug("openCategoryBrowsingView() in MapWindowView. searchBar: " + searchBar);
    _hideAllViews();
    
    // If there isn't a categoryNavBar yet, go ahead and create one.
    if (!categoryNavBar) _createAndAddCategoryNav();
    
    categoryNavBar.view.show();
    categoryNavBar.leftButton.hide();
    categoryNavBar.titleLabel.text = app.localDictionary.browseLocations;
    categoryNavBar.rightButton.title = app.localDictionary.map;
    
    if (!categoryBrowsingView) {
        // Create the view to hold tableviews listing categories and locations.
        Ti.API.debug("Creating categoryBrowsingView in MapWindowView with categories: " + JSON.stringify(categories));
        categoryBrowsingView = Ti.UI.createTableView({
            data: (function(c) {
                var _data = [], _labelStyle = _.clone(app.styles.mapCategoryCount), _rowStyle = _.clone(app.styles.mapCategoryRow), _categoryName;
                
                // Iterate through array of categories and create table view rows for user to select.
                for (var i=0, iLength = c.length; i<iLength; i++) {
                    // Create a row with the category name
                    _categoryName = c[i]['name'];
                    _rowStyle.title = _categoryName;
                    _data.push(Titanium.UI.createTableViewRow(_rowStyle));
                    
                    // Add a count to the row with number of children for category.
                    _labelStyle.text = c[i]['numChildren'];
                    _data[i].add(Ti.UI.createLabel(_labelStyle));
                    
                    // Add a listener to the row to let the controller 
                    // know the user wants to explore the category
                    _data[i].addEventListener('click', function (e) {
                        Ti.App.fireEvent(exports.events['CATEGORY_ROW_CLICK'], { category : e.row.title.toLowerCase() });
                    });
                }
                
                return _data;
            })(categories),
            height: app.styles.mapView.height,
            top: app.styles.mapView.top
        });
        view.add(categoryBrowsingView);
    }
    else {
        categoryBrowsingView.show();
    }
};

exports.openCategoryLocationsListView = function (viewModel) {
    Ti.API.debug("openCategoryLocationsListView() in MapWindowView");
    _hideAllViews();
    
    if (!categoryLocationsListView) {
        categoryLocationsListView = Ti.UI.createTableView({
            top: app.styles.mapView.top,
            height: app.styles.mapView.height
        });
        view.add(categoryLocationsListView);
    }
    
    categoryLocationsListView.show();
    if (!categoryNavBar) _createAndAddCategoryNav();
    categoryNavBar.view.show();
    categoryNavBar.leftButton.show();
    categoryNavBar.titleLabel.text = viewModel.categoryName;
    categoryNavBar.rightButton.title = app.localDictionary.map;
    
    categoryLocationsListView.setData(viewModel.locations);
};

exports.openCategoryLocationsMapView = function (viewModel) {
    Ti.API.debug("openCategoryLocationsMapView() in MapWindowView");
    
    _hideAllViews();
    
    // If there isn't a categoryNavBar yet, go ahead and create one.
    if (!categoryNavBar) _createAndAddCategoryNav();
    
    categoryNavBar.view.show();
    mapView.show();

    categoryNavBar.titleLabel.text = app.localDictionary.browseLocations;
    categoryNavBar.rightButton.title = app.localDictionary.list;
    
    /*
        TODO Actually plot the points on the map.
    */
};

exports.openSearchView = function () {
    Ti.API.debug("openSearchView() in MapWindowView");
    _hideAllViews();
    if (searchBar) searchBar.input.show();
    if (mapView) {
        mapView.show();
    }
    else {
        // TODO Create a mapview, although it should already exist
    }
};

exports.openFavoritesBrowsingView = function () {
    Ti.API.debug("openFavoritesBrowsingView() in MapWindowView");
    _hideAllViews();
};

exports.openFavoritesMapView = function () {
    Ti.API.debug("openFavoritesMapView() in MapWindowView");
    _hideAllViews();
};

exports.doGetView = function () {
    //Named as such because of a Titanium Bug with iOS and beginning method name with "get" or "set"
    return _activeView;
};

exports.doSetView = function (newView, viewModel) {
    //Named as such because of a Titanium Bug with iOS and beginning method name with "get" or "set"

    //First we want to make sure the newView is legit
    //And set the _activeView to newView if it is.
    for (var _view in exports.views) {
        if (exports.views.hasOwnProperty(_view)) {
            if (exports.views[_view] === newView) {
                _activeView = newView;
                break;
            }
        }
    }
    
    // Now we want to actually show the proper view, presuming 
    // the newView matches the (hopefully) newly set _activeView
    if (_activeView === newView) {
        switch (newView) {
            case exports.views['SEARCH']:
                exports.openSearchView();
                break;
            case exports.views['CATEGORY_BROWSING']:
                exports.openCategoryBrowsingView(viewModel);
                break;
            case exports.views['CATEGORY_LOCATIONS_MAP']:
                exports.openCategoryLocationsMapView(viewModel);
                break;
            case exports.views['CATEGORY_LOCATIONS_LIST']:
                exports.openCategoryLocationsListView(viewModel);
                break;
            case exports.views['FAVORITES_BROWSING']:
                exports.openFavoritesBrowsingView();
                break;
            case exports.views['FAVORITES_MAP']:
                exports.openFavoritesMapView();
                break;
        }
    }
};

//Private methods
var _createMainView = function() {
    var mapViewOpts;

    titleBar = app.UI.createTitleBar({
        homeButton: true,
        settingsButton: false,
        title: app.localDictionary.map
    });
    view.add(titleBar);

    activityIndicator = app.UI.createActivityIndicator();
    view.add(activityIndicator);
    activityIndicator.hide();

    searchBar = app.UI.createSearchBar();
    view.add(searchBar.container);
    searchBar.input.addEventListener('return', _searchSubmit);
    searchBar.input.addEventListener('cancel', exports.searchBlur);

    if ((app.models.deviceProxy.isAndroid() && !mapView) || app.models.deviceProxy.isIOS()) {
        // create the map view
        mapViewOpts = _.clone(app.styles.mapView);
        if (app.config.DEFAULT_MAP_REGION) {
            Ti.API.info("Temporarily disabled default region in map.");
            mapViewOpts.region = app.config.DEFAULT_MAP_REGION;
        }

        mapView = Titanium.Map.createView(mapViewOpts);
        view.add(mapView);

        //This is how we have to listen for when a user clicks an annotation title, because Android is quirky with events on annotations.
        mapView.addEventListener("click", _onMapViewClick);
        mapView.addEventListener('regionChanged', exports.searchBlur);

        Ti.API.info("Map added with dimensions of: " + JSON.stringify(mapView.size) );
    }
    else {
        view.add(mapView);
    }

    bottomNavView = Ti.UI.createView(app.styles.mapNavView);
    view.add(bottomNavView);

    bottomNavButtons = Titanium.UI.createTabbedBar(app.styles.mapButtonBar);
    bottomNavButtons.labels = exports.navButtonValues;
    bottomNavButtons.width = 225;
    bottomNavView.add(bottomNavButtons);
    
    bottomNavButtons.addEventListener('click', function (e) {
        Ti.App.fireEvent(exports.events['NAV_BUTTON_CLICK'], {
            buttonName: exports.navButtonValues[e.index] || ''
        });
    });
    
    if (app.models.deviceProxy.isIOS()) {
        // create controls for zoomin / zoomout
        // included in Android by default
        bottomNavButtons.left = 5;

        zoomButtonBar = Titanium.UI.createButtonBar(app.styles.mapButtonBar);
        zoomButtonBar.labels =  ['+', '-'];
        zoomButtonBar.width = 75;
        zoomButtonBar.right = 5;
        
        if (mapView) {
            bottomNavView.add(zoomButtonBar);
        }
        else {
            Ti.API.error("mapView doesn't exist to place the zoomButtonBar into.");
        }
        
        Titanium.App.addEventListener(app.events['DIMENSION_CHANGES'], function (e) {
            zoomButtonBar.top = app.styles.mapButtonBar.top;
        });

        // add event listeners for the zoom buttons
        zoomButtonBar.addEventListener('click', function(e) {
            if (e.index == 0) {
                mapView.zoom(1);
            } else {
                mapView.zoom( - 1);
            }
        });
    }
};

var _searchSubmit = function (e) {
    Ti.API.debug('searchSubmit() in MapWindowController');
    exports.searchBlur();
    Ti.App.fireEvent(exports.events['SEARCH_SUBMIT'],{
        value: searchBar.input.value
    });
};

var _onMapViewClick = function (e) {
    exports.searchBlur();
    Ti.App.fireEvent(exports.events['MAPVIEW_CLICK'], {
        clicksource : e.clicksource,
        title       : e.title
    });
};

var _hideAllViews = function () {
    // This method hides all of the different views within this context,
    // so that the different methods don't have to worry about what views to close
    if (searchBar) searchBar.input.hide();
    if (mapView) mapView.hide();
    if (favoritesBar) favoritesBar.hide();
    if (categoryNavBar) categoryNavBar.view.hide();
    if (categoryBrowsingView) categoryBrowsingView.hide();
    if (categoryLocationsListView) categoryLocationsListView.hide();
};

var _createAndAddCategoryNav = function () {
    Ti.API.debug("_createAndAddCategoryNav() in MapWindowView");
    Ti.include('/js/views/SecondaryNav.js');
    categoryNavBar = new SecondaryNav();
    categoryNavBar.init(app);
    categoryNavBar.leftButton.text = app.localDictionary.back;
    view.add(categoryNavBar.view);
    categoryNavBar.view.top = app.styles.titleBar.height;
    
    categoryNavBar.rightButton.addEventListener('click', function (e) {
        Ti.App.fireEvent(exports.events['CATEGORY_RIGHT_BTN_CLICK']);
    });
};
  
exports.events = {
    SEARCH_SUBMIT               : "MapViewSearchSubmit",
    MAPVIEW_CLICK               : "MapViewClick",
    NAV_BUTTON_CLICK            : "MapNavButtonClick",
    DETAIL_CLICK                : "MapViewDetailClick",
    CATEGORY_ROW_CLICK          : "MapViewCategoryRowClick",
    CATEGORY_RIGHT_BTN_CLICK    : "MapViewCategoryRightButtonClick"
};

if (typeof localDictionary === "undefined") Ti.include('/js/localization.js');
var _locale = Titanium.App.Properties.getString('locale');

exports.navButtonValues = [
    localDictionary[_locale]['search'],
    localDictionary[_locale]['browse'],
    localDictionary[_locale]['favorites']
];

exports.views = {
    SEARCH                  : "MapWindowSearchView",
    CATEGORY_BROWSING       : "MapWindowCategoryBrowsing",
    CATEGORY_LOCATIONS_LIST : "MapWindowCategoryLocationsList",
    CATEGORY_LOCATIONS_MAP  : "MapWindowCategoryMap",
    FAVORITES_BROWSING      : "MapWindowFavoritesBrowsing",
    FAVORITES_MAP           : "MapWindowFavoritesMap"
};