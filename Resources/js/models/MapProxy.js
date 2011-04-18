var MapService = function (facade) {
    var app = facade,
        self = {},
        mapPoints = [],
        mapCenter = {
            latitude: 0,
            longitude: 0,
            latitudeDelta: 1,
            longitudeDelta: 1,
            latLow: 0,
            latHigh: 0,
            longLow: 0,
            longHigh: 0
        };
    
    self.requestErrors = {
        NETWORK_UNAVAILABLE: 0,
        REQUEST_TIMEOUT: 1,
        SERVER_ERROR: 2,
        NO_DATA_RETURNED: 3,
        INVALID_DATA_RETURNED: 4,
        GENERAL_ERROR: 5
    };
    
    self.init = function () {
        var _db = Titanium.Database.open('umobile');
        _db.execute('CREATE TABLE IF NOT EXISTS "map_locations" ("title" TEXT UNIQUE, "abbreviation" TEXT, "accuracy" INTEGER, "address" TEXT, "alternateName" TEXT, "latitude" REAL, "longitude" REAL, "searchText" TEXT, "zip" INTEGER, "img" TEXT)');
        _db.close();
        self.loadMapPoints();
    };
    
    self.search = function (query, opts) {

        var result = [], _db, queryResult;

        //If a search isn't already executing
        if(query != '' && typeof query == 'string') {
            onSearch(query);
            query = query.toLowerCase();
            query = query.replace(/[^a-zA-Z 0-9]+/g,'');

            Ti.API.info("Starting to search...");
            
            _db = Titanium.Database.open('umobile');
            //Query the database for rows in the map_locations table that match the query
            queryResult = _db.execute('SELECT title, address, latitude, longitude, img FROM map_locations WHERE title LIKE "%'+ query +'%" OR searchText LIKE "%'+ query +'%" or abbreviation LIKE "%'+ query +'%"');
            
            //Iterate through the query result to add objects to the result array
            if (queryResult) {
                mapCenter.latLow = queryResult.fieldByName('latitude');
                mapCenter.latHigh = queryResult.fieldByName('latitude');                
                mapCenter.longLow = queryResult.fieldByName('longitude');
                mapCenter.longHigh = queryResult.fieldByName('longitude');
                
                while (queryResult.isValidRow()) {
                    result.push({
                        title: queryResult.fieldByName('title'),
                        address: queryResult.fieldByName('address'),
                        latitude: queryResult.fieldByName('latitude'),
                        longitude: queryResult.fieldByName('longitude'),
                        img: queryResult.fieldByName('img')
                    });
                    Ti.API.info(queryResult.fieldByName('img'));
                    if (queryResult.fieldByName('latitude') < mapCenter.latLow) {
                        mapCenter.latLow = queryResult.fieldByName('latitude');
                    }
                    else if (queryResult.fieldByName('latitude') > mapCenter.latHigh) {
                        mapCenter.latHigh = queryResult.fieldByName('latitude');
                    }
                    if (queryResult.fieldByName('longitude') < mapCenter.longLow) {
                        mapCenter.longLow = queryResult.fieldByName('longitude');
                    }
                    else if (queryResult.fieldByName('longitude') > mapCenter.longHigh) {
                        mapCenter.longHigh = queryResult.fieldByName('longitude');
                    }
                    queryResult.next();
                }
                queryResult.close();
            }
            _db.close();
            
            onSearchComplete(result);
            
        } else if (query === '') {
            onEmptySearch();
        }
    };
    self.getAnnotationByTitle = function(t) {
        /*for (var i=0, iLength=mapPoints.length; i<iLength; i++) {
            if (mapPoints[i].title === t) {
                return mapPoints[i];
            }
        }*/
        var result = {}, resultSet, db;
        db = Titanium.Database.open('umobile');
        resultSet = db.execute("SELECT * FROM map_locations WHERE title IS ? LIMIT 1", t);
        while (resultSet.isValidRow()) {
            
            result = {
                title: resultSet.fieldByName('title'),
                address: resultSet.fieldByName('address'),
                latitude: resultSet.fieldByName('latitude'),
                longitude: resultSet.fieldByName('longitude'),
                img: resultSet.fieldByName('img')
            };
            resultSet.next();
        }
        resultSet.close();
        db.close();
        
        Ti.API.info("Map search result: " + JSON.stringify(result));
        return result;
    };
    self.loadMapPoints = function () {
        //Default returns all points for an institution.
        Ti.API.info("loadMapPoints()");
        Ti.App.fireEvent('MapProxyLoading');
        request = Titanium.Network.createHTTPClient ({
            connectionType : 'GET',
            location : app.UPM.MAP_SERVICE_URL,
            onload : self.newPointsLoaded,
            onerror : onLoadError
        });
        request.open("GET", app.UPM.MAP_SERVICE_URL);
        request.send();

        Ti.API.debug("MapService.updateMapPoints() request sent");

    };
    self.newPointsLoaded = function (e) {
        // Customize the response and add it to the cached mapPoints array in the MapService object.
        var response, responseLength, db;
        (function(){
            try {
                Ti.API.debug("Trying to iterate through new points");
                response = JSON.parse(e.source.responseText);
                responseLength = response.buildings.length;
                if (responseLength > 0) {
                    db = Ti.Database.open('umobile');
                    mapCenter.latLow = response.buildings[0].latitude;
                    mapCenter.latHigh = response.buildings[0].latitude; 
                    mapCenter.longLow = response.buildings[0].longitude;
                    mapCenter.longHigh = response.buildings[0].longitude; 

                    for (var i = 0; i < responseLength; i++) {
                        var building = response.buildings[i];
                        if (building.name && building.latitude && building.longitude) {
                            response.buildings[i].title = response.buildings[i].name;
                            response.buildings[i].latitude = parseFloat(response.buildings[i].latitude);
                            response.buildings[i].longitude = parseFloat(response.buildings[i].longitude);

                            db.execute("REPLACE INTO map_locations (title, abbreviation, accuracy, address, alternateName, latitude, longitude, searchText, zip, img) VALUES (" + 
                                JSON.stringify(building.name) + ", " + 
                                JSON.stringify(building.abbreviation) + ", " + 
                                JSON.stringify(building.accuracy) + ", " + 
                                JSON.stringify(building.address) + ", " + 
                                JSON.stringify(building.alternateName) + ", " + 
                                parseFloat(building.latitude) + ", " + 
                                parseFloat(building.longitude) + ", " + 
                                JSON.stringify(building.searchText) + ", " + 
                                (building.zip ? parseInt(building.zip, 10) : null) + ", " + 
                                JSON.stringify(building.img) +")");


                            mapPoints.push(response.buildings[i]);
                            
                            if (building.latitude < mapCenter.latLow) {
                                mapCenter.latLow = building.latitude;
                            }
                            else if (building.latitude > mapCenter.latHigh) {
                                mapCenter.latHigh = building.latitude;
                            }
                            if (building.longitude < mapCenter.longLow) {
                                mapCenter.longLow = building.longitude;
                            }
                            else if (building.longitude > mapCenter.longHigh) {
                                mapCenter.longHigh = building.longitude;
                            }
                        }
                        else {
                            Ti.API.debug("Skipping " + building.name);
                        }
                    }
                    db.close();
                    onPointsLoaded();                
                }
                else {
                    //No location objects in the response, so fire an event so the controller is aware.
                    Ti.App.fireEvent('MapProxyLoadError', {errorCode: self.requestErrors.NO_DATA_RETURNED});
                }
            }
            catch (err) {
                Ti.API.info("Data was invalid, calling onInvalidData()");
                //Data didn't parse, so fire an event so the controller is aware
                Ti.App.fireEvent('MapProxyLoadError', {errorCode: self.requestErrors.INVALID_DATA_RETURNED});
            }
        })();
    };
    
    self.getMapCenter = function () {
        mapCenter.latitude = (mapCenter.latLow + mapCenter.latHigh) / 2;
        mapCenter.longitude = (mapCenter.longLow + mapCenter.longHigh) / 2;
        mapCenter.latitudeDelta = (mapCenter.latHigh - mapCenter.latLow) > 0.005 ? mapCenter.latHigh - mapCenter.latLow : 0.005;
        mapCenter.longitudeDelta = (mapCenter.longHigh - mapCenter.longLow) > 0.005 ? mapCenter.longHigh - mapCenter.longLow : 0.005;
        return mapCenter;
    };
    
    function onLoadError (e) {
        var errorCode;
        Ti.API.debug("Error with map service" + JSON.stringify(e));
        Ti.App.fireEvent('MapProxyLoadError', {errorCode: self.requestErrors.GENERAL_ERROR});
    }
    
    function onSearch(query) {
        Ti.App.fireEvent('MapProxySearching', {query: query});
    }
    
    function onEmptySearch () {
        Ti.App.fireEvent('MapProxyEmptySearch');
    }
    
    function onSearchComplete(result) {
        Ti.API.debug('onSearchComplete in MapProxy');
        if (result.length < 1) {
            alert(app.localDictionary.mapNoSearchResults);
        }
        else {
            Ti.App.fireEvent('MapProxySearchComplete', { points: result });
        }
    }
    
    function onPointsLoaded () {
        Ti.App.fireEvent('MapProxyPointsLoaded');
    }
    
    return self;
};