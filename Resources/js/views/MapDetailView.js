var MapDetailView = function (facade) {   
    var app = facade, _self = this, Device, Styles, LocalDictionary, UI,
        _detailView, locationDetailTitleBar, locationDetailMap, locationDetail, locationPhoto, titleBackButton, topDetailView,
        locationPhotoOptions = {};
        
    init = function () {        
        //Create a back button to be added to the title bar to take the user back to the map
        Ti.API.debug("Creating titleBackButton in MapDetailViewController");

        //Declare pointers to facade modules
        Device = app.models.deviceProxy;
        Styles = app.styles;
        LocalDictionary = app.localDictionary;
        UI = app.UI;
        
        Ti.App.addEventListener('updatestylereference', function (e) {
            Styles = app.styles;
        });
    };
    
    this.getDetailView = function () {
        if (!_detailView) {
            _detailView = Titanium.UI.createView(app.styles.view);
        }
        return _detailView;
    };
    
    this.render = function (viewModel) {
        Ti.API.debug("render() in MapDetailViewController");
        if (!titleBackButton) {
            titleBackButtonOptions = Styles.secondaryBarButton;
            titleBackButtonOptions.title = LocalDictionary.back;
            titleBackButton = Titanium.UI.createButton(titleBackButtonOptions);
            
            titleBackButton.addEventListener("click", function(e){
                _detailView.hide();
            });
        }
        
        if(!locationDetailTitleBar) {
            locationDetailTitleBar = UI.createSecondaryNavBar({ backButton: titleBackButton });
            _detailView.add(locationDetailTitleBar);            
        }
        
        var mapGroupAddress = Ti.UI.createTableViewSection({
            headerTitle: LocalDictionary.locationDetails
        });
        var _tableViewData = [];
        
        mapGroupAddress.add(Ti.UI.createTableViewRow({
            title: viewModel.title || LocalDictionary.titleNotAvailable
        }));
        
        mapGroupAddress.add(Ti.UI.createTableViewRow({
            title: viewModel.address || LocalDictionary.noAddressAvailable
        }));
        
        if(viewModel.address) {
            var directionsButtonOptions = Styles.contentButton;
            directionsButtonOptions.width = 150;
            directionsButtonOptions.title = LocalDictionary.getDirections;
            var directionsButton = Titanium.UI.createButton(directionsButtonOptions);
            // directionsButton.width = 'auto';
            var directionsButtonRow = Ti.UI.createTableViewRow();
            directionsButtonRow.add(directionsButton);
            mapGroupAddress.add(directionsButtonRow);
            
            directionsButton.addEventListener("click", function (e) {
                Ti.Platform.openURL('http://maps.google.com/maps?daddr='+ viewModel.address +','+ viewModel.zip +'&ie=UTF8&t=h&z=16');
            });
            directionsButton.addEventListener('touchstart', function (e) {
                directionsButton.backgroundGradient = Styles.contentButton.backgroundGradientPress;
            });
            directionsButton.addEventListener('touchend', function (e) {
                directionsButton.backgroundGradient = Styles.contentButton.backgroundGradient;
            });
        }
        
        _tableViewData.push(mapGroupAddress);
        
        if (viewModel.img) {
            var mapImageGroup = Ti.UI.createTableViewSection({
                headerTitle: LocalDictionary.locationImage
            });
            var detailImageRow = Ti.UI.createTableViewRow();
            var detailImage = Titanium.UI.createImageView({
                image: viewModel.img.replace(/\/thumbnail\//,'/photo/')
            });
            detailImageRow.add(detailImage);
            mapImageGroup.add(detailImageRow);
            _tableViewData.push(mapImageGroup);
        }

        var mapDetailTableView = Ti.UI.createTableView(Styles.mapDetailTableView);
        mapDetailTableView.setData(_tableViewData);
        _detailView.add(mapDetailTableView);
    };
    
    init();
};