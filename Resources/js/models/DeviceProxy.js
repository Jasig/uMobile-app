var DeviceProxy = function (facade) {
    var app = facade, _self = this;
    
    init = function () {
        // nothing to see here
    };
    
    this.checkNetwork = function() {
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
    
    this.isIOS = function () {
        if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
            return true;
        }
        else {
            return false;
        }
    };
    
    this.isAndroid = function () {
        if (Ti.Platform.osname === 'android') {
            return true;
        }
        else {
            return false;
        }
    };
    
    this.isBlackBerry = function () {
        return false;
    };
    
    init();
};