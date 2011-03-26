var MapService = function (facade) {
    var app = facade,
        self = {},
        mapPoints = [];
        
    self.init = function () {               
        self.loadMapPoints();
    };
    
    self.search = function (query, opts) {

        var result = [];
        query = query.toLowerCase();

        //If a search isn't already executing
       if(query != '') {
            onSearch(query);
            Ti.API.info("Starting to search...");

            for (var i=0, iLength = mapPoints.length; i<iLength; i++) {
                if (mapPoints[i].title.toLowerCase().search(query) != -1 || mapPoints[i].searchText.toLowerCase().search(query) != -1) {
                    result.push(mapPoints[i]);
                }
            }
            onSearchComplete(result);
            
        } else if (query === '') {
            onEmptySearch();
        }
    };
    self.getAnnotationByTitle = function(t) {
        for (var i=0, iLength=mapPoints.length; i<iLength; i++) {
            if (mapPoints[i].title === t) {
                return mapPoints[i];
            }
        }
        return false;
    };
    self.loadMapPoints = function (filters) {
        //Default returns all points for an institution.
        //Can be filtered by campus, admin-defined categories
        Ti.API.info("loadMapPoints()");

        request = Titanium.Network.createHTTPClient ({
            connectionType : 'GET',
            location : app.UPM.MAP_SERVICE_URL,
            onload : self.newPointsLoaded,
            onerror : function (e) {
                Ti.API.info("Error with map service" + request.responseText);
            }
        });
        request.open("GET", app.UPM.MAP_SERVICE_URL);
        request.send();

        Ti.API.debug("MapService.updateMapPoints() request sent");

    };
    self.newPointsLoaded = function (e) {
        // Customize the response and add it to the cached mapPoints array in the MapService object.
        var response = JSON.parse(e.source.responseText);
        Ti.API.debug("newPointsLoaded()");

        for (var i = 0, iLength = response.buildings.length; i < iLength; i++) {
            response.buildings[i].title = response.buildings[i].name;
            response.buildings[i].latitude = parseFloat(response.buildings[i].latitude);
            response.buildings[i].longitude = parseFloat(response.buildings[i].longitude);

            mapPoints.push(response.buildings[i]);
        }
        onPointsLoaded();
    };
    
    function onSearch(query) {
        Ti.App.fireEvent('MapProxySearching',query);
    }
    
    function onEmptySearch () {
        Ti.App.fireEvent('MapProxyEmptySearch');
    }
    
    function onSearchComplete(result) {
        Ti.API.debug('onSearchComplete in MapProxy: ' + JSON.stringify(result));
        Ti.App.fireEvent('MapProxySearchComplete', { points: result });
    }
    
    function onPointsLoaded () {
        Ti.App.fireEvent('MapProxyPointsLoaded');
    }
    
    return self;
};