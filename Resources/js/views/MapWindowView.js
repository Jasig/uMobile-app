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

//Local variables, starting with UI
var win,
    view, 
    activityIndicator, 
    mapView, 
    searchBar, 
    titleBar, 
    bottomNavView, 
    bottomNavButtons, 
    zoomButtonBar, 
    categoryBrowsingView, 
    categoryNavBar, 
    categoryLocationsListView, 
    favoritesBar,

    //Local Data
    _categoryResultsPerPage = -1,
    _activeCategory,
    _activeView,
    //"activityStack" consists of objects containing the view and data associated with each state, for back buttons. Doesn't persist between uses of app module.
    activityStack,

    //Private Methods
    _createAndAddCategoryNav, 
    _hideAllViews, 
    _onMapViewClick, 
    _searchSubmit, 
    _createMainView, 
    _onViewDetailOnMap, 
    _onAndroidSearch, 
    _onCategoryRowClick, 
    _onMapSearch, 
    _onCategoryRightBtnClick, 
    _onCategoryListItemClick, 
    _onMapViewClick, 
    _onNavButtonClick, 

    //Module Singletons
    _ = require('/js/libs/underscore-min'),
    app = require('/js/Constants'),
    styles = require('/js/style'),
    localDictionary = require('/js/localization').retrieveLocale(Ti.App.Properties.getString('locale')),
    deviceProxy = require('/js/models/DeviceProxy'),
    config = require('/js/config'),
    mapDetailView = require('/js/views/MapDetailView'),
    mapProxy = require('/js/models/MapProxy')
;

// Public methods
exports.open = function () {
    Ti.API.debug('open() in MapWindowView');
    //Access the map proxy singleton, but map controller handles initializing it
    mapProxy = require('/js/models/MapProxy');

    win = Ti.UI.createWindow(styles.mapWindow);
    win.open();

    view = Ti.UI.createView();
    _createMainView();
    exports.resetMapLocation();

    activityStack = [];
    //Temporary map browsing history
    activityStack.push({
        view: exports.views.SEARCH,
        model: {}
    });

    win.addEventListener('android:search', _onAndroidSearch);
    Ti.App.addEventListener(mapDetailView.events.VIEW_ON_MAP_CLICK, _onViewDetailOnMap);
    Ti.App.addEventListener(exports.events.DETAIL_CLICK, exports.openDetailView);
    Ti.App.addEventListener(exports.events.NAV_BUTTON_CLICK, _onNavButtonClick);
    Ti.App.addEventListener(exports.events.MAPVIEW_CLICK, _onMapViewClick);
    Ti.App.addEventListener(exports.events.CATEGORY_LIST_ITEM_CLICK, _onCategoryListItemClick);
    Ti.App.addEventListener(exports.events.CATEGORY_RIGHT_BTN_CLICK, _onCategoryRightBtnClick);
    Ti.App.addEventListener(exports.events.SEARCH_SUBMIT, _onMapSearch);
    Ti.App.addEventListener(exports.events.CATEGORY_ROW_CLICK, _onCategoryRowClick);

    win.add(view);
};

exports.close = function () {
    Ti.API.debug('close() in MapWindowView');
    exports.searchBlur();
    categoryNavBar = null;
    categoryBrowsingView = null;
    categoryLocationsListView = null;
    activityStack = [];

    win.removeEventListener('android:search', _onAndroidSearch);
    Ti.App.removeEventListener(mapDetailView.events.VIEW_ON_MAP_CLICK, _onViewDetailOnMap);
    Ti.App.removeEventListener(exports.events.DETAIL_CLICK, exports.openDetailView);
    Ti.App.removeEventListener(exports.events.NAV_BUTTON_CLICK, _onNavButtonClick);
    Ti.App.removeEventListener(exports.events.MAPVIEW_CLICK, _onMapViewClick);
    Ti.App.removeEventListener(exports.events.CATEGORY_RIGHT_BTN_CLICK, _onCategoryRightBtnClick);
    Ti.App.removeEventListener(exports.events.SEARCH_SUBMIT, _onMapSearch);
    Ti.App.removeEventListener(exports.events.CATEGORY_ROW_CLICK, _onCategoryRowClick);

    win.close();
};

