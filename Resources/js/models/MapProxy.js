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
var numCategories, app = require('/js/Constants');
var _mapCenter = {
    latitude        : false,
    longitude       : false,
    latitudeDelta   : 1,
    longitudeDelta  : 1,
    latLow          : false,
    latHigh         : false,
    longLow         : false,
    longHigh        : false
};
    
var _defaultMapCenter = {
    latitudeDelta   : 0.005, 
    longitudeDelta  : 0.005
};
    
exports.initialize = function () {
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
        //Apparently an outdated schema, from a previous version.
        _db.execute('ALTER TABLE "map_locations" ADD COLUMN "categories" TEXT');
    }
    _db.execute('CREATE TABLE IF NOT EXISTS "map_categories" ("name" TEXT UNIQUE)');

    _db.close();
    exports.loadMapPoints();
};

exports.search = function (query, opts) {
    var result = [], _db, queryResult, _isFirstResult = true;
    
    if (!query || typeof query !== 'string') return _onEmptySearch();

    _onSearch(query);
    query = query.toLowerCase();
    query = query.replace(/[^a-zA-Z 0-9]+/g,'');
    query = '%' + query + '%';
    _db = Titanium.Database.open('umobile');
    //Query the database for rows in the map_locations table that match the query
    queryResult = _db.execute('SELECT title, address, latitude, longitude, img FROM map_locations WHERE title LIKE ? OR searchText LIKE ? or abbreviation LIKE ?', query, query, query);
    
    //Iterate through the query result to add objects to the result array
    while (queryResult.isValidRow()) {
        if (_isFirstResult) {
            _mapCenter.latLow = parseFloat(queryResult.fieldByName('latitude'));
            _mapCenter.latHigh = parseFloat(queryResult.fieldByName('latitude')); 
            _mapCenter.longLow = parseFloat(queryResult.fieldByName('longitude'));
            _mapCenter.longHigh = parseFloat(queryResult.fieldByName('longitude'));
        }
        result.push({
            title: queryResult.fieldByName('title'),
            address: queryResult.fieldByName('address'),
            latitude: parseFloat(queryResult.fieldByName('latitude')),
            longitude: parseFloat(queryResult.fieldByName('longitude')),
            img: queryResult.fieldByName('img')
        });
        if (queryResult.fieldByName('latitude') < _mapCenter.latLow) {
            _mapCenter.latLow = parseFloat(queryResult.fieldByName('latitude'));
        }
        else if (queryResult.fieldByName('latitude') > _mapCenter.latHigh) {
            _mapCenter.latHigh = parseFloat(queryResult.fieldByName('latitude'));
        }
        if (queryResult.fieldByName('longitude') < _mapCenter.longLow) {
            _mapCenter.longLow = parseFloat(queryResult.fieldByName('longitude'));
        }
        else if (queryResult.fieldByName('longitude') > _mapCenter.longHigh) {
            _mapCenter.longHigh = parseFloat(queryResult.fieldByName('longitude'));
        }
        _isFirstResult = false;
        queryResult.next();
    }
    queryResult.close();
    

    _db.close();
    _onSearchComplete(result);
};
exports.retrieveAnnotationByAbbr = function (a, shouldRecenter) {
    var result = {}, resultSet, db;
    db = Titanium.Database.open('umobile');
    resultSet = db.execute("SELECT * FROM map_locations WHERE abbreviation IS ? LIMIT 1", a);
    while (resultSet.isValidRow()) {
        
        result = {
            title: resultSet.fieldByName('title'),
            address: resultSet.fieldByName('address'),
            latitude: parseFloat(resultSet.fieldByName('latitude')),
            longitude: parseFloat(resultSet.fieldByName('longitude')),
            zip: resultSet.fieldByName('zip'),
            img: resultSet.fieldByName('img')
        };
        
        if (shouldRecenter) {
            _mapCenter.latLow = parseFloat(resultSet.fieldByName('latitude'));
            _mapCenter.latHigh = parseFloat(resultSet.fieldByName('latitude')); 
            _mapCenter.longLow = parseFloat(resultSet.fieldByName('longitude'));
            _mapCenter.longHigh = parseFloat(resultSet.fieldByName('longitude'));
            if (resultSet.fieldByName('latitude') < _mapCenter.latLow) {
                _mapCenter.latLow = parseFloat(resultSet.fieldByName('latitude'));
            }
            else if (resultSet.fieldByName('latitude') > _mapCenter.latHigh) {
                _mapCenter.latHigh = parseFloat(resultSet.fieldByName('latitude'));
            }
            if (resultSet.fieldByName('longitude') < _mapCenter.longLow) {
                _mapCenter.longLow = parseFloat(resultSet.fieldByName('longitude'));
            }
            else if (resultSet.fieldByName('longitude') > _mapCenter.longHigh) {
                _mapCenter.longHigh = parseFloat(resultSet.fieldByName('longitude'));
            }
        }
        resultSet.next();
    }
    resultSet.close();
    db.close();
    
    return result;
};

