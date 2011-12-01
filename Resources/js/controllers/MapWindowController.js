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

var MapWindowController = function() {
    var _self = this;
    
    // Pseudo private variables
    this._locationDetailViewOptions;
    this._rawAnnotations = [];
    this._activeCategory;
    this._activeView;
    this._categoryPage;
    this._categoryResultsPerPage = 10;
    
    // Private views
    this._mapWindowView;
    this._mapDetailView;
    
    this._win;
    this.key = 'map';
    
    this.open = function () {
        _self._mapWindowView = require('/js/views/MapWindowView');
        _self._mapDetailView = require('/js/views/MapDetailView');
        if (!app.models.mapProxy) app.models['mapProxy'] = require('/js/models/MapProxy');
        
        Ti.App.addEventListener(app.events['DIMENSION_CHANGES'], _self._onOrientationChange);

        _self._win = Titanium.UI.createWindow({
            url: 'js/views/WindowContext.js',
            backgroundColor: app.styles.backgroundColor,
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
        
        Ti.App.addEventListener(app.events['DIMENSION_CHANGES'], _self._onOrientationChange);
        Ti.App.addEventListener(app.models.mapProxy.events['SEARCHING'], _self._onProxySearching);
        Ti.App.addEventListener(app.models.mapProxy.events['SEARCH_COMPLETE'], _self._onProxySearchComplete);
        Ti.App.addEventListener(app.models.mapProxy.events['EMPTY_SEARCH'], _self._onProxyEmptySearch);
        Ti.App.addEventListener(app.models.mapProxy.events['LOAD_ERROR'], _self._onProxyLoadError);
        Ti.App.addEventListener(app.models.mapProxy.events['LOADING'], _self._onProxyLoading);
        Ti.App.addEventListener(app.models.mapProxy.events['POINTS_LOADED'], _self._onProxyLoaded);
        Ti.App.addEventListener(_self._mapWindowView.events['SEARCH_SUBMIT'], _self._onMapSearch);
        Ti.App.addEventListener(_self._mapWindowView.events['MAPVIEW_CLICK'], _self._onMapViewClick);
        Ti.App.addEventListener(_self._mapWindowView.events['DETAIL_CLICK'], _self._loadDetail);
        Ti.App.addEventListener(_self._mapWindowView.events['NAV_BUTTON_CLICK'], _self._onNavButtonClick);
        Ti.App.addEventListener(_self._mapWindowView.events['CATEGORY_ROW_CLICK'], _self._onCategoryRowClick);
        Ti.App.addEventListener(_self._mapWindowView.events['CATEGORY_RIGHT_BTN_CLICK'], _self._onCategoryRightBtnClick);
        Ti.App.addEventListener(_self._mapWindowView.events['CATEGORY_LEFT_BTN_CLICK'], _self._onCategoryLeftBtnClick);
        Ti.App.addEventListener(_self._mapWindowView.events['CATEGORY_LIST_ITEM_CLICK'], _self._onCategoryListItemClick);
        Ti.App.addEventListener(_self._mapDetailView.events['VIEW_ON_MAP_CLICK'], _self._onViewDetailOnMap);
        _self._win.addEventListener('android:search', _self._onAndroidSearch);
        
        app.models.mapProxy.init();
        
        _self._win.add(_self._mapWindowView.createView());
        _self._mapWindowView.hideActivityIndicator();    
    };
    
    this.close = function (options) {
        _self._mapWindowView.searchBlur();
        
        Ti.App.removeEventListener(app.events['DIMENSION_CHANGES'], _self._onOrientationChange);
        Ti.App.removeEventListener(app.models.mapProxy.events['SEARCHING'], _self._onProxySearching);
        Ti.App.removeEventListener(app.models.mapProxy.events['SEARCH_COMPLETE'], _self._onProxySearchComplete);
        Ti.App.removeEventListener(app.models.mapProxy.events['EMPTY_SEARCH'], _self._onProxyEmptySearch);
        Ti.App.removeEventListener(app.models.mapProxy.events['LOAD_ERROR'], _self._onProxyLoadError);
        Ti.App.removeEventListener(app.models.mapProxy.events['LOADING'], _self._onProxyLoading);
        Ti.App.removeEventListener(app.models.mapProxy.events['POINTS_LOADED'], _self._onProxyLoaded);
        Ti.App.removeEventListener(_self._mapWindowView.events['SEARCH_SUBMIT'], _self._onMapSearch);
        Ti.App.removeEventListener(_self._mapWindowView.events['MAPVIEW_CLICK'], _self._onMapViewClick);
        Ti.App.removeEventListener(_self._mapWindowView.events['DETAIL_CLICK'], _self._loadDetail);
        Ti.App.removeEventListener(_self._mapWindowView.events['NAV_BUTTON_CLICK'], _self._onNavButtonClick);
        Ti.App.removeEventListener(_self._mapWindowView.events['CATEGORY_ROW_CLICK'], _self._onCategoryRowClick);
        Ti.App.removeEventListener(_self._mapWindowView.events['CATEGORY_RIGHT_BTN_CLICK'], _self._onCategoryRightBtnClick);
        Ti.App.removeEventListener(_self._mapWindowView.events['CATEGORY_LEFT_BTN_CLICK'], _self._onCategoryLeftBtnClick);
        Ti.App.removeEventListener(_self._mapWindowView.events['CATEGORY_LIST_ITEM_CLICK'], _self._onCategoryListItemClick);
        Ti.App.removeEventListener(_self._mapDetailView.events['VIEW_ON_MAP_CLICK'], _self._onViewDetailOnMap);
        _self._win.removeEventListener('android:search', _self._onAndroidSearch);
        
        _self._mapWindowView = null;
        _self._mapDetailView = null;
        
        _self._win.close();
    };

    this._loadDetail = function(_annotation) {
        //Create and open the view for the map detail
        _self._mapWindowView.setActivityIndicatorMessage(app.localDictionary.loading);
        _self._mapWindowView.showActivityIndicator();
        _self._mapWindowView.searchBlur();

        _self._locationDetailViewOptions = _.clone(app.styles.view);
        _self._locationDetailViewOptions.data = _annotation;
        _self._locationDetailView = _self._mapDetailView.detailView;
        _self._win.add(_self._locationDetailView);

        _self._mapDetailView.render(_annotation);
        
        _self._locationDetailView.show();

        _self._mapWindowView.hideActivityIndicator();
    };
    
    // Mapview events
    this._onMapSearch = function (e) {
        app.models.mapProxy.search(e.value);
    };
    
    this._onMapViewClick = function (e) {
        var _annotation;
        if (e.clicksource === 'title' && e.title) {
            // _self._mapWindowView.searchBlur(); //Search should already be blurred...
            _annotation = app.models.mapProxy.getAnnotationByTitle(e.title);
            _self._loadDetail(_annotation);
        }
    };
    
    this._onNavButtonClick = function (e) {
        switch (e.buttonName) {
            case _self._mapWindowView.navButtonValues[0]:
                _self._mapWindowView.doSetView(_self._mapWindowView.views['SEARCH']);
                break;
            case _self._mapWindowView.navButtonValues[1]:
                _self._mapWindowView.doSetView(_self._mapWindowView.views['CATEGORY_BROWSING'], app.models.mapProxy.getCategoryList());
                break;
            default:
                Ti.API.error("No case matched in _handleNavButtonClick");
        }
    };
    
    this._onCategoryRowClick = function (e) {
        // Will receive an event, with "category" string property
        // Tell the map window view to open the locations list, and pass 
        // collection of locations for that category
        _self._activeCategory = e.category;
        _self._mapWindowView.doSetView(_self._mapWindowView.views['CATEGORY_LOCATIONS_LIST'], app.models.mapProxy.getLocationsByCategory(e.category, _self._categoryResultsPerPage));
    };
    
    this._onCategoryListItemClick = function (e) {
        //Called when the user clicks a specific location in a category 
        //list view, such as "10 W Amistad". Opens detail view
        var _annotation = app.models.mapProxy.getAnnotationByTitle(e.title);
        _self._loadDetail(_annotation);
    };
    
    this._onCategoryRightBtnClick = function (e) {
        // Will respond when user presses the right-side button in 
        // map category view navigation
        
        // Will get the current active view, and determine what view
        // Should be shown.
        switch (_self._mapWindowView.doGetView()) {
            case _self._mapWindowView.views['CATEGORY_LOCATIONS_LIST']:
                _self._mapWindowView.doSetView(_self._mapWindowView.views['CATEGORY_LOCATIONS_MAP'], app.models.mapProxy.getLocationsByCategory(_self._activeCategory || '', _self._categoryResultsPerPage));
                break;
            case _self._mapWindowView.views['CATEGORY_LOCATIONS_MAP']:
                _self._mapWindowView.doSetView(_self._mapWindowView.views['CATEGORY_LOCATIONS_LIST'], app.models.mapProxy.getLocationsByCategory(_self._activeCategory, _self._categoryResultsPerPage));
                break;
            default:
                return;
        }
        
    };
    
    this._onCategoryLeftBtnClick = function (e) {
        // Will respond when user presses the left-side button in 
        // map category view navigation
        
        // Will get the current active view, and determine what view
        // Should be shown. Presumably, it should go back one step.
        switch (_self._mapWindowView.doGetView()) {
            case _self._mapWindowView.views['CATEGORY_LOCATIONS_LIST']:
                _self._mapWindowView.doSetView(_self._mapWindowView.views['CATEGORY_BROWSING'], app.models.mapProxy.getLocationsByCategory(_self._activeCategory || '', _self._categoryResultsPerPage));
                break;
            case _self._mapWindowView.views['CATEGORY_LOCATIONS_MAP']:
                _self._mapWindowView.doSetView(_self._mapWindowView.views['CATEGORY_BROWSING'], app.models.mapProxy.getLocationsByCategory(_self._activeCategory, _self._categoryResultsPerPage));
                break;
            default:
                return;
        }
    };
    
    this._onViewDetailOnMap = function (e) {
        _self._mapWindowView.doSetView(_self._mapWindowView.views['CATEGORY_LOCATIONS_MAP'], {locations: [app.models.mapProxy.getAnnotationByTitle(e.title, true)]});
        _self._mapDetailView.hide();
    };

    //Proxy Events
    this._onProxySearching = function (e) {
        _self._mapWindowView.setActivityIndicatorMessage(app.localDictionary.searching);
        _self._mapWindowView.showActivityIndicator();
    };
    
    this._onProxyLoading = function (e) {
        _self._mapWindowView.setActivityIndicatorMessage(app.localDictionary.mapLoadingLocations);
        _self._mapWindowView.showActivityIndicator();
    };
    
    this._onProxyLoaded = function (e) {
        _self._mapWindowView.resetMapLocation();
        _self._mapWindowView.hideActivityIndicator();
    };
    
    this._onProxySearchComplete = function (e) {
        var alertDialog;
        
        _self._mapWindowView.hideActivityIndicator();
        
        if(e.points.length < 1) {
            if (_self._win.visible || app.models.deviceProxy.isIOS()) {
                try {
                    alertDialog = Titanium.UI.createAlertDialog({
                        title: app.localDictionary.noResults,
                        message: app.localDictionary.mapNoSearchResults,
                        buttonNames: [app.localDictionary.OK]
                    });
                    alertDialog.show();
                }
                catch (e) {
                    Ti.API.error("Couldn't show alert in MapWindowController: " + e);
                }
            }
        }
        else {
            _self._mapWindowView.plotPoints(e.points);
        }
    };
    
    this._onProxyEmptySearch = function (e) {
        _self._mapWindowView.hideActivityIndicator();
    };
    
    this._onAndroidSearch = function (e) {
    	if (_self._mapWindowView._searchBar && _self._mapWindowView._searchBar.input) {
    		_self._mapWindowView._searchBar.input.focus();
    	}
    	if (_self._mapWindowView._locationDetailView) {
    		_self._mapWindowView._locationDetailView.hide();
    	}
    };
    
    this._onProxyLoadError = function (e) {
        var alertDialog;
        
        _self._mapWindowView.hideActivityIndicator();
        
        if (_self._win.visible || app.models.deviceProxy.isIOS()) {
            try {
                switch (e.errorCode) {
                    case app.models.mapProxy.requestErrors.NETWORK_UNAVAILABLE:
                        alertDialog = Titanium.UI.createAlertDialog({
                            title: app.localDictionary.error,
                            message: app.localDictionary.map_NETWORK_UNAVAILABLE,
                            buttonNames: [app.localDictionary.OK]
                        });
                        alertDialog.show();
                        break;
                    case app.models.mapProxy.requestErrors.REQUEST_TIMEOUT:
                        alertDialog = Titanium.UI.createAlertDialog({
                            title: app.localDictionary.error,
                            message: app.localDictionary.map_REQUEST_TIMEOUT,
                            buttonNames: [app.localDictionary.OK]
                        });
                        alertDialog.show();
                        break;
                    case app.models.mapProxy.requestErrors.SERVER_ERROR:
                        alertDialog = Titanium.UI.createAlertDialog({
                            title: app.localDictionary.error,
                            message: app.localDictionary.map_SERVER_ERROR,
                            buttonNames: [app.localDictionary.OK]
                        });
                        alertDialog.show();
                        break;
                    case app.models.mapProxy.requestErrors.NO_DATA_RETURNED:
                        alertDialog = Titanium.UI.createAlertDialog({
                            title: app.localDictionary.error,
                            message: app.localDictionary.map_NO_DATA_RETURNED,
                            buttonNames: [app.localDictionary.OK]
                        });
                        alertDialog.show();
                        break;
                    case app.models.mapProxy.requestErrors.INVALID_DATA_RETURNED: 
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
            }
            catch (e) {
                Ti.API.error("Couldn't show alert in MapWindowController: " + e);
            }
        }
    };
    
    this._onOrientationChange = function (e) {
        if (app.models.deviceProxy.isIOS() || _self._win && _self._win.visible) {
            _self._mapWindowView.resetDimensions();
        }
    };

};
MapWindowController.events = {
    LOAD_DETAIL : 'loaddetail'
};