GlobalActivityIndicator = function (app) {
    var self = Titanium.UI.createActivityIndicator(app.styles.globalActivityIndicator);
        
    self.resetDimensions = function () {
        self.top = app.styles.globalActivityIndicator.top;
        self.height = app.styles.globalActivityIndicator.height;
        self.width = app.styles.globalActivityIndicator.width;
    };
    
    return self;
};