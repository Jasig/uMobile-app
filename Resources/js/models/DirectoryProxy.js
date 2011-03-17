var DirectoryProxy = function (facade,opts) {
    var app=facade,
        self = {},
        init,
        xhr,
        xhrOnLoad,
        xhrOnError,
        person,
        people = [];

    init = function () {
        //Generate the HTTP request to be used each time a search is performed
        xhr = Titanium.Network.createHTTPClient({
            onload: xhrOnLoad,
            onerror: xhrOnError
        });
    };
    
    self.search = function (query) {
        xhr.open('GET',app.UPM.DIRECTORY_SERVICE_URL);
        xhr.send();
        Ti.API.info('Query: ' + app.UPM.DIRECTORY_SERVICE_URL);
        Ti.App.fireEvent('DirectoryProxySearching');
    };
    
    xhrOnLoad = function () {
        Ti.App.fireEvent('DirectoryProxySearchComplete');
        Ti.API.info(xhr.responseText);
    };
    
    xhrOnError = function (e) {
        Ti.App.fireEvent('DirectoryProxySearchError');
    };
    
    self.getPeople = function () {
        return people;
    };
    
    init();
    
    return self;
};