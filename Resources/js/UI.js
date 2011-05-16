var UI = function (facade) {
    var self = {}, app=facade, init;
    
    init = function () {
        
    };
    
    self.createTitleBar = function () {
        
    };
    
    self.createActivityIndicator = function () {
        var messageLabel,
            indicator = Ti.UI.createView(app.styles.globalActivityIndicator),
            dialog = Ti.UI.createView(app.styles.activityIndicatorDialog);

        indicator.add(dialog);
        
        messageLabel = Ti.UI.createLabel(app.styles.activityIndicatorMessage);
        messageLabel.text = app.localDictionary.loading;
        dialog.add(messageLabel);
        
        indicator.loadingMessage = function (m) {
            Ti.API.info("loadingMessage() in GlobalActivityIndicator");
            if (typeof m == 'string') {
                Ti.API.debug("Setting activity indicator text to: " + m);
                messageLabel.text = m;
            }
            else {
                Ti.API.debug("Message isn't valid:" + m + ' ' + typeof m);
            }
        };
        
        indicator.resetDimensions = function () {
            indicator.top = app.styles.globalActivityIndicator.top;
            indicator.height = app.styles.globalActivityIndicator.height;
            indicator.width = app.styles.globalActivityIndicator.width;
        };
        
        return indicator;
    };
    
    init();
    
    return self;
};