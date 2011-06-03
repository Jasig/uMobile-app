var MapProxy = function (facade) {
    var app = facade, _self = this, Device, Config, Login,
        mapPoints = [], mapCenter, defaultMapCenter,
        onPointsLoaded, onSearchComplete, onEmptySearch, onSearch, onLoadError;
        
    this.init = function () {
        var _db;
        
        Device = app.models.deviceProxy;
        Config = app.config;
        Login = app.models.loginProxy;
        
        mapCenter = {
            latitude: false,
            longitude: false,
            latitudeDelta: 1,
            longitudeDelta: 1,
            latLow: false,
            latHigh: false,
            longLow: false,
            longHigh: false
        };
        
        defaultMapCenter = {
            latitudeDelta: 0.005, 
            longitudeDelta: 0.005
        };
        
        this.requestErrors = {
            NETWORK_UNAVAILABLE: 0,
            REQUEST_TIMEOUT: 1,
            SERVER_ERROR: 2,
            NO_DATA_RETURNED: 3,
            INVALID_DATA_RETURNED: 4,
            GENERAL_ERROR: 5
        };
        
        _db = Titanium.Database.open('umobile');
        _db.execute('CREATE TABLE IF NOT EXISTS "map_locations" ("title" TEXT UNIQUE, "abbreviation" TEXT, "accuracy" INTEGER, "address" TEXT, "alternateName" TEXT, "latitude" REAL, "longitude" REAL, "searchText" TEXT, "zip" TEXT, "img" TEXT)');
        _db.close();
        this.loadMapPoints();
    };
    
    this.search = function (query, opts) {

        var result = [], _db, queryResult;

        //If a search isn't already executing
        if(query != '' && typeof query == 'string') {
            onSearch(query);
            query = query.toLowerCase();
            query = query.replace(/[^a-zA-Z 0-9]+/g,'');
            query = '%' + query + '%';

            Ti.API.info("Starting to search...");
            
            _db = Titanium.Database.open('umobile');
            //Query the database for rows in the map_locations table that match the query
            queryResult = _db.execute('SELECT title, address, latitude, longitude, img FROM map_locations WHERE title LIKE ? OR searchText LIKE ? or abbreviation LIKE ?', query, query, query);
            
            //Iterate through the query result to add objects to the result array
            if (queryResult) {
                mapCenter.latLow = parseFloat(queryResult.fieldByName('latitude'));
                mapCenter.latHigh = parseFloat(queryResult.fieldByName('latitude')); 
                mapCenter.longLow = parseFloat(queryResult.fieldByName('longitude'));
                mapCenter.longHigh = parseFloat(queryResult.fieldByName('longitude'));
                
                while (queryResult.isValidRow()) {
                    result.push({
                        title: queryResult.fieldByName('title'),
                        address: queryResult.fieldByName('address'),
                        latitude: parseFloat(queryResult.fieldByName('latitude')),
                        longitude: parseFloat(queryResult.fieldByName('longitude')),
                        img: queryResult.fieldByName('img')
                    });
                    Ti.API.info(queryResult.fieldByName('img'));
                    if (queryResult.fieldByName('latitude') < mapCenter.latLow) {
                        mapCenter.latLow = parseFloat(queryResult.fieldByName('latitude'));
                    }
                    else if (queryResult.fieldByName('latitude') > mapCenter.latHigh) {
                        mapCenter.latHigh = parseFloat(queryResult.fieldByName('latitude'));
                    }
                    if (queryResult.fieldByName('longitude') < mapCenter.longLow) {
                        mapCenter.longLow = parseFloat(queryResult.fieldByName('longitude'));
                    }
                    else if (queryResult.fieldByName('longitude') > mapCenter.longHigh) {
                        mapCenter.longHigh = parseFloat(queryResult.fieldByName('longitude'));
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
        Ti.App.fireEvent('MapProxyLoading');
        if (Device.checkNetwork()) {
            request = Titanium.Network.createHTTPClient ({
                connectionType : 'GET',
                location : Config.MAP_SERVICE_URL,
                onload : newPointsLoaded,
                onerror : onLoadError
            });
            request.open("GET", Config.MAP_SERVICE_URL);
            request.send();
        }

    };
    newPointsLoaded = function (e) {
        Ti.API.info("newPointsLoaded() in MapProxy");
        // Customize the response and add it to the cached mapPoints array in the MapProxy object.
        var response, responseLength, db;
        Ti.App.fireEvent('SessionActivity', {context: Login.sessionTimeContexts.NETWORK});
        (function(){
            try {
                response = JSON.parse(e.source.responseText);
                //Set the default map center
                defaultMapCenter.latitude = parseFloat(response.defaultLocation.latitude);
                defaultMapCenter.longitude = parseFloat(response.defaultLocation.longitude);
                responseLength = response.buildings.length;
                if (responseLength > 0) {
                    db = Ti.Database.open('umobile');
                    mapCenter.latLow = response.buildings[0].latitude;
                    mapCenter.latHigh = response.buildings[0].latitude; 
                    mapCenter.longLow = response.buildings[0].longitude;
                    mapCenter.longHigh = response.buildings[0].longitude; 

                    for (var i = 0; i <= responseLength; i++) {
                        var building = response.buildings[i];
                        if (i == responseLength) {
                            db.execute("REPLACE INTO map_locations (title, abbreviation, accuracy, address, alternateName, latitude, longitude, searchText, zip, img) VALUES (?,?,?,?,?,?,?,?,?,?)",
                                'Westin Bonaventure Hotel',
                                'WBV',
                                '',
                                '404 South Figueroa Street$Los Angeles, CA ',
                                '',
                                34.052234,
                                -118.243685,
                                'hotel, westin, bonaventure',
                                "90071",
                                ''
                                );
                        }
                        else {
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


                                /*mapPoints.push(response.buildings[i]);

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
                                }*/
                            }
                            else {
                                Ti.API.debug("Skipping " + building.name);
                            }
                        }
                        
                    }
                    db.close();
                    onPointsLoaded();                
                }
                else {
                    //No location objects in the response, so fire an event so the controller is aware.
                    Ti.App.fireEvent('MapProxyLoadError', {errorCode: _self.requestErrors.NO_DATA_RETURNED});
                }
            }
            catch (err) {
                Ti.API.info("Data was invalid, calling onInvalidData()");
                //Data didn't parse, so fire an event so the controller is aware
                Ti.App.fireEvent('MapProxyLoadError', {errorCode: _self.requestErrors.INVALID_DATA_RETURNED});
            }
        })();
    };
    
    this.getMapCenter = function (isDefault) {
        var _longDelta, _latDelta;
        if(isDefault) {
            //Wants the default map location returned from the service, 
            //not the dynamic one generated otherwise
            return defaultMapCenter;
        }
        else {
            mapCenter.latitude = (mapCenter.latLow + mapCenter.latHigh) / 2;
            mapCenter.longitude = (mapCenter.longLow + mapCenter.longHigh) / 2;
            mapCenter.latitudeDelta = (mapCenter.latHigh - mapCenter.latLow) > 0.005 ? mapCenter.latHigh - mapCenter.latLow : 0.005;
            mapCenter.longitudeDelta = (mapCenter.longHigh - mapCenter.longLow) > 0.005 ? mapCenter.longHigh - mapCenter.longLow : 0.005;
            
            Ti.API.debug("mapProxy.getMapCenter result: " + JSON.stringify(mapCenter));
            return mapCenter;
        }
    };
    
    onLoadError = function (e) {
        var errorCode;
        Ti.API.debug("Error with map service" + JSON.stringify(e));
        Ti.App.fireEvent('MapProxyLoadError', {errorCode: _self.requestErrors.GENERAL_ERROR});
    };
    
    onSearch = function (query) {
        Ti.App.fireEvent('MapProxySearching', {query: query});
    };
    
    onEmptySearch = function () {
        Ti.App.fireEvent('MapProxyEmptySearch');
    };
    
    onSearchComplete = function (result) {
        Ti.API.debug('onSearchComplete in MapProxy');
        Ti.App.fireEvent('MapProxySearchComplete', { points: result });
    };
    
    onPointsLoaded = function () {
        Ti.App.fireEvent('MapProxyPointsLoaded');
    };
};