exports.retrieveAnnotationByTitle = function(t, shouldRecenter) {
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
        
        if (shouldRecenter) {
            _mapCenter.latLow = parseFloat(resultSet.fieldByName('latitude'));
            _mapCenter.latHigh = parseFloat(resultSet.fieldByName('latitude')); 
            _mapCenter.longLow = parseFloat(resultSet.fieldByName('longitude'));
            _mapCenter.longHigh = parseFloat(resultSet.fieldByName('longitude'));
            if (resultSet.fieldByName('latitude') < _mapCenter.latLow) {
                _mapCenter.latLow = parseFloat(resultSet.fieldByName('latitude'));
            }
            else if (resultSet.fieldByName('latitude') > _mapCenter.latHigh) {
                _mapCenter.latHigh = parseFloat(resultSet.fieldByName('latitude'));
            }
            if (resultSet.fieldByName('longitude') < _mapCenter.longLow) {
                _mapCenter.longLow = parseFloat(resultSet.fieldByName('longitude'));
            }
            else if (resultSet.fieldByName('longitude') > _mapCenter.longHigh) {
                _mapCenter.longHigh = parseFloat(resultSet.fieldByName('longitude'));
            }
        }
        resultSet.next();
    }
    resultSet.close();
    db.close();
    
    return result;
};
exports.loadMapPoints = function () {
    //Default returns all points for an institution.
    Ti.App.fireEvent(exports.events['LOADING']);
    if (require('/js/models/DeviceProxy').checkNetwork()) {
        request = Titanium.Network.createHTTPClient ({
            onload : exports._newPointsLoaded,
            onerror : _onLoadError
        });
        request.open("GET", require('/js/config').MAP_SERVICE_URL);
        request.send();
    }
    else {
        Ti.App.fireEvent(app.events['NETWORK_ERROR']);
    }

};

exports.retrieveTotalCategories = function () {
    return numCategories || -1;
};

exports.retrieveCategoryList = function () {
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
    
    result.push({
        name: exports.alternateCategories['UNCATEGORIZED'] //Uncategorized results.
    });
    
    for (var i=0, iLength = result.length; i<iLength; i++) {
        
        if (result[i].name !== exports.alternateCategories['UNCATEGORIZED']) {
            _categoryName = '%'+ result[i].name +'%';
            _resultSet = db.execute("SELECT COUNT(*) FROM map_locations WHERE categories LIKE ?", _categoryName);
        }
        else if (result[i].name === exports.alternateCategories['UNCATEGORIZED']){
            _resultSet = db.execute("SELECT COUNT(*) FROM map_locations WHERE categories IS NULL");
        }
        
        while (_resultSet.isValidRow()) {
            result[i].numChildren = _resultSet.field(0);
            _resultSet.next();
        }
        
        _resultSet.close();
    }
    db.close();
    
    numCategories = result.length;
    
    return result;
};