exports.showAlert = function (message, title, buttonNames) {
    Ti.API.debug('showAlert() in MapWindowView');
    var alertDialog = Ti.UI.createAlertDialog({
        title: title || localDictionary.error,
        message: message,
        buttonNames: buttonNames || [localDictionary.OK]
    });
    alertDialog.show();
};

exports.goBack = function (){
    Ti.API.debug('Go back in MapWindowView');
    Ti.API.debug(JSON.stringify(activityStack));
    //Let's clear the current view in the activity stack
    activityStack.pop();
    var _prev = activityStack[activityStack.length - 1];
    Ti.API.debug(JSON.stringify(_prev));
    
    exports.doSetView(_prev.view, _prev.model);
};

exports.plotPoints = function (points) {
    var _annotationParams, _annotation, i, iLength;
    Ti.API.debug('plotPoints() in MapWindowView');
    Ti.API.debug(JSON.stringify(points));
    //Clears the map of all annotations, takes an array of points, creates annotations of them, and plots them on the map.
    mapView.removeAllAnnotations();

    iLength = points.length;
    for (i=0; i<iLength; i++) {
        _annotationParams = styles.mapAnnotation;
        _annotationParams.title = points[i].title || localDictionary.titleNotAvailable;
        _annotationParams.latitude = points[i].latitude;
        _annotationParams.longitude = points[i].longitude;
        _annotationParams.myid = 'annotation' + i;
        _annotationParams.subtitle = '';
        
        _annotation = Ti.Map.createAnnotation(_annotationParams);
        mapView.addAnnotation(_annotation);
    }
    // Center the map around the active points
    mapView.setLocation(mapProxy.retrieveMapCenter());
    if (activityIndicator) activityIndicator.view.hide();
};

exports.hideActivityIndicator = function () {
    Ti.API.debug('hideActivityIndicator() in MapWindowView');
    if (activityIndicator) activityIndicator.view.hide();
};

exports.showActivityIndicator = function () {
    Ti.API.debug('showActivityIndicator() in MapWindowView');
    if (activityIndicator) activityIndicator.view.show();
};

exports.saveActivityIndicatorMessage = function (message) {
    Ti.API.debug('saveActivityIndicatorMessage() in MapWindowView');
    if (activityIndicator) activityIndicator.setLoadingMessage(message);
};

exports.resetMapLocation = function () {
    Ti.API.debug('resetMapLocation() in MapWindowView');
    if (mapView && mapProxy) mapView.setLocation(mapProxy.retrieveMapCenter(true));
};

exports.searchBlur = function (e) {
    Ti.API.debug('searchBlur() in MapWindowView');
    searchBar.input.blur();
};

exports.openDetailView = function (location){
    Ti.API.debug('openDetailView() in MapWindowView');
    activityStack.push({
        view: exports.views.LOCATION_DETAIL,
        model: {}
    });
    mapDetailView.render(location);
    //Open a detail view.
};

