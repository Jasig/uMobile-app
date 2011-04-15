var ResourceProxy = function () {
    var resources = {};
    
    resources.getResourcePath = function (file) {
        //File path should be passed in as a relative path loaded from the root of the Resources directory. 
        //Should not contain a forward slash at beginning of path.
        if(Titanium.Platform.osname === ('iphone' || 'ipad')) {
            Ti.API.info("getResourcePath is iOS");
            return file;
        } 
        else if (Titanium.Platform.osname === 'android') {
            Ti.API.info("getResourcePath is Android");
            return Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory + "/" + file);
        }
        else {
            return file;
        }
    };
    
    return resources;
};