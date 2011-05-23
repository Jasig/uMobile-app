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
    
    self.isIOS = function () {
        if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
            return true;
        }
        else {
            return false;
        }
    };
    
    self.isAndroid = function () {
        if (Ti.Platform.osname === 'android') {
            return true;
        }
        else {
            return false;
        }
    };
    
    self.isBlackBerry = function () {
        return false;
    };
    
    init();
    
    return self;
};