exports.openCategoryBrowsingView = function (categories) {
    Ti.API.debug('openCategoryBrowsingView() in MapWindowView');
    Ti.API.debug(JSON.stringify(categories));
    //Track history
    activityStack.push({
        view: exports.views.CATEGORY_LOCATIONS_LIST,
        model: categories
    });

    _hideAllViews();
    if (deviceProxy.isAndroid()) bottomNavButtons.doSetIndex(1);
    
    if (categories.length === 1) return exports.openCategoryLocationsListView(mapProxy.retrieveLocationsByCategory(categories[0].name));
    // If there isn't a categoryNavBar yet, go ahead and create one.
    if (!categoryNavBar) _createAndAddCategoryNav();
    
    categoryNavBar.view.show();
    categoryNavBar.leftButton.hide();
    categoryNavBar.titleLabel.text = localDictionary.browseLocations;
    categoryNavBar.rightButton.hide();
    categoryNavBar.rightButton.visible = false;
    
    if (categoryBrowsingView) return categoryBrowsingView.show();
    
    function setClickEvent (sourceObject, categoryTitle) {
        sourceObject.addEventListener('click', function (e) {
            Ti.App.fireEvent("MapViewCategoryRowClick", { category : categoryTitle });
        });
    }

    var _categoryBrowsingData = (function(c) {
        var _data = [], _labelStyle = _.clone(styles.mapCategoryCount), _rowStyle = _.clone(styles.mapCategoryRow), _categoryName, i, iLength, _categoryLabel;
        
        // Iterate through array of categories and create table view rows for user to select.
        iLength = c.length;
        for (i=0; i<iLength; i++) {
            // Create a row with the category name
            _categoryName = c[i].name;
            _rowStyle.title = _categoryName;
            _data.push(Ti.UI.createTableViewRow(_rowStyle));
            
            // Add a count to the row with number of children for category.
            _labelStyle.text = c[i].numChildren.toString();
            //Android is adding a decimal to this number for whatever reason, so we'll replace the string.
            if (deviceProxy.isAndroid() && _labelStyle.text.indexOf('.0') > -1) _labelStyle.text = _labelStyle.text.replace('.0','');
            _data[i].add(Ti.UI.createLabel(_labelStyle));
            
            if (deviceProxy.isAndroid()) {
                // This was causing double titles to be displayed in iOS. If it looks bad in Android, remove it altogether.
                // See UMOBILE-224 for backstory.
                // Add the label for the row
                _categoryLabel = Ti.UI.createLabel({
                    text: _categoryName,
                    left: '10dp',
                    color: "#000"
                });
                _data[i].add(_categoryLabel);
            }
            
            // Add a listener to the row to let the controller 
            // know the user wants to explore the category
            setClickEvent(_data[i], _categoryName);
        }
        
        return _data;
    })(categories);
    
    // Create the view to hold tableviews listing categories and locations.
    categoryBrowsingView = Ti.UI.createTableView(styles.mapTableView);
    categoryBrowsingView.setData(_categoryBrowsingData);
    view.add(categoryBrowsingView);
};

exports.openCategoryLocationsListView = function (viewModel) {
    Ti.API.debug('openCategoryLocationsListView() in MapWindowView');
    activityStack.push({
        view: exports.views.CATEGORY_LOCATIONS_LIST,
        model: {}
    });
    _hideAllViews();
    if (deviceProxy.isAndroid()) bottomNavButtons.doSetIndex(1);
    
    if (!categoryLocationsListView) {
        categoryLocationsListView = Ti.UI.createTableView(styles.mapTableView);
        view.add(categoryLocationsListView);
        categoryLocationsListView.addEventListener('click', function (e) {
            Ti.App.fireEvent(exports.events.CATEGORY_LIST_ITEM_CLICK, {title:e.rowData.title});
        });
    }
    
    categoryLocationsListView.show();
    if (!categoryNavBar) _createAndAddCategoryNav();
    categoryNavBar.view.show();
    
    categoryNavBar.leftButton[mapProxy.retrieveTotalCategories() > 1 ? 'show' : 'hide']();
    categoryNavBar.titleLabel.text = viewModel.categoryName;
    categoryNavBar.rightButton.title = localDictionary.map;
    categoryNavBar.rightButton.show();
    
    categoryLocationsListView.setData(viewModel.locations);
};

exports.openCategoryLocationsMapView = function (viewModel) {
    Ti.API.debug('openCategoryLocationsMapView() in MapWindowView');
    activityStack.push({
        view: exports.views.CATEGORY_LOCATIONS_MAP,
        model: viewModel
    });
    _hideAllViews();
    if (deviceProxy.isAndroid()) bottomNavButtons.doSetIndex(1);
    
    if (zoomButtonBar) zoomButtonBar.show();
    
    // If there isn't a categoryNavBar yet, go ahead and create one.
    if (!categoryNavBar) _createAndAddCategoryNav();
    
    categoryNavBar.view.show();
    mapView.show();

    categoryNavBar.titleLabel.text = localDictionary.browseLocations;
    categoryNavBar.rightButton.title = localDictionary.list;
    categoryNavBar.rightButton.show();
    
    exports.plotPoints(viewModel.locations);
};

