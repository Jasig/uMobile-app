/* 
* @constructor
* @implements {IDetailView} 
*/
var MapDetailView = function (facade) {   
    var app = facade, _self = this, Device, Styles, LocalDictionary, UI,
        _detailView, locationDetailTitleBar, locationDetailMap, locationDetail, locationPhoto, topDetailView,
        onBackBtnClick;
        
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
        var mapImageGroup, mapGroupAddress, directionsButton, directionsButtonRow, detailImageRow, detailImage, mapDetailTableView,
        _tableViewData = [], directionsButtonOptions;
        
        Ti.API.debug("render() in MapDetailViewController");
                
        locationDetailTitleBar = UI.createSecondaryNavBar({ 
            backButtonHandler: onBackBtnClick,
            title: viewModel.title
        });
        _detailView.add(locationDetailTitleBar);
        
        mapGroupAddress = Ti.UI.createTableViewSection({
            headerTitle: LocalDictionary.locationDetails
        });
        
        mapGroupAddress.add(Ti.UI.createTableViewRow({
            title: viewModel.title || LocalDictionary.titleNotAvailable
        }));
        
        mapGroupAddress.add(Ti.UI.createTableViewRow({
            title: viewModel.address || LocalDictionary.noAddressAvailable
        }));
        
        if(viewModel.address) {
            directionsButtonOptions = Styles.contentButton.clone();
            directionsButtonOptions.width = 150;
            directionsButtonOptions.title = LocalDictionary.getDirections;
            directionsButton = Titanium.UI.createButton(directionsButtonOptions);
            // directionsButton.width = 'auto';
            directionsButtonRow = Ti.UI.createTableViewRow();
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
            mapImageGroup = Ti.UI.createTableViewSection({
                headerTitle: LocalDictionary.locationImage
            });
            detailImageRow = Ti.UI.createTableViewRow();
            detailImage = Titanium.UI.createImageView({
                image: viewModel.img.replace(/\/thumbnail\//,'/photo/')
            });
            detailImageRow.add(detailImage);
            mapImageGroup.add(detailImageRow);
            _tableViewData.push(mapImageGroup);
        }

        mapDetailTableView = Ti.UI.createTableView(Styles.mapDetailTableView);
        mapDetailTableView.setData(_tableViewData);
        _detailView.add(mapDetailTableView);
    };
    
    this.hide = function () {
        if (_detailView) {
            _detailView.hide();
        }
    };
    
    onBackBtnClick = function (e) {
        _detailView.hide();
    };
    
    init();
};