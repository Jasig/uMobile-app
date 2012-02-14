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

exports.events = {
    LOAD_DETAIL : 'loaddetail'
};
    
var _locationDetailView, _activeCategory, _mapWindowView, _mapDetailView, _mapProxy, _win, localDictionary, deviceProxy, styles,
_categoryResultsPerPage = 10;

exports.open = function (parameters) {
    _mapWindowView = require('/js/views/MapWindowView');
    _mapDetailView = require('/js/views/MapDetailView');
    _mapProxy = require('/js/models/MapProxy');
    localDictionary = require('/js/localization')[Ti.App.Properties.getString('locale')];
    deviceProxy = require('/js/models/DeviceProxy');
    styles = require('/js/style');

    _win = Titanium.UI.createWindow({
        // url: 'js/views/WindowContext.js',
        backgroundColor: styles.backgroundColor,
        exitOnClose: false,
        navBarHidden: true,
        orientationModes: [
        	Titanium.UI.PORTRAIT,
        	Titanium.UI.UPSIDE_PORTRAIT,
        	Titanium.UI.LANDSCAPE_LEFT,
        	Titanium.UI.LANDSCAPE_RIGHT
        ]
    });
    _win.open();
    
    Ti.App.addEventListener(_mapProxy.events['SEARCHING'], _onProxySearching);
    Ti.App.addEventListener(_mapProxy.events['SEARCH_COMPLETE'], _onProxySearchComplete);
    Ti.App.addEventListener(_mapProxy.events['EMPTY_SEARCH'], _onProxyEmptySearch);
    Ti.App.addEventListener(_mapProxy.events['LOAD_ERROR'], _onProxyLoadError);
    Ti.App.addEventListener(_mapProxy.events['LOADING'], _onProxyLoading);
    Ti.App.addEventListener(_mapProxy.events['POINTS_LOADED'], _onProxyLoaded);
    Ti.App.addEventListener(_mapWindowView.events['SEARCH_SUBMIT'], _onMapSearch);
    Ti.App.addEventListener(_mapWindowView.events['MAPVIEW_CLICK'], _onMapViewClick);
    Ti.App.addEventListener(_mapWindowView.events['DETAIL_CLICK'], _loadDetail);
    Ti.App.addEventListener(_mapWindowView.events['NAV_BUTTON_CLICK'], _onNavButtonClick);
    Ti.App.addEventListener(_mapWindowView.events['CATEGORY_ROW_CLICK'], _onCategoryRowClick);
    Ti.App.addEventListener(_mapWindowView.events['CATEGORY_RIGHT_BTN_CLICK'], _onCategoryRightBtnClick);
    Ti.App.addEventListener(_mapWindowView.events['CATEGORY_LEFT_BTN_CLICK'], _onCategoryLeftBtnClick);
    Ti.App.addEventListener(_mapWindowView.events['CATEGORY_LIST_ITEM_CLICK'], _onCategoryListItemClick);
    Ti.App.addEventListener(_mapDetailView.events['VIEW_ON_MAP_CLICK'], _onViewDetailOnMap);
    _win.addEventListener('android:search', _onAndroidSearch);
    
    _mapProxy.initialize();
    
    _win.add(_mapWindowView.open());
    //If we're supposed to directly open a detail view, let's get the info from map proxy and show it.
    if (parameters && parameters.id) _loadDetail(_mapProxy.retrieveAnnotationByAbbr(parameters.id));
    _mapWindowView.hideActivityIndicator();
};

exports.close = function (options) {
    _mapWindowView.searchBlur();
    
    Ti.App.removeEventListener(_mapProxy.events['SEARCHING'], _onProxySearching);
    Ti.App.removeEventListener(_mapProxy.events['SEARCH_COMPLETE'], _onProxySearchComplete);
    Ti.App.removeEventListener(_mapProxy.events['EMPTY_SEARCH'], _onProxyEmptySearch);
    Ti.App.removeEventListener(_mapProxy.events['LOAD_ERROR'], _onProxyLoadError);
    Ti.App.removeEventListener(_mapProxy.events['LOADING'], _onProxyLoading);
    Ti.App.removeEventListener(_mapProxy.events['POINTS_LOADED'], _onProxyLoaded);
    Ti.App.removeEventListener(_mapWindowView.events['SEARCH_SUBMIT'], _onMapSearch);
    Ti.App.removeEventListener(_mapWindowView.events['MAPVIEW_CLICK'], _onMapViewClick);
    Ti.App.removeEventListener(_mapWindowView.events['DETAIL_CLICK'], _loadDetail);
    Ti.App.removeEventListener(_mapWindowView.events['NAV_BUTTON_CLICK'], _onNavButtonClick);
    Ti.App.removeEventListener(_mapWindowView.events['CATEGORY_ROW_CLICK'], _onCategoryRowClick);
    Ti.App.removeEventListener(_mapWindowView.events['CATEGORY_RIGHT_BTN_CLICK'], _onCategoryRightBtnClick);
    Ti.App.removeEventListener(_mapWindowView.events['CATEGORY_LEFT_BTN_CLICK'], _onCategoryLeftBtnClick);
    Ti.App.removeEventListener(_mapWindowView.events['CATEGORY_LIST_ITEM_CLICK'], _onCategoryListItemClick);
    Ti.App.removeEventListener(_mapDetailView.events['VIEW_ON_MAP_CLICK'], _onViewDetailOnMap);
    _win.removeEventListener('android:search', _onAndroidSearch);
    
    _mapWindowView.close();
    
    _locationDetailView = null;
    _mapDetailView = null;
    
    _win.close();
};