exports.openSearchView = function () {
    Ti.API.debug('openSearchView() in MapWindowView');
    activityStack.push({
        view: exports.views.SEARCH,
        model: {}
    });
    //TODO: Support opening with a query
    _hideAllViews();
    if (deviceProxy.isAndroid()) bottomNavButtons.doSetIndex(0);
    if (searchBar) searchBar.show();
    if (zoomButtonBar) zoomButtonBar.show();
    if (mapView) mapView.show();
};

exports.openFavoritesBrowsingView = function () {
    Ti.API.debug('openFavoritesBrowsingView() in MapWindowView');
    activityStack.push({
        view: exports.views.FAVORITES_BROWSING,
        model: {}
    });
    //TODO: Implement this view
    _hideAllViews();
    if (deviceProxy.isAndroid()) bottomNavButtons.doSetIndex(2);
};

exports.openFavoritesMapView = function () {
    Ti.API.debug('openFavoritesMapView() in MapWindowView');
    activityStack.push({
        view: exports.views.FAVORITES_MAP,
        model: {}
    });
    // TODO: Implement this view
    _hideAllViews();
    if (deviceProxy.isAndroid()) bottomNavButtons.doSetIndex(2);
    if (zoomButtonBar) zoomButtonBar.show();
};

exports.doGetView = function () {
    Ti.API.debug('doGetView() in MapWindowView');
    //Named as such because of a Ti Bug with iOS and beginning method name with "get" or "set"
    return _activeView;
};

exports.doSetView = function (newView, viewModel) {
    Ti.API.debug('doSetView() in MapWindowView');
    Ti.API.debug('newView: ' + JSON.stringify(newView));
    Ti.API.debug('viewModel: '+ JSON.stringify(viewModel));

    var _view;
    //Named as such because of a Titanium Bug with iOS and beginning method name with "get" or "set"

    //First we want to make sure the newView is legit
    //And set the _activeView to newView if it is.
    for (_view in exports.views) {
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
            case exports.views.SEARCH:
                exports.openSearchView();
                break;
            case exports.views.CATEGORY_BROWSING:
                exports.openCategoryBrowsingView(viewModel);
                break;
            case exports.views.CATEGORY_LOCATIONS_MAP:
                exports.openCategoryLocationsMapView(viewModel);
                break;
            case exports.views.CATEGORY_LOCATIONS_LIST:
                exports.openCategoryLocationsListView(viewModel);
                break;
            case exports.views.FAVORITES_BROWSING:
                exports.openFavoritesBrowsingView();
                break;
            case exports.views.FAVORITES_MAP:
                exports.openFavoritesMapView();
                break;
        }
    }
};

//Private methods
_onCategoryRowClick = function (e) {
    Ti.API.debug('_onCategoryRowClick()');
    // Will receive an event, with "category" string property
    // Tell the map window view to open the locations list, and pass 
    // collection of locations for that category
    _activeCategory = e.category;
    exports.doSetView(exports.views.CATEGORY_LOCATIONS_LIST, mapProxy.retrieveLocationsByCategory(e.category, _categoryResultsPerPage));
};

// Mapview events
_onMapSearch = function(e) {
    Ti.API.debug('_onMapSearch() in MapWindowView');
    mapProxy.search(e.value);
};

_onCategoryRightBtnClick = function (e) {
    Ti.API.debug('_onCategoryRightBtnClick() in MapWindowView');
    // Will respond when user presses the right-side button in 
    // map category view navigation
    
    // Will get the current active view, and determine what view
    // Should be shown.
    switch (exports.doGetView()) {
        case exports.views.CATEGORY_LOCATIONS_LIST:
            exports.doSetView(exports.views.CATEGORY_LOCATIONS_MAP, mapProxy.retrieveLocationsByCategory(_activeCategory || '', _categoryResultsPerPage));
            break;
        case exports.views.CATEGORY_LOCATIONS_MAP:
            exports.doSetView(exports.views.CATEGORY_LOCATIONS_LIST, mapProxy.retrieveLocationsByCategory(_activeCategory, _categoryResultsPerPage));
            break;
        default:
            return;
    }
};

