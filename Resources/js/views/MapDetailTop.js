var MapDetailTop = function (opts) {
    var detailView,
        mapIconBlob,
        locationTitle,
        locationAddress,
        MAP_HEIGHT = 100,
        MAP_WIDTH = 100,
        MAP_HORIZ_PADDING = 10,
        MAP_VERT_PADDING = 10;
    
    detailView = Titanium.UI.createView({
        top: opts.top || 0,
        left: opts.left || 0,
        backgroundColor: opts.backgroundColor || '#000',
        height: opts.height || MAP_HEIGHT + (MAP_VERT_PADDING * 2)
    });
    
    mapIconContainer = Titanium.UI.createView({
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        left: MAP_HORIZ_PADDING,
        top: MAP_VERT_PADDING,
        borderWidth: 2,
        borderRadius: 10,
        borderColor: "#fff"
    });
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
    
    locationTitle = Titanium.UI.createLabel({
        text: opts.details.title,
        left: (MAP_HORIZ_PADDING * 2) + MAP_WIDTH,
        top: MAP_VERT_PADDING,
        font: {
            fontSize: 24
        },
        color: "#fff",
        textAlign: "left",
        height: 36,
        width: 'auto'
    });
    detailView.add(locationTitle);
    
    locationAddress = Titanium.UI.createLabel({
        text: opts.details.address,
        width: 'auto',
        left: (MAP_HORIZ_PADDING * 2) + mapIcon.width,
        top: MAP_VERT_PADDING + locationTitle.height,
        font: {
            fontSize: 18
        },
        color: "#eee",
        textAlign: "left",
        height: 24
    });
    detailView.add(locationAddress);

    return detailView;
};