var MapService = {
    map : {},
    mapPoints : [],
    annotationEvents: {}
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
    var searchBusy;
    query = query.toLowerCase();
    
    //If a search isn't already executing
   if(!searchBusy && query != '') {
        searchBusy = true;

        Ti.API.debug("Searching... Preparing to iterate. Length of points array is: " + MapService.mapPoints.length);
        MapService.map.removeAllAnnotations();
        for (var i=0, iLength = MapService.mapPoints.length; i<iLength; i++) {
            if (MapService.mapPoints[i].title.toLowerCase().search(query) != -1) {
                //|| MapService.mapPoints[i].searchText.toLowerCase().search(query) != -1
                MapService.map.addAnnotation(Titanium.Map.createAnnotation(MapService.mapPoints[i]));
            }
        }
        searchBusy = false;
    } else if (query === '') {

        MapService.map.removeAllAnnotations();
    }
};
MapService.loadMapPoints = function (filters) {
    //Default returns all points for an institution.
    //Can be filtered by campus, admin-defined categories

    Ti.API.info("loadMapPoints()");
    
    request = Titanium.Network.createHTTPClient ({
        connectionType : 'GET',
        location : UPM.MAP_SERVICE_URL,
        // onload : MapService.newPointsLoaded,
        onload : MapService.newPointsLoaded,
        onerror : function (e) {
            Ti.API.info("Error with map service" + this.responseText);
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
        var btnRight;
        response.buildings[i].title = response.buildings[i].name;
        response.buildings[i].latitude = parseFloat(response.buildings[i].latitude);
        response.buildings[i].longitude = parseFloat(response.buildings[i].longitude);
        response.buildings[i].pincolor = Titanium.Map.ANNOTATION_PURPLE;
        // response.buildings[i].myid = response.buildings[i].abbreviation;
        // leftButton: '../images/appcelerator_small.png',

        btnRight = Titanium.UI.createImageView({
            image: 'images/btnCircleRightArrow.png',
            width: 30,
            height: 30,
            _parent: response.buildings[i]
            
        });
        btnRight.addEventListener('touchstart', MapService.annotationEvents.touchStart);
        btnRight.addEventListener('touchend', MapService.annotationEvents.touchEnd);
        btnRight.addEventListener('singletap',MapService.annotationEvents.singleTap);
        response.buildings[i].rightView = btnRight;
        	
        MapService.mapPoints.push(response.buildings[i]);
    }
    Ti.API.info("First point in array is: " + JSON.stringify(MapService.mapPoints[0]));
    
    MapService.map.fireEvent("pointsloaded");
};
MapService.annotationEvents.touchStart = function(e){
    e.source.image = 'images/btnCircleRightArrow-press.png';
};
MapService.annotationEvents.touchEnd = function(e){
    e.source.image = 'images/btnCircleRightArrow.png';
};
MapService.annotationEvents.singleTap = function(e){
    MapService.map.fireEvent("loaddetail",e.source._parent);
    Ti.API.info("loaddetail event fired with parent: " + e.source._parent);
};

/*  Artifact from newPointsLoaded method
    mapAnnotation = Titanium.Map.createAnnotation(response.buildings[i]);
    response.buildings[i].leftView = Titanium.UI.createImageView({
    // image : response.buildings[i].img
    image : UPM.BASE_PORTAL_URL + UPM.PORTAL_CONTEXT + '/media/skins/icons/google.png', //temporary since images in feed are no good.
    width : 32,
    height :32
});*/
