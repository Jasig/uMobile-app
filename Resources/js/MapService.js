var MapService = function () {
    var map,
        mapPoints = [],
        annotationEvents = {},
        app;
        
    this.init = function (mapView,facade) {

        //mapView object passed in from controller, for simplicity of callbacks on resource-intensive events ()

        if (mapView) {
            map = mapView;
        }
        if (facade) {
            app = facade;
        }

        map.addEventListener("points-loaded",function(e){
            Ti.API.debug("Points loaded event");
        });
               
               
        this.loadMapPoints();
    };
    this.search = function (query, opts) {
        var searchBusy;
        query = query.toLowerCase();

        //If a search isn't already executing
       if(!searchBusy && query != '') {
            searchBusy = true;

            map.removeAllAnnotations();
            for (var i=0, iLength = mapPoints.length; i<iLength; i++) {
                if (mapPoints[i].title.toLowerCase().search(query) != -1) {
                    //|| MapService.mapPoints[i].searchText.toLowerCase().search(query) != -1
                    _annotation = Titanium.Map.createAnnotation(mapPoints[i]);
                    map.addAnnotation(_annotation);
                }
            }
            searchBusy = false;
        } else if (query === '') {
            map.removeAllAnnotations();
        }
    };
    this.getAnnotationByTitle = function(t) {
        for (var i=0, iLength=mapPoints.length; i<iLength; i++) {
            if (mapPoints[i].title === t) {
                return mapPoints[i];
            }
        }
    };
    this.loadMapPoints = function (filters) {
        //Default returns all points for an institution.
        //Can be filtered by campus, admin-defined categories

        Ti.API.info("loadMapPoints()");

        request = Titanium.Network.createHTTPClient ({
            connectionType : 'GET',
            location : app.UPM.MAP_SERVICE_URL,
            // onload : MapService.newPointsLoaded,
            onload : this.newPointsLoaded,
            onerror : function (e) {
                Ti.API.info("Error with map service" + this.responseText);
            }
        });
        request.open("GET", app.UPM.MAP_SERVICE_URL);
        request.send();

        Ti.API.debug("MapService.updateMapPoints() request sent");

    };
    this.newPointsLoaded = function (e) {
        // Customize the response and add it to the cached mapPoints array in the MapService object.
        var response = JSON.parse(e.source.responseText);
        Ti.API.debug("newPointsLoaded()");

        for (var i = 0, iLength = response.buildings.length; i < iLength; i++) {
            var btnRight;
            response.buildings[i].title = response.buildings[i].name;
            response.buildings[i].latitude = parseFloat(response.buildings[i].latitude);
            response.buildings[i].longitude = parseFloat(response.buildings[i].longitude);
            // response.buildings[i].pincolor = Titanium.Map.ANNOTATION_PURPLE;
            // response.buildings[i].myid = response.buildings[i].abbreviation;

            btnRight = Titanium.UI.createImageView({
                image: 'images/btnCircleRightArrow.png',
                width: 30,
                height: 30,
                _parent: response.buildings[i]
            });
            btnRight.addEventListener('touchstart', annotationEvents.touchStart);
            btnRight.addEventListener('touchend', annotationEvents.touchEnd);
            btnRight.addEventListener('singletap',annotationEvents.singleTap);
            response.buildings[i].rightView = btnRight;

            mapPoints.push(response.buildings[i]);
        }
        Ti.API.info("First point in array is: " + JSON.stringify(mapPoints[0]));

        map.fireEvent("pointsloaded");
    };
    annotationEvents.touchStart = function(e){
        e.source.image = 'images/btnCircleRightArrow-press.png';
    };
    annotationEvents.touchEnd = function(e){
        e.source.image = 'images/btnCircleRightArrow.png';
    };
    annotationEvents.singleTap = function(e){
        if(e.source._parent) {
            map.fireEvent("loaddetail",e.source._parent);
            Ti.API.info("loaddetail event fired with parent: " + e.source._parent);        
        } 
        else {
            Ti.API.info("loaddetail event didn't fire." + JSON.stringify(e));
        }

    };
    return this;
};