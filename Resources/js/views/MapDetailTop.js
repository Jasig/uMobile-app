var MapDetailTop = function (opts) {
    var app = opts.app,
        details = opts.details,
        detailView,
        mapIcon,
        mapIconContainer,
        directionsButton,
        locationTitle,
        locationTitleOptions,
        locationAddress,
        locationAddressOptions,
        onGetDirections,
        getMapAddress;
        
    function init() {
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
        //Add "Get Directions" button
        directionsButtonOptions = app.styles.contentButton;
        directionsButtonOptions.title = opts.app.localDictionary.getDirections;
        directionsButtonOptions.top = locationAddress.height + locationAddress.top + 5;
        directionsButtonOptions.left = 10;
        directionsButtonOptions.width = 150;
        directionsButton = Titanium.UI.createButton(directionsButtonOptions);

        detailView.add(directionsButton);

        Ti.API.debug("Adding event listener to directionsButton in MapDetailTop");
        directionsButton.addEventListener("click", onGetDirections);        
        
        detailView.update = update;
    }
    
    function update (data) {
        details = data;
        locationAddress.text = details.address || app.localDictionary.noAddressAvailable;
    };
    
    getMapAddress = function () {
        return 'http://maps.google.com/maps?daddr='+ details.address +','+ details.zip +'&ie=UTF8&t=h&z=16';
    };
    
    onGetDirections = function (e) {
        Ti.Platform.openURL(getMapAddress());
    };

    init();

    return detailView;
};