_onCategoryListItemClick = function (e) {
    Ti.API.debug('_onCategoryListItemClick() in MapWindowView');
    //Called when the user clicks a specific location in a category 
    //list view, such as "10 W Amistad". Opens detail view
    var _annotation = mapProxy.retrieveAnnotationByTitle(e.title);
    exports.openDetailView(_annotation);
};

_onMapViewClick = function (e) {
    Ti.API.debug('_onMapViewClick() in MapWindowView');
    Ti.API.debug(JSON.stringify(e));
    var _annotation;
    if (e.clicksource !== 'title' || !e.title) return;
    // _mapWindowView.searchBlur(); //Search should already be blurred...
    _annotation = mapProxy.retrieveAnnotationByTitle(e.title);
    exports.openDetailView(_annotation);
};

_onNavButtonClick = function (e) {
    Ti.API.debug('_onNavButtonClick() in MapWindowView');
    Ti.API.debug(JSON.stringify(e));
    switch (e.buttonName) {
        case exports.navButtonValues[0]:
            exports.doSetView(exports.views.SEARCH);
            break;
        case exports.navButtonValues[1]:
            exports.doSetView(exports.views.CATEGORY_BROWSING, mapProxy.retrieveCategoryList());
            break;
        default:
            Ti.API.error("No case matched in _handleNavButtonClick");
    }
};
_onAndroidSearch = function (e) {
    Ti.API.debug('_onAndroidSearch() in MapWindowView');
    exports.doSetView(exports.views.CATEGORY_LOCATIONS_MAP);
};

_onViewDetailOnMap = function (e) {
    Ti.API.debug('_onViewDetailOnMap() in MapWindowView');
    Ti.API.debug(JSON.stringify(e));
    exports.doSetView(exports.views.CATEGORY_LOCATIONS_MAP, {locations: [mapProxy.retrieveAnnotationByTitle(e.title, true)]});
    mapDetailView.hide();
};

_createMainView = function() {
    Ti.API.debug('_createMainView() in MapWindowView');
    var mapViewOpts;
    
    deviceProxy = require('/js/models/DeviceProxy');
    
    activityIndicator = require('/js/views/UI/ActivityIndicator').createActivityIndicator();
    view.add(activityIndicator.view);
    activityIndicator.view.hide();
    
    titleBar = require('/js/views/UI/TitleBar').createTitleBar();
    titleBar.updateTitle(localDictionary.map);
    titleBar.addHomeButton();
    view.add(titleBar.view);

    if ((deviceProxy.isAndroid() && !mapView) || deviceProxy.isIOS()) {
        // create the map view
        mapViewOpts = _.clone(styles.mapView);
        if (config.DEFAULT_MAP_REGION) {
            mapViewOpts.region = config.DEFAULT_MAP_REGION;
        }

        mapView = Ti.Map.createView(mapViewOpts);
        view.add(mapView);

        //This is how we have to listen for when a user clicks an annotation title, because Android is quirky with events on annotations.
        mapView.addEventListener("click", _onMapViewClick);
        mapView.addEventListener('regionChanged', exports.searchBlur);
    }
    else {
        view.add(mapView);
    }

    searchBar = require('/js/views/UI/SearchBar').createSearchBar();
    view.add(searchBar.container);
    searchBar.input.addEventListener('return', _searchSubmit);
    searchBar.input.addEventListener('cancel', exports.searchBlur);

    bottomNavView = Ti.UI.createView(styles.mapNavView);
    view.add(bottomNavView);
    if (deviceProxy.isIOS()) {
        bottomNavButtons = Ti.UI.iOS.createTabbedBar(styles.mapButtonBar);
        bottomNavButtons.labels = exports.navButtonValues;
        bottomNavButtons.index = 0;        
    }
    else {
        bottomNavButtons = require('/js/views/UI/TabbedBar').createTabbedBar();
        bottomNavButtons.doSetLabels(exports.navButtonValues);
        if (deviceProxy.isAndroid()) bottomNavButtons.doSetIndex(0);
    }
    bottomNavView.add(deviceProxy.isAndroid() ? bottomNavButtons.view : bottomNavButtons);
    
    bottomNavButtons.addEventListener('click', function (e) {
        Ti.App.fireEvent(exports.events.NAV_BUTTON_CLICK, {
            buttonName: exports.navButtonValues[e.index] || ''
        });
    });
    
    if (deviceProxy.isIOS()) {
        // create controls for zoomin / zoomout
        // included in Android by default
        bottomNavButtons.left = 5;

        zoomButtonBar = Ti.UI.createButtonBar(styles.mapButtonBar);
        zoomButtonBar.labels =  ['+', '-'];
        zoomButtonBar.width = 75;
        zoomButtonBar.right = 5;
        
        if (mapView) {
            bottomNavView.add(zoomButtonBar);
        }
        
        Ti.App.addEventListener(app.events.DIMENSION_CHANGES, function (e) {
            zoomButtonBar.top = styles.mapButtonBar.top;
        });

        // add event listeners for the zoom buttons
        zoomButtonBar.addEventListener('click', function(e) {
            mapView.zoom(e.index ===0 ? 1 : -1);
        });
    }
    _activeView = exports.views.SEARCH;
};

