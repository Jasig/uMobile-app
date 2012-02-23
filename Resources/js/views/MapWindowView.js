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

var view, mapProxy, activityIndicator, mapView, searchBar, titleBar, bottomNavView, bottomNavButtons, zoomButtonBar, categoryBrowsingView, categoryNavBar, categoryLocationsListView, favoritesBar,
_ = require('/js/libs/underscore-min'),
app = require('/js/Constants'),
styles = require('/js/style'),
localDictionary = require('/js/localization').retrieveLocale(Ti.App.Properties.getString('locale')),
deviceProxy = require('/js/models/DeviceProxy'),
config = require('/js/config');

// Public methods
exports.open = function () {
    mapProxy = require('/js/models/MapProxy');
    view = Ti.UI.createView();
    _createMainView();
    exports.resetMapLocation();
    
    return view;
};
exports.close = function () {
    categoryNavBar = null;
    categoryBrowsingView = null;
    categoryLocationsListView = null;
};

exports.plotPoints = function (points) {
    //Clears the map of all annotations, takes an array of points, creates annotations of them, and plots them on the map.
    mapView.removeAllAnnotations();
    for (var i=0, iLength = points.length; i<iLength; i++) {
        var _annotationParams, _annotation;
        _annotationParams = styles.mapAnnotation;
        _annotationParams.title = points[i].title || localDictionary.titleNotAvailable;
        _annotationParams.latitude = points[i].latitude;
        _annotationParams.longitude = points[i].longitude;
        _annotationParams.myid = 'annotation' + i;
        _annotationParams.subtitle = '';
        
        _annotation = Titanium.Map.createAnnotation(_annotationParams);
        mapView.addAnnotation(_annotation);
    }
    // Center the map around the active points
    mapView.setLocation(mapProxy.retrieveMapCenter());
    if (activityIndicator) activityIndicator.view.hide();
};

exports.hideActivityIndicator = function () {
    if (activityIndicator) activityIndicator.view.hide();
};

exports.showActivityIndicator = function () {
    if (activityIndicator) activityIndicator.view.show();
};

exports.saveActivityIndicatorMessage = function (message) {
    if (activityIndicator) activityIndicator.setLoadingMessage(message);
};

exports.resetMapLocation = function () {
    if (mapView && mapProxy) mapView.setLocation(mapProxy.retrieveMapCenter(true));
};

exports.searchBlur = function (e) {
    searchBar.input.blur();
};