exports.rotate = function (orientation) {
    if (_mapWindowView) _mapWindowView.rotate(orientation);
    if (_mapDetailView) _mapDetailView.rotate(orientation);
};

function _loadDetail (_annotation) {
    //Create and open the view for the map detail
    _mapWindowView.saveActivityIndicatorMessage(localDictionary.loading);
    _mapWindowView.showActivityIndicator();
    _mapWindowView.searchBlur();

    if (!_locationDetailView) {
        _locationDetailView = _mapDetailView.detailView;
        _win.add(_locationDetailView);
    }
    _mapDetailView.render(_annotation);
    
    _locationDetailView.show();

    _mapWindowView.hideActivityIndicator();
}

// Mapview events
function _onMapSearch (e) {
    _mapProxy.search(e.value);
}

function _onMapViewClick (e) {
    var _annotation;
    if (e.clicksource !== 'title' || !e.title) return;
    // _mapWindowView.searchBlur(); //Search should already be blurred...
    _annotation = _mapProxy.retrieveAnnotationByTitle(e.title);
    _loadDetail(_annotation);
}

function _onNavButtonClick (e) {
    switch (e.buttonName) {
        case _mapWindowView.navButtonValues[0]:
            _mapWindowView.doSetView(_mapWindowView.views['SEARCH']);
            break;
        case _mapWindowView.navButtonValues[1]:
            _mapWindowView.doSetView(_mapWindowView.views['CATEGORY_BROWSING'], _mapProxy.retrieveCategoryList());
            break;
        default:
            Ti.API.error("No case matched in _handleNavButtonClick");
    }
}

function _onCategoryRowClick (e) {
    // Will receive an event, with "category" string property
    // Tell the map window view to open the locations list, and pass 
    // collection of locations for that category
    _activeCategory = e.category;
    _mapWindowView.doSetView(_mapWindowView.views['CATEGORY_LOCATIONS_LIST'], _mapProxy.retrieveLocationsByCategory(e.category, _categoryResultsPerPage));
}

function _onCategoryListItemClick (e) {
    //Called when the user clicks a specific location in a category 
    //list view, such as "10 W Amistad". Opens detail view
    var _annotation = _mapProxy.retrieveAnnotationByTitle(e.title);
    _loadDetail(_annotation);
}

function _onCategoryRightBtnClick (e) {
    // Will respond when user presses the right-side button in 
    // map category view navigation
    
    // Will get the current active view, and determine what view
    // Should be shown.
    switch (_mapWindowView.doGetView()) {
        case _mapWindowView.views['CATEGORY_LOCATIONS_LIST']:
            _mapWindowView.doSetView(_mapWindowView.views['CATEGORY_LOCATIONS_MAP'], _mapProxy.retrieveLocationsByCategory(_activeCategory || '', _categoryResultsPerPage));
            break;
        case _mapWindowView.views['CATEGORY_LOCATIONS_MAP']:
            _mapWindowView.doSetView(_mapWindowView.views['CATEGORY_LOCATIONS_LIST'], _mapProxy.retrieveLocationsByCategory(_activeCategory, _categoryResultsPerPage));
            break;
        default:
            return;
    }
}

