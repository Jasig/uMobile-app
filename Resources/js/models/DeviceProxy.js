var DeviceProxy = function (facade) {
    var app = facade, self = {};
    
    init = function () {
        // nothing to see here
    };
    
    self.checkNetwork = function() {
        if (!Ti.Network.online) {
            alertDialog = Titanium.UI.createAlertDialog({
                title: app.localDictionary.error,
                message: app.localDictionary.networkConnectionRequired,
                buttonNames: [app.localDictionary.OK]
            });
            alertDialog.show();
            Ti.API.debug("Network is offline");
            return false;
        } else {
            return true;
        }
    };
    
    init();
    
    return self;
};