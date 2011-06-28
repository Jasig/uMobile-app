var DeviceProxy = function (facade) {
    var app = facade, _self = this, LocalDictionary, _orientation = false;
    
    init = function () {
        LocalDictionary = app.localDictionary;
    };
    
    this.checkNetwork = function() {
        if (!Ti.Network.online) {
            alertDialog = Titanium.UI.createAlertDialog({
                title: LocalDictionary.error,
                message: LocalDictionary.networkConnectionRequired,
                buttonNames: [LocalDictionary.OK]
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
    
    this.isIPad = function () {
        return Ti.Platform.osname === 'ipad' ? true : false;
    };
    
    this.isIPhone = function () {
        return Ti.Platform.osname === 'iphone' ? true : false;
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
    
    this.getWidth = function () {
        return Ti.Platform.displayCaps.platformWidth;
    };
    
    this.getHeight = function () {
        return Ti.Platform.displayCaps.platformHeight;
    };
    
    this.setCurrentOrientation = function (orientation) {
        _orientation = orientation;
    };
    
    this.getCurrentOrientation = function () {
        return _orientation;
    };
    
    init();
};