exports.retrieveLocationsByCategory = function (_catName, _numResults, _pageNum) {
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
    var _resultSet, _resultLimit, _resultOffset, _result, _db, _catNameQuery, _isFirstResult = true;

    //Make sure passed in arguments are right type and value
    _catName = _catName && typeof _catName === 'string' ? _catName : '';
    _numResults = _numResults && typeof _numResults === 'number' ? parseInt(_numResults, 10) : -1;
    _pageNum = _pageNum && typeof _pageNum === 'number' ? parseInt(_pageNum, 10) : 0;
    
    _resultLimit = _numResults ? parseInt(_numResults, 10) : -1;
    _resultOffset = _pageNum && _numResults ? parseInt(_pageNum * _numResults, 10) : 0;
    _result = {
        categoryName    : _catName,
        locations       : [],
        pageNum         : _pageNum
    };
    
    _db = Titanium.Database.open('umobile');
    if (_catName !== '' && _catName !== exports.alternateCategories['UNCATEGORIZED']) {
        _catNameQuery = '%' + _catName + '%';
        _resultSet = _db.execute('SELECT title, address, latitude, longitude, img FROM map_locations WHERE categories LIKE ? ORDER BY title ASC LIMIT ? OFFSET ? ', _catNameQuery, _resultLimit, _resultOffset);
    }
    else {
        _resultSet = _db.execute('SELECT title, address, latitude, longitude, img FROM map_locations WHERE categories IS NULL ORDER BY title ASC LIMIT ? OFFSET ? ', _resultLimit, _resultOffset);
    }
    
    _result.returnedResultNum = _resultSet.rowCount;
    while (_resultSet.isValidRow()) {
        if (_isFirstResult) {
            _mapCenter.latLow = parseFloat(_resultSet.fieldByName('latitude'));
            _mapCenter.latHigh = parseFloat(_resultSet.fieldByName('latitude')); 
            _mapCenter.longLow = parseFloat(_resultSet.fieldByName('longitude'));
            _mapCenter.longHigh = parseFloat(_resultSet.fieldByName('longitude'));
        }
        if (_resultSet.fieldByName('latitude') < _mapCenter.latLow) {
            _mapCenter.latLow = parseFloat(_resultSet.fieldByName('latitude'));
        }
        else if (_resultSet.fieldByName('latitude') > _mapCenter.latHigh) {
            _mapCenter.latHigh = parseFloat(_resultSet.fieldByName('latitude'));
        }
        if (_resultSet.fieldByName('longitude') < _mapCenter.longLow) {
            _mapCenter.longLow = parseFloat(_resultSet.fieldByName('longitude'));
        }
        else if (_resultSet.fieldByName('longitude') > _mapCenter.longHigh) {
            _mapCenter.longHigh = parseFloat(_resultSet.fieldByName('longitude'));
        }
        
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
            Ti.API.error("Couldn't add object to retrieveLocationsByCategory response. Title: " + _resultSet.fieldByName('title'));
        }
        _isFirstResult = false;
        _resultSet.next();
    }
    
    // Not used yet, but was causing errors. totalResults would be useful for paging UI, which hasn't yet been implemented.
    // _result.totalResults = parseInt(_db.execute("SELECT COUNT(*) FROM map_locations WHERE categories LIKE ?", _catNameQuery).field(0), 10) || 0;
    
    _resultSet.close();
    _db.close();
    
    return _result;
};