_searchSubmit = function (e) {
    Ti.API.debug('_searchSubmit() in MapWindowView');
    exports.searchBlur();
    Ti.App.fireEvent(exports.events.SEARCH_SUBMIT,{
        value: searchBar.input.value
    });
};

_onMapViewClick = function (e) {
    Ti.API.debug('_onMapViewClick() in MapWindowView');
    exports.searchBlur();
    Ti.App.fireEvent(exports.events.MAPVIEW_CLICK, {
        clicksource : e.clicksource,
        title       : e.title
    });
};

_hideAllViews = function () {
    Ti.API.debug('_hideAllViews() in MapWindowView');
    // This method hides all of the different views within this context,
    // so that the different methods don't have to worry about what views to close
    if (searchBar) searchBar.hide();
    if (mapView) mapView.hide();
    if (zoomButtonBar) zoomButtonBar.hide();
    if (favoritesBar) favoritesBar.hide();
    if (categoryNavBar) categoryNavBar.hide();
    if (categoryBrowsingView) categoryBrowsingView.hide();
    if (categoryLocationsListView) categoryLocationsListView.hide();
};

_createAndAddCategoryNav = function () {
    Ti.API.debug('_createAndAddCategoryNav() in MapWindowView');
    categoryNavBar = require('/js/views/UI/SecondaryNav').createSecondaryNav();
    view.add(categoryNavBar.view);
    categoryNavBar.view.top = styles.titleBar.height + 'dp';
    
    categoryNavBar.leftButton.addEventListener('click', function (e) {
        exports.goBack();
    });
    categoryNavBar.rightButton.addEventListener('click', function (e) {
        Ti.App.fireEvent(exports.events.CATEGORY_RIGHT_BTN_CLICK);
    });
};
  
exports.events = {
    SEARCH_SUBMIT               : "MapViewSearchSubmit",
    MAPVIEW_CLICK               : "MapViewClick",
    NAV_BUTTON_CLICK            : "MapNavButtonClick",
    DETAIL_CLICK                : "MapViewDetailClick",
    CATEGORY_ROW_CLICK          : "MapViewCategoryRowClick",
    CATEGORY_RIGHT_BTN_CLICK    : "MapViewCategoryRightButtonClick",
    CATEGORY_LEFT_BTN_CLICK     : "MapViewCategoryLeftButtonClick",
    CATEGORY_LIST_ITEM_CLICK    : "MapViewCategoryListItemClick"
};

exports.navButtonValues = [
    localDictionary.search,
    localDictionary.browse
];

exports.views = {
    SEARCH                  : "MapWindowSearchView",
    CATEGORY_BROWSING       : "MapWindowCategoryBrowsing",
    CATEGORY_LOCATIONS_LIST : "MapWindowCategoryLocationsList",
    CATEGORY_LOCATIONS_MAP  : "MapWindowCategoryMap",
    LOCATION_DETAIL         : "MapWindowLocationDetail",
    FAVORITES_BROWSING      : "MapWindowFavoritesBrowsing",
    FAVORITES_MAP           : "MapWindowFavoritesMap"
};