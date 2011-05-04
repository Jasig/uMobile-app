var ResourceProxy = function (facade) {
    var resources = {}, app = facade, init, resolutionMatrix = ResourceProxy.resolutionMatrix;
    
    resources.getResourcePath = function (file) {
        //File path should be passed in as a relative path loaded from the root of the Resources directory. 
        //Should not contain a forward slash at beginning of path.
        if(Titanium.Platform.osname === ('iphone' || 'ipad')) {
            Ti.API.info("getResourcePath is iOS");
            return file;
        } 
        else if (Titanium.Platform.osname === 'android') {
            Ti.API.info("getResourcePath is Android");
            return "/" + file;
        }
        else {
            return file;
        }
    };
    
    resources.getPortletIcon = function (fname) {
        var resolution, density;
        
        //Every icon should have these sizes: 114 (iOS retina), 72 (iPad and Android hi-res), 57 (iOS medium), 48 (Android medium), 36 (Android low)
        resolution = '_' + resolutionMatrix[Ti.Platform.osname][Ti.Platform.displayCaps.density];
        
        if (app.UPM.nativeIcons[fname]) {
            var path = (app.UPM.nativeIcons[fname]).replace('.png', resolution + '.png');
            Ti.API.debug("Trying to load image from path: " + path);
            return path;
        }
        else {
            Ti.API.debug("Can't find icon for " + fname);
            return false;
        }
    };
    
    return resources;
};
ResourceProxy.resolutionMatrix = {
    android: {
        high: 72,
        medium: 57,
        low: 36
    },
    ipad: {
        medium: 72
    },
    iphone: {
        medium: 57,
        high: 114
    }
};