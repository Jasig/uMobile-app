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
    
var mapWindowView, 
    mapProxy, 
    localDictionary, 
    _onProxyLoadError, 
    _onProxyEmptySearch, 
    _onProxySearchComplete, 
    _onProxyLoaded, 
    _onProxyLoading, 
    _onProxySearching
;

exports.open = function (parameters) {
    Ti.API.debug('open() in MapWindowController');
    mapWindowView = require('/js/views/MapWindowView');
    mapProxy = require('/js/models/MapProxy');
    localDictionary = require('/js/localization')[Ti.App.Properties.getString('locale')];
    
    Ti.App.addEventListener(mapProxy.events.SEARCHING, _onProxySearching);
    Ti.App.addEventListener(mapProxy.events.SEARCH_COMPLETE, _onProxySearchComplete);
    Ti.App.addEventListener(mapProxy.events.EMPTY_SEARCH, _onProxyEmptySearch);
    Ti.App.addEventListener(mapProxy.events.LOAD_ERROR, _onProxyLoadError);
    Ti.App.addEventListener(mapProxy.events.LOADING, _onProxyLoading);
    Ti.App.addEventListener(mapProxy.events.POINTS_LOADED, _onProxyLoaded);
    
    mapProxy.initialize();
    mapWindowView.open();
    
    //If we're supposed to directly open a detail view, let's get the info from map proxy and show it.
    if (parameters && parameters.id) {
        mapWindowView.openDetailView(mapProxy.retrieveAnnotationByAbbr(parameters.id));
    }
    mapWindowView.hideActivityIndicator();
};

exports.close = function (options) {
    Ti.API.debug('close() in MapWindowController');
    Ti.App.removeEventListener(mapProxy.events.SEARCHING, _onProxySearching);
    Ti.App.removeEventListener(mapProxy.events.SEARCH_COMPLETE, _onProxySearchComplete);
    Ti.App.removeEventListener(mapProxy.events.EMPTY_SEARCH, _onProxyEmptySearch);
    Ti.App.removeEventListener(mapProxy.events.LOAD_ERROR, _onProxyLoadError);
    Ti.App.removeEventListener(mapProxy.events.LOADING, _onProxyLoading);
    Ti.App.removeEventListener(mapProxy.events.POINTS_LOADED, _onProxyLoaded);
    
    mapWindowView.close();
};

//Proxy Events
_onProxySearching = function (e) {
    Ti.API.debug('_onProxySearching() in MapWindowController');
    Ti.API.debug(JSON.stringify(e));
    mapWindowView.saveActivityIndicatorMessage(localDictionary.searching);
    mapWindowView.showActivityIndicator();
};

_onProxyLoading = function (e) {
    Ti.API.debug('_onProxyLoading() in MapWindowController');
    mapWindowView.saveActivityIndicatorMessage(localDictionary.mapLoadingLocations);
    mapWindowView.showActivityIndicator();
};

_onProxyLoaded = function (e) {
    Ti.API.debug('_onProxyLoaded() in MapWindowController');
    mapWindowView.resetMapLocation();
    mapWindowView.hideActivityIndicator();
};

_onProxySearchComplete = function (e) {
    Ti.API.debug('_onProxySearchComplete() in MapWindowController. e.points.length: '+e.points.length);
    
    mapWindowView.hideActivityIndicator();
    
    if(e.points.length > 0) return mapWindowView.plotPoints(e.points);
    mapWindowView.showAlert(localDictionary.mapNoSearchResults, localDictionary.noResults);
};

_onProxyEmptySearch = function (e) {
    Ti.API.debug('_onProxyEmptySearch() in MapWindowController');
    Ti.API.debug(JSON.stringify(e));
    mapWindowView.hideActivityIndicator();
};

_onProxyLoadError = function (e) {
    Ti.API.debug('_onProxyLoadError() in MapWindowController');
    Ti.API.debug(JSON.stringify(e));
    mapWindowView.hideActivityIndicator();
    switch (e.errorCode) {
        case mapProxy.requestErrors.NETWORK_UNAVAILABLE:
            mapWindowView.showAlert(localDictionary.map_NETWORK_UNAVAILABLE);
            break;

        case mapProxy.requestErrors.REQUEST_TIMEOUT:
            mapWindowView.showAlert(localDictionary.map_REQUEST_TIMEOUT);
            break;

        case mapProxy.requestErrors.SERVER_ERROR:
            mapWindowView.showAlert(localDictionary.map_SERVER_ERROR);
            break;

        case mapProxy.requestErrors.NO_DATA_RETURNED:
            mapWindowView.showAlert(localDictionary.map_NO_DATA_RETURNED);
            break;

        case mapProxy.requestErrors.INVALID_DATA_RETURNED:
            mapWindowView.showAlert(localDictionary.map_INVALID_DATA_RETURNED);
            break;

        default:
        mapWindowView.showAlert(localDictionary.map_GENERAL_ERROR);
    }
};