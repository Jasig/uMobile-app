var MapDetailTop = function (opts) {
    var app = opts.app,
        details = opts.details,
        detailView, mapIcon, mapIconContainer, directionsButton, locationTitle, locationAddress,
        onGetDirections, onDirBtnPress, onDirBtnUp,
        getMapAddress;
        
    function init() {
        var locationAddressOptions, locationTitleOptions;
        
        Ti.API.debug("Creating detailView in MapDetailTop");
        detailViewOptions = app.styles.mapDetailViewTop;
        detailView = Titanium.UI.createView(app.styles.mapDetailTopView);

        locationTitleOptions = app.styles.mapDetailLocationTitle;
        locationTitleOptions.text = details.title;
        locationTitle = Titanium.UI.createLabel(locationTitleOptions);
        detailView.add(locationTitle);

        Ti.API.debug("Creating locationAddressLabel in MapDetailTop");
        //Add a label for the address next to the map thumbnail
        locationAddressOptions = app.styles.mapDetailLocationAddress;
        locationAddressOptions.text = details.address || app.localDictionary.noAddressAvailable;
        locationAddress = Titanium.UI.createLabel(locationAddressOptions);
        detailView.add(locationAddress);

        Ti.API.debug("Creating directionsButton in MapDetailTop");
        
        directionsButtonOptions = app.styles.contentButton;
        
        //Add "Get Directions" button

        directionsButtonOptions.top = locationAddress.height + locationAddress.top + 5;
        directionsButtonOptions.left = 10;
        directionsButtonOptions.width = 150;
        
        if(details.address) {
            directionsButtonOptions.title = opts.app.localDictionary.getDirections;
        }
        directionsButton = Titanium.UI.createButton(directionsButtonOptions);
        
        detailView.add(directionsButton);
        if (details.address) {
            directionsButton.show();
        } 
        else {
            directionsButton.hide();
        }

        Ti.API.debug("Adding event listener to directionsButton in MapDetailTop");
        directionsButton.addEventListener("click", onGetDirections);
        directionsButton.addEventListener('touchstart', onDirBtnPress);
        directionsButton.addEventListener('touchend', onDirBtnUp);
        
        Ti.API.debug("Added event listeners to directionsButton, now calling update()");
        detailView.update = update;
    }
    
    function update (data) {
        Ti.API.debug("update() in MapDetailTop");
        details = data;
        if(details.address) {
            directionsButton.show();
        }
        else {
            directionsButton.hide();
        }

        locationTitle.text = details.title;

        locationAddress.text = details.address || app.localDictionary.noAddressAvailable;
        Ti.API.debug("update() finished in MapDetailTop");
    };
    
    getMapAddress = function () {
        return 'http://maps.google.com/maps?daddr='+ details.address +','+ details.zip +'&ie=UTF8&t=h&z=16';
    };
    
    onGetDirections = function (e) {
        Ti.Platform.openURL(getMapAddress());
    };
    onDirBtnPress = function (e) {
        directionsButton.backgroundGradient = app.styles.contentButton.backgroundGradientPress;
    };
    
    onDirBtnUp = function (e) {
        directionsButton.backgroundGradient = app.styles.contentButton.backgroundGradient;
    };

    init();

    return detailView;
};