exports._newPointsLoaded = function (e) {
    // Customize the response and add it to the cached mapPoints array in the MapProxy object.
    
    Ti.App.fireEvent(app.events['SESSION_ACTIVITY']);
    
    var _response, _responseLength, _db, _categories = {};
    try {
        _response = JSON.parse(e.source.responseText);
        //Set the default map center
        _defaultMapCenter.latitude = parseFloat(_response.mapData.defaultLocation.latitude);
        _defaultMapCenter.longitude = parseFloat(_response.mapData.defaultLocation.longitude);
        _responseLength = _response.mapData.locations.length;
        
        if (_responseLength > 0) {
            _db = Ti.Database.open('umobile');
            _mapCenter.latLow = _response.mapData.locations[0].latitude;
            _mapCenter.latHigh = _response.mapData.locations[0].latitude; 
            _mapCenter.longLow = _response.mapData.locations[0].longitude;
            _mapCenter.longHigh = _response.mapData.locations[0].longitude;
            _db.execute("BEGIN IMMEDIATE TRANSACTION");
            for (var i = 0; i < _responseLength; i++) {
                var building = _response.mapData.locations[i];
                
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
                        building.categories ? building.categories.toString() : null
                        );
                    
                }
                
                if (building.categories) {
                    //Populate local array with unique indeces of categories, to be added to db
                    var _category;
                    while (_category = building.categories.shift()) {
                        _categories[_category] = 0;
                    }
                }
                
            }
            
            for (_category in _categories) {
                if (_categories.hasOwnProperty(_category)) _db.execute('REPLACE INTO map_categories (name) VALUES (?)', _category);
            }
            _db.execute("COMMIT TRANSACTION");
            
            _db.close();
            _onPointsLoaded();
        }
        else {
            Ti.API.error('MapProxy: No Data returned');
            //No location objects in the response, so fire an event so the controller is aware.
            Ti.App.fireEvent(exports.events['LOAD_ERROR'], {errorCode: exports.requestErrors.NO_DATA_RETURNED});
        }
    }
    catch (err) {
        Ti.API.error('MapProxy: Invalid Data Returned');
        //Data didn't parse, so fire an event so the controller is aware
        Ti.App.fireEvent(exports.events['LOAD_ERROR'], {errorCode: exports.requestErrors.INVALID_DATA_RETURNED, data: e.source.responseText});
    }
};

exports.retrieveMapCenter = function (isDefault) {
    var _longDelta, _latDelta;
    if(isDefault) {
        //Wants the default map location returned from the service, 
        //not the dynamic one generated otherwise
        return _defaultMapCenter;
    }
    else {
        _mapCenter.latitude = (_mapCenter.latLow + _mapCenter.latHigh) / 2;
        _mapCenter.longitude = (_mapCenter.longLow + _mapCenter.longHigh) / 2;
        _mapCenter.latitudeDelta = (_mapCenter.latHigh - _mapCenter.latLow) > 0.005 ? _mapCenter.latHigh - _mapCenter.latLow : 0.005;
        _mapCenter.longitudeDelta = (_mapCenter.longHigh - _mapCenter.longLow) > 0.005 ? _mapCenter.longHigh - _mapCenter.longLow : 0.005;
        
        return _mapCenter;
    }
};

function _onLoadError (e) {
    var errorCode;
    Ti.App.fireEvent(exports.events['LOAD_ERROR'], {errorCode: exports.requestErrors.GENERAL_ERROR});
};

function _onSearch (query) {
    Ti.App.fireEvent(exports.events['SEARCHING'], {query: query});
};

function _onEmptySearch () {
    Ti.API.debug('_onEmptySearch() in MapProxy');
    Ti.App.fireEvent(exports.events['EMPTY_SEARCH']);
};

function _onSearchComplete (result) {
    Ti.App.fireEvent(exports.events['SEARCH_COMPLETE'], { points: result });
};

function _onPointsLoaded () {
    Ti.App.fireEvent(exports.events['POINTS_LOADED']);
};

//Static event constants so they can be referenced without an instance of MapProxy
exports.events = {
    LOAD_ERROR      : 'MapProxyLoadError',
    EMPTY_SEARCH    : 'MapProxyEmptySearch',
    LOADING         : 'MapProxyLoading',
    SEARCHING       : 'MapProxySearching',
    SEARCH_COMPLETE : 'MapProxySearchComplete',
    POINTS_LOADED   : 'MapProxyPointsLoaded'
};

exports.alternateCategories = {
    UNCATEGORIZED   : 'uncategorized'
};

exports.requestErrors = {
    NETWORK_UNAVAILABLE     : 0,
    REQUEST_TIMEOUT         : 1,
    SERVER_ERROR            : 2,
    NO_DATA_RETURNED        : 3,
    INVALID_DATA_RETURNED   : 4,
    GENERAL_ERROR           : 5
};