exports.openCategoryBrowsingView = function (categories) {
    _hideAllViews();
    bottomNavButtons.doSetIndex(1);
    
    if (categories.length === 1) return exports.openCategoryLocationsListView(mapProxy.retrieveLocationsByCategory(categories[0].name));
    // If there isn't a categoryNavBar yet, go ahead and create one.
    if (!categoryNavBar) _createAndAddCategoryNav();
    
    categoryNavBar.view.show();
    categoryNavBar.leftButton.hide();
    categoryNavBar.titleLabel.text = localDictionary.browseLocations;
    categoryNavBar.rightButton.hide();
    categoryNavBar.rightButton.visible = false;
    
    if (categoryBrowsingView) return categoryBrowsingView.show();
    
    var _categoryBrowsingData = (function(c) {
        var _data = [], _labelStyle = _.clone(styles.mapCategoryCount), _rowStyle = _.clone(styles.mapCategoryRow), _categoryName;
        
        // Iterate through array of categories and create table view rows for user to select.
        for (var i=0, iLength = c.length; i<iLength; i++) {
            // Create a row with the category name
            _categoryName = c[i]['name'];
            _rowStyle.title = _categoryName;
            _data.push(Titanium.UI.createTableViewRow(_rowStyle));
            
            // Add a count to the row with number of children for category.
            Ti.API.debug(c[i]['numChildren']);
            _labelStyle.text = c[i]['numChildren'].toString();
            //Android is adding a decimal to this number for whatever reason, so we'll replace the string.
            if (deviceProxy.isAndroid() && _labelStyle.text.indexOf('.0') > -1) _labelStyle.text = _labelStyle.text.replace('.0','');
            _data[i].add(Ti.UI.createLabel(_labelStyle));
            
            if (deviceProxy.isAndroid()) {
                // This was causing double titles to be displayed in iOS. If it looks bad in Android, remove it altogether.
                // See UMOBILE-224 for backstory.
                // Add the label for the row
                var _categoryLabel = Ti.UI.createLabel({
                    text: _categoryName,
                    left: '10dp',
                    color: "#000"
                });
                _data[i].add(_categoryLabel);
            }
            
            // Add a listener to the row to let the controller 
            // know the user wants to explore the category

            function setClickEvent (sourceObject, categoryTitle) {
                sourceObject.addEventListener('click', function (e) {
                    Ti.App.fireEvent("MapViewCategoryRowClick", { category : categoryTitle });
                });
            }
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
    _hideAllViews();
    bottomNavButtons.doSetIndex(1);
    
    if (!categoryLocationsListView) {
        categoryLocationsListView = Ti.UI.createTableView(styles.mapTableView);
        view.add(categoryLocationsListView);
        categoryLocationsListView.addEventListener('click', function (e) {
            Ti.App.fireEvent(exports.events['CATEGORY_LIST_ITEM_CLICK'], {title:e.rowData.title});
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
    _hideAllViews();
    bottomNavButtons.doSetIndex(1);
    
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
    _hideAllViews();
    bottomNavButtons.doSetIndex(0);
    if (searchBar) searchBar.show();
    if (zoomButtonBar) zoomButtonBar.show();
    if (mapView) mapView.show();
};

exports.openFavoritesBrowsingView = function () {
    //TODO: Implement this view
    _hideAllViews();
    bottomNavButtons.doSetIndex(2);
};

exports.openFavoritesMapView = function () {
    // TODO: Implement this view
    _hideAllViews();
    bottomNavButtons.doSetIndex(2);
    if (zoomButtonBar) zoomButtonBar.show();
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

        mapView = Titanium.Map.createView(mapViewOpts);
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
        bottomNavButtons.doSetIndex(0);
    }
    bottomNavView.add(deviceProxy.isAndroid() ? bottomNavButtons.view : bottomNavButtons);
    
    bottomNavButtons.addEventListener('click', function (e) {
        Ti.App.fireEvent(exports.events['NAV_BUTTON_CLICK'], {
            buttonName: exports.navButtonValues[e.index] || ''
        });
    });
    
    if (deviceProxy.isIOS()) {
        // create controls for zoomin / zoomout
        // included in Android by default
        bottomNavButtons.left = 5;

        zoomButtonBar = Titanium.UI.createButtonBar(styles.mapButtonBar);
        zoomButtonBar.labels =  ['+', '-'];
        zoomButtonBar.width = 75;
        zoomButtonBar.right = 5;
        
        if (mapView) {
            bottomNavView.add(zoomButtonBar);
        }
        
        Titanium.App.addEventListener(app.events['DIMENSION_CHANGES'], function (e) {
            zoomButtonBar.top = styles.mapButtonBar.top;
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
    _activeView = exports.views['SEARCH'];
};

var _searchSubmit = function (e) {
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
    if (searchBar) searchBar.hide();
    if (mapView) mapView.hide();
    if (zoomButtonBar) zoomButtonBar.hide();
    if (favoritesBar) favoritesBar.hide();
    if (categoryNavBar) categoryNavBar.hide();
    if (categoryBrowsingView) categoryBrowsingView.hide();
    if (categoryLocationsListView) categoryLocationsListView.hide();
};

var _createAndAddCategoryNav = function () {
    categoryNavBar = require('/js/views/UI/SecondaryNav').createSecondaryNav();
    view.add(categoryNavBar.view);
    categoryNavBar.view.top = styles.titleBar.height + 'dp';
    
    categoryNavBar.leftButton.addEventListener('click', function (e) {
        Ti.App.fireEvent(exports.events['CATEGORY_LEFT_BTN_CLICK']);
    });
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
    CATEGORY_RIGHT_BTN_CLICK    : "MapViewCategoryRightButtonClick",
    CATEGORY_LEFT_BTN_CLICK     : "MapViewCategoryLeftButtonClick",
    CATEGORY_LIST_ITEM_CLICK    : "MapViewCategoryListItemClick"
};

exports.navButtonValues = [
    localDictionary['search'],
    localDictionary['browse']
];

exports.views = {
    SEARCH                  : "MapWindowSearchView",
    CATEGORY_BROWSING       : "MapWindowCategoryBrowsing",
    CATEGORY_LOCATIONS_LIST : "MapWindowCategoryLocationsList",
    CATEGORY_LOCATIONS_MAP  : "MapWindowCategoryMap",
    FAVORITES_BROWSING      : "MapWindowFavoritesBrowsing",
    FAVORITES_MAP           : "MapWindowFavoritesMap"
};