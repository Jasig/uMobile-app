GlobalActivityIndicator = function (app) {
    var self = Titanium.UI.createActivityIndicator({
        color: app.UPM.GLOBAL_STYLES.activityIndicatorColor,
        height: Ti.Platform.displayCaps.platformHeight,
        width: Ti.Platform.displayCaps.platformHeight
        
        // message: app.localDictionary.activityIndicatorMessage
    });
    
    if(Ti.Platform.osname == 'iphone') {
        backgroundImage = app.UPM.getResourcePath(app.UPM.GLOBAL_STYLES.activityIndicatorBackgroundImage);
    }
    else {
        backgroundColor = "#f00";
    }
    
    self.resetDimensions = function () {
        self.height = Ti.Platform.displayCaps.platformHeight;
        self.width = Ti.Platform.displayCaps.platformHeight;
    };
    
    return self;
};