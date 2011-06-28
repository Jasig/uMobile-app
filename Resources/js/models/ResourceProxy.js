/**
* @constructor
**/

var ResourceProxy = function (facade) {
    var _self = this, app = facade, init, Config, Device,
    resolutionMatrix;
    
    init = function () {
        Config = app.config;
        Device = app.models.deviceProxy;
    };
    
    this.getPortletIcon = function (fname) {
        if (!Config.nativeIcons[fname]) {
            Ti.API.error("Couldn't find icon for " + fname);
            return false;
        }
        else if (Device.isIPad()) {
            return '/images/' + Config.nativeIcons[fname].replace('.png', '_72.png');
        }
        else if (Device.isIPhone()){
            return '/images/' + Config.nativeIcons[fname];
        }
        else if (Device.isAndroid()) {
            Ti.API.debug("Device.isAndroid() in getPortletIcon." + fname);
                return '/images/' + Config.nativeIcons[fname];
        }
        else {
            Ti.API.error("This device type could not be determined in getPortletIcon() in ResourceProxy");
            return false;
        }
    };
    init();
};