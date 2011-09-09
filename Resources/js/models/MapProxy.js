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
    var _self = this;
    
    this._app = facade;
    
    this._mapCenter = {
        latitude        : false,
        longitude       : false,
        latitudeDelta   : 1,
        longitudeDelta  : 1,
        latLow          : false,
        latHigh         : false,
        longLow         : false,
        longHigh        : false
    };
        
    this._defaultMapCenter = {
        latitudeDelta   : 0.005, 
        longitudeDelta  : 0.005
    };
        
    this.init = function () {
        var _db;
        _db = Titanium.Database.open('umobile');

        function checkForColumn(_tableName, _columnName) {
            var _response = false, _resultSet;
            
            _resultSet = _db.execute('PRAGMA table_info("map_locations")');
            while(_resultSet.isValidRow()) {
                if (_resultSet.fieldByName('name') == _columnName) {
                    _response = true;
                    break;
                }
                _resultSet.next();
            }
            _resultSet.close();
            
            return _response;
        }
        
        
        _db.execute('CREATE TABLE IF NOT EXISTS "map_locations" ("title" TEXT UNIQUE,"abbreviation" TEXT,"accuracy" INTEGER,"address" TEXT,"alternateName" TEXT,"latitude" REAL, "longitude" REAL,"searchText" TEXT,"zip" TEXT, "img" TEXT)');
        if (!checkForColumn("map_locations","categories")) {
            _db.execute('ALTER TABLE "map_locations" ADD COLUMN "categories" TEXT');
        }
        _db.execute('CREATE TABLE IF NOT EXISTS "map_categories" ("name" TEXT UNIQUE)');

        _db.close();
        this.loadMapPoints();
    };
    
    this.search = function (query, opts) {
        var result = [], _db, queryResult, _isFirstResult = true;

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
            while (queryResult.isValidRow()) {
                if (_isFirstResult) {
                    _self._mapCenter.latLow = parseFloat(queryResult.fieldByName('latitude'));
                    _self._mapCenter.latHigh = parseFloat(queryResult.fieldByName('latitude')); 
                    _self._mapCenter.longLow = parseFloat(queryResult.fieldByName('longitude'));
                    _self._mapCenter.longHigh = parseFloat(queryResult.fieldByName('longitude'));
                }
                result.push({
                    title: queryResult.fieldByName('title'),
                    address: queryResult.fieldByName('address'),
                    latitude: parseFloat(queryResult.fieldByName('latitude')),
                    longitude: parseFloat(queryResult.fieldByName('longitude')),
                    img: queryResult.fieldByName('img')
                });
                Ti.API.info(queryResult.fieldByName('img'));
                if (queryResult.fieldByName('latitude') < _self._mapCenter.latLow) {
                    _self._mapCenter.latLow = parseFloat(queryResult.fieldByName('latitude'));
                }
                else if (queryResult.fieldByName('latitude') > _self._mapCenter.latHigh) {
                    _self._mapCenter.latHigh = parseFloat(queryResult.fieldByName('latitude'));
                }
                if (queryResult.fieldByName('longitude') < _self._mapCenter.longLow) {
                    _self._mapCenter.longLow = parseFloat(queryResult.fieldByName('longitude'));
                }
                else if (queryResult.fieldByName('longitude') > _self._mapCenter.longHigh) {
                    _self._mapCenter.longHigh = parseFloat(queryResult.fieldByName('longitude'));
                }
                _isFirstResult = false;
                queryResult.next();
            }
            queryResult.close();


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
        if (_self._app.models.deviceProxy.checkNetwork()) {
            request = Titanium.Network.createHTTPClient ({
                // connectionType : 'GET',
                onload : _self._newPointsLoaded,
                onerror : _self._onLoadError
            });
            request.open("GET", _self._app.config.MAP_SERVICE_URL);
            request.send();
        }
        else {
            Ti.App.fireEvent(ApplicationFacade.events['NETWORK_ERROR']);
        }

    };
    
    this.getCategoryList = function () {
        Ti.API.debug("getCategoryList() in MapProxy");
        /*
            In this method, we'll 
            1. load the available categories from the db.
            2. Create an array of objects (_result) containing each category name
            3. Query the map_locations db table to determine how many children each 
            category has, and add a numChildren value to each object in the _result array.
            4. Return the _result array and be done with it. Array looks like: [{ name: String, numChildren: Int}]
        */
        var result = [], _resultSet, db, _categoryName;

        db = Titanium.Database.open('umobile');
        _resultSet = db.execute("SELECT * FROM map_categories");

        while (_resultSet.isValidRow()) {
            result.push({
                name: _resultSet.fieldByName('name')
            });

            _resultSet.next();
        }
        _resultSet.close();
        
        for (var i=0, iLength = result.length; i<iLength; i++) {
            _categoryName = '%'+ result[i].name +'%';
            _resultSet = db.execute("SELECT COUNT(*) FROM map_locations WHERE categories LIKE ?", _categoryName);
            while (_resultSet.isValidRow()) {
                result[i].numChildren = _resultSet.field(0);
                _resultSet.next();
            }
            
            _resultSet.close();
        }
        db.close();
        
        return result;
    };
    
    this.getLocationsByCategory = function (_catName, _numResults, _pageNum) {
        /*
            _catName arg is a string for the category name to query for
            _numResults (optional) is the number of results to return. All by default.
            _pageNum (optional) requires _numResults, and shows a specific page of results. Index starts at 0.
            In this method, we'll
            1. Construct the initial result object, {categoryName: String, 
                totalResults: Int, returnedResultNum: Int, pageNum: Int, locations: Array}
            2. Query the map_locations table for rows which contain the provided
                category (_catName) in the "categories" column. NOTE: If no _catName
                is provided, we'll return uncategorized locations.
            3. Add each location to the result.locations array: 
                {title: String, address: String, latitude: Float, longitude: Float, img: String}
            4. Return result and be done with it.
        */
        
        //Make sure passed in arguments are right type and value
        _catName = _catName && typeof _catName === 'string' ? _catName : '';
        _numResults = _numResults && typeof _numResults === 'number' ? parseInt(_numResults, 10) : -1;
        _pageNum = _pageNum && typeof _pageNum === 'number' ? parseInt(_pageNum, 10) : 0;
        
        Ti.API.debug("getLocationsByCategory() in MapProxy");
        var _resultSet, _db, _catNameQuery = '%' + _catName + '%', 
        _resultLimit = _numResults ? parseInt(_numResults, 10) : -1,
        _resultOffset = _pageNum && _numResults ? parseInt(_pageNum * _numResults, 10) : 0;
        _result = {
            categoryName    : _catName,
            locations       : [],
            pageNum      : _resultOffset
        };
        
        _db = Titanium.Database.open('umobile');
        
        _resultSet = _db.execute('SELECT title, address, latitude, longitude, img FROM map_locations WHERE categories LIKE ? ORDER BY title ASC LIMIT ? OFFSET ? ', _catNameQuery, _resultLimit, _resultOffset);
        _result.returnedResultNum = _resultSet.rowCount;
        while (_resultSet.isValidRow()) {
            try {
                _result.locations.push({
                    title       : _resultSet.fieldByName('title'),
                    address     : _resultSet.fieldByName('address'),
                    latitude    : parseFloat(_resultSet.fieldByName('latitude')),
                    longitude   : parseFloat(_resultSet.fieldByName('longitude')),
                    img         : _resultSet.fieldByName('img')
                });
            }
            catch (e) {
                Ti.API.error("Couldn't add object to getLocationsByCategory response. Title: " + _resultSet.fieldByName('title'));
            }
            _resultSet.next();
        }
        
        _result.totalResults = parseInt(_db.execute("SELECT COUNT(*) FROM map_locations WHERE categories LIKE ?", _catNameQuery).field(0), 10);
        
        _resultSet.close();
        _db.close();
        
        return _result;
    };
    
    this._newPointsLoaded = function (e) {
        Ti.API.info("newPointsLoaded() in MapProxy");
        // Customize the response and add it to the cached mapPoints array in the MapProxy object.
        
        Ti.App.fireEvent(ApplicationFacade.events['SESSION_ACTIVITY'], {context: _self._app.models.loginProxy.sessionTimeContexts.NETWORK});
        
        var _response, _responseLength, _db, _categories = {};
        try {
            _response = JSON.parse(e.source.responseText);
            //Set the default map center
            _self._defaultMapCenter.latitude = parseFloat(_response.defaultLocation.latitude);
            _self._defaultMapCenter.longitude = parseFloat(_response.defaultLocation.longitude);
            _responseLength = _response.buildings.length;
            
            if (_responseLength > 0) {
                _db = Ti.Database.open('umobile');
                _self._mapCenter.latLow = _response.buildings[0].latitude;
                _self._mapCenter.latHigh = _response.buildings[0].latitude; 
                _self._mapCenter.longLow = _response.buildings[0].longitude;
                _self._mapCenter.longHigh = _response.buildings[0].longitude;
                
                for (var i = 0; i < _responseLength; i++) {
                    var building = _response.buildings[i];
                    
                    if (building.name && building.latitude && building.longitude) {
                        building.title = building.name;
                        building.latitude = parseFloat(building.latitude);
                        building.longitude = parseFloat(building.longitude);

                        _db.execute("REPLACE INTO map_locations (title, abbreviation, accuracy, address, alternateName, latitude, longitude, searchText, zip, img, categories) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                            building.name ? building.name : '',
                            building.abbreviation ? building.abbreviation : '',
                            building.accuracy ? building.accuracy : '',
                            building.address ? building.address : '',
                            building.alternateName ? building.alternateName : '',
                            building.latitude ? building.latitude : 0,
                            building.longitude ? building.longitude : 0,
                            building.searchText ? building.searchText : '',
                            building.zip || '',
                            building.img || '',
                            building.categories || ''
                            );
                    }
                    else {
                        Ti.API.debug("Skipping " + building.name);
                    }
                    
                    if (building.categories) {
                        //Create array from comma-separated values and remove spaces
                        building.categories = building.categories.replace(' ','').split(',');
                        for (var j=0, jLength=building.categories.length; j<jLength; j++) {
                            _categories[building.categories[j]] = 0;
                        }
                    }
                    
                }
                
                for (var _category in _categories) {
                    if (_categories.hasOwnProperty(_category)) {
                        _db.execute('REPLACE INTO map_categories (name) VALUES (?)', _category);
                    }
                }
                
                _db.close();
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
        
        Ti.API.debug("Checking for category list method: " + JSON.stringify(_self.getCategoryList()));
        Ti.API.debug("Checking for getLocationsByCategory method: " + JSON.stringify(_self.getLocationsByCategory(50, 'nonsense', 'nonsense')));
    };
    
    this.getMapCenter = function (isDefault) {
        var _longDelta, _latDelta;
        if(isDefault) {
            //Wants the default map location returned from the service, 
            //not the dynamic one generated otherwise
            return _self._defaultMapCenter;
        }
        else {
            _self._mapCenter.latitude = (_self._mapCenter.latLow + _self._mapCenter.latHigh) / 2;
            _self._mapCenter.longitude = (_self._mapCenter.longLow + _self._mapCenter.longHigh) / 2;
            _self._mapCenter.latitudeDelta = (_self._mapCenter.latHigh - _self._mapCenter.latLow) > 0.005 ? _self._mapCenter.latHigh - _self._mapCenter.latLow : 0.005;
            _self._mapCenter.longitudeDelta = (_self._mapCenter.longHigh - _self._mapCenter.longLow) > 0.005 ? _self._mapCenter.longHigh - _self._mapCenter.longLow : 0.005;
            
            Ti.API.debug("mapProxy.getMapCenter result: " + JSON.stringify(_self._mapCenter));
            return _self._mapCenter;
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