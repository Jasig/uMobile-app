var MapDetailTop = function (opts) {
    var app = opts.app, Styles, LocalDictionary,
        details = opts.details,
        detailView, mapIcon, mapIconContainer, directionsButton, locationTitle, locationAddress,
        onGetDirections, onDirBtnPress, onDirBtnUp,
        getMapAddress;
        
    function init() {
        var locationAddressOptions, locationTitleOptions;
        
        Styles = app.styles;
        LocalDictionary = app.localDictionary;
        
        Ti.API.debug("Creating detailView in MapDetailTop");
        detailViewOptions = Styles.mapDetailViewTop;
        detailView = Titanium.UI.createView(Styles.mapDetailTopView);

        locationTitleOptions = Styles.mapDetailLocationTitle;
        locationTitleOptions.text = details.title;
        locationTitle = Titanium.UI.createLabel(locationTitleOptions);
        detailView.add(locationTitle);

        Ti.API.debug("Creating locationAddressLabel in MapDetailTop");
        //Add a label for the address next to the map thumbnail
        locationAddressOptions = Styles.mapDetailLocationAddress;
        locationAddressOptions.text = details.address || LocalDictionary.noAddressAvailable;
        locationAddress = Titanium.UI.createLabel(locationAddressOptions);
        detailView.add(locationAddress);

        Ti.API.debug("Creating directionsButton in MapDetailTop");
        
        directionsButtonOptions = Styles.contentButton;
        
        //Add "Get Directions" button

        directionsButtonOptions.top = locationAddress.height + locationAddress.top + 5;
        directionsButtonOptions.left = 10;
        directionsButtonOptions.width = 150;
        
        if(details.address) {
            directionsButtonOptions.title = LocalDictionary.getDirections;
        }
        directionsButton = Titanium.UI.createButton(directionsButtonOptions);
        detailView.add(directionsButton);
        
        if (details.address) {
            directionsButton.show();
        } 
        else {
            directionsButton.hide();
            directionsButton.visible = false;
        }

        Ti.API.debug("Adding event listener to directionsButton in MapDetailTop");
        directionsButton.addEventListener("click", onGetDirections);
        directionsButton.addEventListener('touchstart', onDirBtnPress);
        directionsButton.addEventListener('touchend', onDirBtnUp);
        
        Ti.API.debug("Added event listeners to directionsButton, now calling update()");
        detailView.update = update;
        
        Ti.App.addEventListener('updatestylereference', function (e) {
            Styles = app.styles;
        });
    }
    
    function update (data) {
        Ti.API.debug("update() in MapDetailTop");
        details = data;
        if(details.address) {
            directionsButton.show();
        }
        else {
            directionsButton.hide();
            directionsButton.visible = false;
        }

        locationTitle.text = details.title;

        locationAddress.text = details.address || LocalDictionary.noAddressAvailable;
        Ti.API.debug("update() finished in MapDetailTop");
    };
    
    getMapAddress = function () {
        return 'http://maps.google.com/maps?daddr='+ details.address +','+ details.zip +'&ie=UTF8&t=h&z=16';
    };
    
    onGetDirections = function (e) {
        Ti.Platform.openURL(getMapAddress());
    };
    onDirBtnPress = function (e) {
        directionsButton.backgroundGradient = Styles.contentButton.backgroundGradientPress;
    };
    
    onDirBtnUp = function (e) {
        directionsButton.backgroundGradient = Styles.contentButton.backgroundGradient;
    };

    init();

    return detailView;
};