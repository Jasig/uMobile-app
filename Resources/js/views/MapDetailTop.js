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
        
    Ti.API.debug("Creating detailView in MapDetailTop");
    detailView = Titanium.UI.createView({
        top: opts.top || 0,
        left: opts.left || 0,
        backgroundColor: opts.backgroundColor || '#fff'
        // height: opts.height || MAP_HEIGHT + (MAP_VERT_PADDING * 2)
    });
    
    Ti.API.debug("Creating locationAddressLabel in MapDetailTop");
    //Add a label for the address next to the map thumbnail
    locationAddressLabel = Titanium.UI.createLabel({
        text: opts.details.address || "No address available",
        left: MAP_HORIZ_PADDING,
        top: MAP_VERT_PADDING,
        font: {
            fontSize: 18
        },
        color: "#333",
        textAlign: "left",
        height: 36
    });
    detailView.add(locationAddressLabel);
    
    Ti.API.debug("Creating directionsButton in MapDetailTop");
    //Add "Get Directions" button
    directionsButton = Titanium.UI.createButton({
        title: opts.app.localDictionary.getDirections,
        width: 150,
        height:30,
        color: "#333",
        font: {
            fontSize: 14
        },
        top: locationAddressLabel.height + locationAddressLabel.top,
        left: MAP_HORIZ_PADDING
    });

    detailView.add(directionsButton);
    
    Ti.API.debug("Adding event listener to directionsButton in MapDetailTop");
    directionsButton.addEventListener("click", function(e){
        Ti.Platform.openURL('http://maps.google.com/maps?daddr='+ opts.details.address +','+ opts.details.zip +'&ie=UTF8&t=h&z=16');
    });

    return detailView;
};