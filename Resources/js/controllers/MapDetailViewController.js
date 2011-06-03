var MapDetailViewController = function (facade,opts) {   
    var app = facade,
        self = Titanium.UI.createView(app.styles.view),
        Device, Styles, LocalDictionary, MapDetailTop, UI,
        locationData = opts.data,
        locationDetailTitleBar,
        locationDetailMap,
        locationDetail,
        locationPhotoOptions = {},
        locationPhoto,
        titleBackButton,
        topDetailView;
        
    init = function () {        
        //Create a back button to be added to the title bar to take the user back to the map
        Ti.API.debug("Creating titleBackButton in MapDetailViewController");

        //Declare pointers to facade modules
        Device = app.models.deviceProxy;
        Styles = app.styles;
        LocalDictionary = app.localDictionary;
        MapDetailTop = app.views.MapDetailTop;
        UI = app.UI;
        
        titleBackButtonOptions = Styles.secondaryBarButton;
        titleBackButtonOptions.title = LocalDictionary.back;
        titleBackButton = Titanium.UI.createButton(titleBackButtonOptions);
        
        Ti.API.debug("adding event listener to titleBackButton in MapDetailViewController");
        titleBackButton.addEventListener("click",function(e){
            self.hide();
        });
        
        showTitleBar();
        showTop();
        showImage();

        self.updateAndShow = updateAndShow;
    };
    
    function showTitleBar () {
        Ti.API.debug("Creating locationDetailTitleBar in MapDetailViewController");
        //Create the title bar for the top of the detail view
        if(!locationDetailTitleBar) {
            locationDetailTitleBar = UI.createSecondaryNavBar({
                backButton: titleBackButton
            });
            Ti.API.debug("Here's what the Secondary Nav Title Bar came back as: " + locationDetailTitleBar);
            self.add(locationDetailTitleBar);            
        }
    }
    
    function showTop () {
        Ti.API.debug("Creating topDetailView in MapDetailViewController");
        //Create the top area of the detail view, containing the map icon, address, and directions link.
        if(!topDetailView) {
            topDetailView = new MapDetailTop({
                details: locationData,
                app: app
            });
            self.add(topDetailView);            
        }
        else {
            topDetailView.update(locationData);
        }
        
    }
    
    function showImage () {
        //Display a photo of the location, if one is available.
        if (locationData.img) {
            if(!locationPhoto) {
                locationPhotoOptions = Styles.mapDetailLocationPhoto;
                locationPhotoOptions.image = locationData.img.replace(/\/thumbnail\//,'/photo/');
                locationPhoto = Titanium.UI.createImageView(locationPhotoOptions);                
                self.add(locationPhoto);
            }
            else {
                locationPhoto.image = locationData.img.replace(/\/thumbnail\//,'/photo/');
            }
        }        
    }
    
    function updateAndShow (data) {
        Ti.API.debug("MapDetailViewController.updateAndShow() called");
        locationData = data;
        
        showTop();
        showImage();
        
        self.show();
    };
    
    init();
    
    return self;
};