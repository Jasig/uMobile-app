var MapDetailTop = function (opts) {
    var detailView,
        mapIcon,
        mapIconContainer,
        directionsButton,
        locationAddressLabel,
        MAP_HEIGHT = 75,
        MAP_WIDTH = 75,
        MAP_HORIZ_PADDING = 10,
        MAP_VERT_PADDING = 10;
    
    detailView = Titanium.UI.createView({
        top: opts.top || 0,
        left: opts.left || 0,
        backgroundColor: opts.backgroundColor || '#fff',
        // height: opts.height || MAP_HEIGHT + (MAP_VERT_PADDING * 2)
        height: 'auto'
    });
    
    //Create a wrapper for the map icon, to give it rounded corners and a border
    mapIconContainer = Titanium.UI.createView({
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        left: MAP_HORIZ_PADDING,
        top: MAP_VERT_PADDING,
        borderWidth: 1,
        borderRadius: 10,
        borderColor: "#333"
    });
    
    //Load a map view thumbnail for the current location
    mapIcon = Titanium.Map.createView({
        location: {
            latitude: opts.details.latitude,
            longitude: opts.details.longitude,
            latitudeDelta: 0.001,
            longitudeDelta: 0.001
        },
        annotations:[Titanium.Map.createAnnotation({
            latitude: opts.details.latitude,
            longitude: opts.details.longitude
        })],
        width: MAP_WIDTH,
        height: MAP_HEIGHT
    });
    mapIconContainer.add(mapIcon);
    detailView.add(mapIconContainer);
    
    //Add a label for the address next to the map thumbnail
    locationAddressLabel = Titanium.UI.createLabel({
        text: opts.details.address,
        width: 'auto',
        left: (MAP_HORIZ_PADDING * 2) + mapIcon.width,
        top: MAP_VERT_PADDING,
        font: {
            fontSize: 18
        },
        color: "#333",
        textAlign: "left",
        height: 36
    });
    detailView.add(locationAddressLabel);
    
    //Add "Get Directions" button
    directionsButton = Titanium.UI.createButton({
        title: "Get Directions",
        width: 100,
        height:25,
        color: "#333",
        font: {
            fontSize: 14
        },
        top: mapIconContainer.height + mapIconContainer.top - 25,
        left: (MAP_HORIZ_PADDING * 2 ) + mapIcon.width
    });
    Ti.API.debug("bottom of map is: " + mapIconContainer.bottom);

    detailView.add(directionsButton);
    directionsButton.addEventListener("click", function(e){
        Ti.Platform.openURL('http://maps.google.com/maps?daddr='+ opts.details.address +','+ opts.details.zip +'&ie=UTF8&t=h&z=16');
    });

    return detailView;
};