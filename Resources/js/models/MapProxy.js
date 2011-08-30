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
var MapProxy = function (facade) {
    var app = facade, _self = this;
    
    this._variables = {
        mapCenter: {
            latitude        : false,
            longitude       : false,
            latitudeDelta   : 1,
            longitudeDelta  : 1,
            latLow          : false,
            latHigh         : false,
            longLow         : false,
            longHigh        : false
        },
        
        defaultMapCenter: {
            latitudeDelta   : 0.005, 
            longitudeDelta  : 0.005
        }
    };
        
    this.init = function () {
        var _db;
        
        _db = Titanium.Database.open('umobile');
        _db.execute('CREATE TABLE IF NOT EXISTS "map_locations" ("title" TEXT UNIQUE, "abbreviation" TEXT, "accuracy" INTEGER, "address" TEXT, "alternateName" TEXT, "latitude" REAL, "longitude" REAL, "searchText" TEXT, "zip" TEXT, "img" TEXT)');
        _db.close();
        this.loadMapPoints();
    };
    
    this.search = function (query, opts) {

        var result = [], _db, queryResult;

        //If a search isn't already executing
        if(query != '' && typeof query == 'string') {
            this._onSearch(query);
            query = query.toLowerCase();
            query = query.replace(/[^a-zA-Z 0-9]+/g,'');
            query = '%' + query + '%';

            Ti.API.info("Starting to search...");
            
            _db = Titanium.Database.open('umobile');
            //Query the database for rows in the map_locations table that match the query
            queryResult = _db.execute('SELECT title, address, latitude, longitude, img FROM map_locations WHERE title LIKE ? OR searchText LIKE ? or abbreviation LIKE ?', query, query, query);
            
            //Iterate through the query result to add objects to the result array
            if (queryResult) {
                _self._variables['mapCenter'].latLow = parseFloat(queryResult.fieldByName('latitude'));
                _self._variables['mapCenter'].latHigh = parseFloat(queryResult.fieldByName('latitude')); 
                _self._variables['mapCenter'].longLow = parseFloat(queryResult.fieldByName('longitude'));
                _self._variables['mapCenter'].longHigh = parseFloat(queryResult.fieldByName('longitude'));
                
                while (queryResult.isValidRow()) {
                    result.push({
                        title: queryResult.fieldByName('title'),
                        address: queryResult.fieldByName('address'),
                        latitude: parseFloat(queryResult.fieldByName('latitude')),
                        longitude: parseFloat(queryResult.fieldByName('longitude')),
                        img: queryResult.fieldByName('img')
                    });
                    Ti.API.info(queryResult.fieldByName('img'));
                    if (queryResult.fieldByName('latitude') < _self._variables['mapCenter'].latLow) {
                        _self._variables['mapCenter'].latLow = parseFloat(queryResult.fieldByName('latitude'));
                    }
                    else if (queryResult.fieldByName('latitude') > _self._variables['mapCenter'].latHigh) {
                        _self._variables['mapCenter'].latHigh = parseFloat(queryResult.fieldByName('latitude'));
                    }
                    if (queryResult.fieldByName('longitude') < _self._variables['mapCenter'].longLow) {
                        _self._variables['mapCenter'].longLow = parseFloat(queryResult.fieldByName('longitude'));
                    }
                    else if (queryResult.fieldByName('longitude') > _self._variables['mapCenter'].longHigh) {
                        _self._variables['mapCenter'].longHigh = parseFloat(queryResult.fieldByName('longitude'));
                    }
                    queryResult.next();
                }
                queryResult.close();
            }
            _db.close();
            
            this._onSearchComplete(result);
            
        } else if (query === '') {
            this._onEmptySearch();
        }
    };
    this.getAnnotationByTitle = function(t) {
        var result = {}, resultSet, db;
        db = Titanium.Database.open('umobile');
        resultSet = db.execute("SELECT * FROM map_locations WHERE title IS ? LIMIT 1", t);
        while (resultSet.isValidRow()) {
            
            result = {
                title: resultSet.fieldByName('title'),
                address: resultSet.fieldByName('address'),
                latitude: parseFloat(resultSet.fieldByName('latitude')),
                longitude: parseFloat(resultSet.fieldByName('longitude')),
                zip: resultSet.fieldByName('zip'),
                img: resultSet.fieldByName('img')
            };
            resultSet.next();
        }
        resultSet.close();
        db.close();
        
        return result;
    };
    this.loadMapPoints = function () {
        //Default returns all points for an institution.
        Ti.API.info("loadMapPoints() in MapProxy");
        Ti.App.fireEvent(MapProxy.events['LOADING']);
        if (app.models.deviceProxy.checkNetwork()) {
            request = Titanium.Network.createHTTPClient ({
                connectionType : 'GET',
                location : app.config.MAP_SERVICE_URL,
                onload : _self._newPointsLoaded,
                onerror : _self._onLoadError
            });
            request.open("GET", app.config.MAP_SERVICE_URL);
            request.send();
        }
        else {
            Ti.App.fireEvent(ApplicationFacade.events['NETWORK_ERROR']);
        }

    };
    this._newPointsLoaded = function (e) {
        Ti.API.info("newPointsLoaded() in MapProxy");
        // Customize the response and add it to the cached mapPoints array in the MapProxy object.
        var response, responseLength, db;
        Ti.App.fireEvent(ApplicationFacade.events['SESSION_ACTIVITY'], {context: app.models.loginProxy.sessionTimeContexts.NETWORK});
        (function(){
            try {
                response = JSON.parse(e.source.responseText);
                //Set the default map center
                _self._variables['defaultMapCenter'].latitude = parseFloat(response.defaultLocation.latitude);
                _self._variables['defaultMapCenter'].longitude = parseFloat(response.defaultLocation.longitude);
                responseLength = response.buildings.length;
                if (responseLength > 0) {
                    db = Ti.Database.open('umobile');
                    _self._variables['mapCenter'].latLow = response.buildings[0].latitude;
                    _self._variables['mapCenter'].latHigh = response.buildings[0].latitude; 
                    _self._variables['mapCenter'].longLow = response.buildings[0].longitude;
                    _self._variables['mapCenter'].longHigh = response.buildings[0].longitude; 

                    for (var i = 0; i < responseLength; i++) {
                        var building = response.buildings[i];
                        
                        if (building.name && building.latitude && building.longitude) {
                            building.title = building.name;
                            building.latitude = parseFloat(building.latitude);
                            building.longitude = parseFloat(building.longitude);

                            db.execute("REPLACE INTO map_locations (title, abbreviation, accuracy, address, alternateName, latitude, longitude, searchText, zip, img) VALUES (?,?,?,?,?,?,?,?,?,?)",
                                building.name ? building.name : '',
                                building.abbreviation ? building.abbreviation : '',
                                building.accuracy ? building.accuracy : '',
                                building.address ? building.address : '',
                                building.alternateName ? building.alternateName : '',
                                building.latitude ? building.latitude : 0,
                                building.longitude ? building.longitude : 0,
                                building.searchText ? building.searchText : '',
                                building.zip ? building.zip : '',
                                building.img ? building.img : ''
                                );
                        }
                        else {
                            Ti.API.debug("Skipping " + building.name);
                        }
                        
                    }
                    db.close();
                    _self._onPointsLoaded();
                }
                else {
                    //No location objects in the response, so fire an event so the controller is aware.
                    Ti.App.fireEvent(MapProxy.events['LOAD_ERROR'], {errorCode: MapProxy.requestErrors.NO_DATA_RETURNED});
                }
            }
            catch (err) {
                Ti.API.info("Data was invalid, calling onInvalidData()");
                //Data didn't parse, so fire an event so the controller is aware
                Ti.App.fireEvent(MapProxy.events['LOAD_ERROR'], {errorCode: MapProxy.requestErrors.INVALID_DATA_RETURNED, data: e.source.responseText});
            }
        })();
    };
    
    this.getMapCenter = function (isDefault) {
        var _longDelta, _latDelta;
        if(isDefault) {
            //Wants the default map location returned from the service, 
            //not the dynamic one generated otherwise
            return _self._variables['defaultMapCenter'];
        }
        else {
            _self._variables['mapCenter'].latitude = (_self._variables['mapCenter'].latLow + _self._variables['mapCenter'].latHigh) / 2;
            _self._variables['mapCenter'].longitude = (_self._variables['mapCenter'].longLow + _self._variables['mapCenter'].longHigh) / 2;
            _self._variables['mapCenter'].latitudeDelta = (_self._variables['mapCenter'].latHigh - _self._variables['mapCenter'].latLow) > 0.005 ? _self._variables['mapCenter'].latHigh - _self._variables['mapCenter'].latLow : 0.005;
            _self._variables['mapCenter'].longitudeDelta = (_self._variables['mapCenter'].longHigh - _self._variables['mapCenter'].longLow) > 0.005 ? _self._variables['mapCenter'].longHigh - _self._variables['mapCenter'].longLow : 0.005;
            
            Ti.API.debug("mapProxy.getMapCenter result: " + JSON.stringify(_self._variables['mapCenter']));
            return _self._variables['mapCenter'];
        }
    };
    
    this._onLoadError = function (e) {
        var errorCode;
        Ti.API.debug("Error with map service" + JSON.stringify(e));
        Ti.App.fireEvent(MapProxy.events['LOAD_ERROR'], {errorCode: MapProxy.requestErrors.GENERAL_ERROR});
    };
    
    this._onSearch = function (query) {
        Ti.App.fireEvent(MapProxy.events['SEARCHING'], {query: query});
    };
    
    this._onEmptySearch = function () {
        Ti.App.fireEvent(MapProxy.events['EMPTY_SEARCH']);
    };
    
    this._onSearchComplete = function (result) {
        Ti.API.debug('onSearchComplete in MapProxy');
        Ti.App.fireEvent(MapProxy.events['SEARCH_COMPLETE'], { points: result });
    };
    
    this._onPointsLoaded = function () {
        Ti.App.fireEvent(MapProxy.events['POINTS_LOADED']);
    };
};
//Static event constants so they can be referenced without an instance of MapProxy
MapProxy.events = {
    LOAD_ERROR      : 'MapProxyLoadError',
    EMPTY_SEARCH    : 'MapProxyEmptySearch',
    LOADING         : 'MapProxyLoading',
    SEARCHING       : 'MapProxySearching',
    SEARCH_COMPLETE : 'MapProxySearchComplete',
    POINTS_LOADED   : 'MapProxyPointsLoaded'
};

MapProxy.requestErrors = {
    NETWORK_UNAVAILABLE     : 0,
    REQUEST_TIMEOUT         : 1,
    SERVER_ERROR            : 2,
    NO_DATA_RETURNED        : 3,
    INVALID_DATA_RETURNED   : 4,
    GENERAL_ERROR           : 5
};