var MapDetailViewController = function () {   
    var win = Titanium.UI.currentWindow,
        locationDetailTitleBar,
        locationDetailMap,
        locationDetail,
        locationPhotos,
        titleBackButton;
    this.init = function () {
        //Create a scrollable view to contain the contents of the detail view
        
        Ti.API.debug("Creating locationDetailScroll in MapDetailViewController");
        locationDetailScroll = Titanium.UI.createScrollView({
            // contentWidth:'auto',
            // contentHeight:50
        });
        win.add(locationDetailScroll);
        
        //Create a back button to be added to the title bar to take the user back to the map
        Ti.API.debug("Creating titleBackButton in MapDetailViewController");
        titleBackButton = Titanium.UI.createButton({
            title: "Map"
        });
        
        Ti.API.debug("adding event listener to titleBackButton in MapDetailViewController");
        titleBackButton.addEventListener("click",function(e){
            win.close();
        });

        Ti.API.debug("Creating locationDetailTitleBar in MapDetailViewController");
        //Create the title bar for the top of the detail view
        locationDetailTitleBar = new win.app.views.GenericTitleBar({
            title: win.data.title,
            settingsButton: true,
            backButton: titleBackButton,
            app: win.app
        });
        locationDetailScroll.add(locationDetailTitleBar);

        Ti.API.debug("Creating topDetailView in MapDetailViewController");
        //Create the top area of the detail view, containing the map icon, address, and directions link.
        topDetailView = new win.app.views.MapDetailTop({
            details: win.data,
            top: 50
        });
        locationDetailScroll.add(topDetailView);
        
        //Display a photo of the location, if one is available.
        if(win.data.img){
            Ti.API.info(win.data.img);
            locationPhoto = Titanium.UI.createImageView({
                image: win.data.img.replace(/\/thumbnail\//,'/photo/'),
                width: Titanium.Platform.displayCaps.platformWidth - 20,
                height:225,
                left: 10,
                top: topDetailView.size.height + topDetailView.top + 100,
                backgroundColor: "#eee",
                borderRadius: 10,
                borderWidth: 10,
                borderColor: "#eee"
            });
            locationDetailScroll.add(locationPhoto);
        }
    };
    
    this.init();
},
controller = new MapDetailViewController();