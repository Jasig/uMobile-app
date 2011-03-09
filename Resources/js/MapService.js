var MapService = {
    map : {},
    mapPoints : []
};
MapService.init = function (mapView) {
    
    //mapView object passed in from controller, for simplicity of callbacks on resource-intensive events ()
    
    Ti.API.debug('MapService initialized.');
    if (mapView) {
        MapService.map = mapView;
    }
    
    MapService.map.addEventListener("points-loaded",function(e){
        Ti.API.debug("Points loaded event");
    });
    MapService.loadMapPoints();
};
MapService.search = function (query, opts) {
    query = query.toLowerCase();
    
    //If a search isn't already executing
   if(query != '') {
        searchBusy = true;

        Ti.API.debug("Searching... Preparing to iterate. Length of points array is: " + MapService.mapPoints.length);
        MapService.map.removeAllAnnotations();
        for (var i=0, iLength = MapService.mapPoints.length; i<iLength; i++) {
            if (MapService.mapPoints[i].title.toLowerCase().search(query) != -1 || MapService.mapPoints[i].searchText.toLowerCase().search(query) != -1) {
                MapService.map.addAnnotation(Titanium.Map.createAnnotation(MapService.mapPoints[i]));
            }
        }
    } else if (query === '') {
        map.removeAllAnnotations();
    }
};
MapService.loadMapPoints = function (filters) {
    //Default returns all points for an institution.
    //Can be filtered by campus, admin-defined categories

    Ti.API.debug("loadMapPoints()");
    
    request = Titanium.Network.createHTTPClient ({
        connectionType : 'GET',
        onload : MapService.newPointsLoaded,
        onerror : function (e) {
            Ti.API.info("Error with map service" + this.responseText);
            loadingIndicator.message = "An error has occurred.";
        }
    });
    request.open("GET", UPM.MAP_SERVICE_URL);
    request.send();
    
    Ti.API.debug("MapService.updateMapPoints() request sent");
};
MapService.newPointsLoaded = function (e) {
    // Customize the response and add it to the cached mapPoints array in the MapService object.
    var response = JSON.parse(e.source.responseText);

    Ti.API.debug("newPointsLoaded()");

    for (var i = 0, iLength = response.buildings.length; i < iLength; i++) {
        response.buildings[i].title = response.buildings[i].name;
        MapService.mapPoints.push(response.buildings[i]);
    }
    MapService.map.fireEvent("points-loaded");
};

/*  Artifact from newPointsLoaded method
    mapAnnotation = Titanium.Map.createAnnotation(response.buildings[i]);
    response.buildings[i].leftView = Titanium.UI.createImageView({
    // image : response.buildings[i].img
    image : UPM.BASE_PORTAL_URL + UPM.PORTAL_CONTEXT + '/media/skins/icons/google.png', //temporary since images in feed are no good.
    width : 32,
    height :32
});*/