function _onCategoryLeftBtnClick (e) {
    // Will respond when user presses the left-side button in 
    // map category view navigation
    
    // Will get the current active view, and determine what view
    // Should be shown. Presumably, it should go back one step.
    switch (_mapWindowView.doGetView()) {
        case _mapWindowView.views['CATEGORY_LOCATIONS_LIST']:
            _mapWindowView.doSetView(_mapWindowView.views['CATEGORY_BROWSING'], _mapProxy.retrieveLocationsByCategory(_activeCategory || '', _categoryResultsPerPage));
            break;
        case _mapWindowView.views['CATEGORY_LOCATIONS_MAP']:
            _mapWindowView.doSetView(_mapWindowView.views['CATEGORY_BROWSING'], _mapProxy.retrieveLocationsByCategory(_activeCategory, _categoryResultsPerPage));
            break;
        default:
            return;
    }
}

function _onViewDetailOnMap (e) {
    _mapWindowView.doSetView(_mapWindowView.views['CATEGORY_LOCATIONS_MAP'], {locations: [_mapProxy.retrieveAnnotationByTitle(e.title, true)]});
    _mapDetailView.hide();
}

//Proxy Events
function _onProxySearching (e) {
    _mapWindowView.saveActivityIndicatorMessage(localDictionary.searching);
    _mapWindowView.showActivityIndicator();
}

function _onProxyLoading (e) {
    _mapWindowView.saveActivityIndicatorMessage(localDictionary.mapLoadingLocations);
    _mapWindowView.showActivityIndicator();
}

function _onProxyLoaded (e) {
    _mapWindowView.resetMapLocation();
    _mapWindowView.hideActivityIndicator();
}

function _onProxySearchComplete (e) {
    var alertDialog;
    
    _mapWindowView.hideActivityIndicator();
    
    if(e.points.length < 1) {
        if (_win.visible || deviceProxy.isIOS()) {
            try {
                alertDialog = Titanium.UI.createAlertDialog({
                    title: localDictionary.noResults,
                    message: localDictionary.mapNoSearchResults,
                    buttonNames: [localDictionary.OK]
                });
                alertDialog.show();
            }
            catch (e) {
                Ti.API.error("Couldn't show alert in MapWindowController: " + e);
            }
        }
    }
    else {
        _mapWindowView.plotPoints(e.points);
    }
}

function _onProxyEmptySearch (e) {
    _mapWindowView.hideActivityIndicator();
}

function _onAndroidSearch (e) {
	if (_mapWindowView._searchBar && _mapWindowView._searchBar.input) {
		_mapWindowView._searchBar.input.focus();
	}
	if (_mapDetailView.detailView) {
		_mapDetailView.detailView.hide();
	}
};

function _onProxyLoadError (e) {
    var alertDialog;
    
    _mapWindowView.hideActivityIndicator();
    
    if (_win.visible || deviceProxy.isIOS()) {
        try {
            switch (e.errorCode) {
                case _mapProxy.requestErrors.NETWORK_UNAVAILABLE:
                    alertDialog = Titanium.UI.createAlertDialog({
                        title: localDictionary.error,
                        message: localDictionary.map_NETWORK_UNAVAILABLE,
                        buttonNames: [localDictionary.OK]
                    });
                    alertDialog.show();
                    break;
                case _mapProxy.requestErrors.REQUEST_TIMEOUT:
                    alertDialog = Titanium.UI.createAlertDialog({
                        title: localDictionary.error,
                        message: localDictionary.map_REQUEST_TIMEOUT,
                        buttonNames: [localDictionary.OK]
                    });
                    alertDialog.show();
                    break;
                case _mapProxy.requestErrors.SERVER_ERROR:
                    alertDialog = Titanium.UI.createAlertDialog({
                        title: localDictionary.error,
                        message: localDictionary.map_SERVER_ERROR,
                        buttonNames: [localDictionary.OK]
                    });
                    alertDialog.show();
                    break;
                case _mapProxy.requestErrors.NO_DATA_RETURNED:
                    alertDialog = Titanium.UI.createAlertDialog({
                        title: localDictionary.error,
                        message: localDictionary.map_NO_DATA_RETURNED,
                        buttonNames: [localDictionary.OK]
                    });
                    alertDialog.show();
                    break;
                case _mapProxy.requestErrors.INVALID_DATA_RETURNED: 
                    alertDialog = Titanium.UI.createAlertDialog({
                        title: localDictionary.error,
                        message: localDictionary.map_INVALID_DATA_RETURNED,
                        buttonNames: [localDictionary.OK]
                    });
                    alertDialog.show();
                    break;
                default:
                    alertDialog = Titanium.UI.createAlertDialog({
                        title: localDictionary.error,
                        message: localDictionary.map_GENERAL_ERROR,
                        buttonNames: [localDictionary.OK]
                    });
                    alertDialog.show();
            }
        }
        catch (e) {
            Ti.API.error("Couldn't show alert in MapWindowController: " + e);
        }
    }
}