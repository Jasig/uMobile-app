GlobalActivityIndicator = function (app) {
    var self = Titanium.UI.createActivityIndicator(app.styles.globalActivityIndicator);
        
    self.resetDimensions = function () {
        self.height = Ti.Platform.displayCaps.platformHeight;
        self.width = Ti.Platform.displayCaps.platformHeight;
    };
    
    return self;
};