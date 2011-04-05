var DirectoryProxy = function (facade,opts) {
    var app=facade,
        self = {},
        init,
        xhrSearch,
        xhrSearchOnLoad,
        xhrSearchOnError,
        person,
        people = [];

    init = function () {
        //Generate the HTTP request to be used each time a search is performed
        xhrSearch = Titanium.Network.createHTTPClient({
            onload: onXhrSearchLoad,
            onerror: onXhrSearchError
        });
    };
    
    self.search = function (query) {
        Ti.API.info("query: " + query);
        var url = app.UPM.DIRECTORY_SERVICE_URL;
        var separator = '?';
        Ti.API.info("url: " + url);
        var i = 0;
        for (i = 0; i < app.UPM.DIRECTORY_SERVICE_SEARCH_FIELDS.length; i++) {
            url += separator + 'searchTerms[]=' + app.UPM.DIRECTORY_SERVICE_SEARCH_FIELDS[i];
            separator = '&';
        }
        separator = '&';
        Ti.API.info("query: " + query);
        Ti.API.info("url: " + url);
        for (i = 0; i < app.UPM.DIRECTORY_SERVICE_SEARCH_FIELDS.length; i++) {
            url += separator + app.UPM.DIRECTORY_SERVICE_SEARCH_FIELDS[i] + '=' + query;
            separator = '&';
        }
        
        Ti.API.info('Query: ' + url);
        xhrSearch.open('GET', url);
        xhrSearch.send();
        Ti.App.fireEvent('DirectoryProxySearching');
    };
    self.clear = function () {
        people = [];
        xhrSearch.abort();
    };
    
    self.getPeople = function (index) {
        //If no index is provided, return all people. Otherwise, provide one Person.
        if(!index) {
            return people;
        }
        else {
            return people[index];
        }
    };
    self.getEmergencyContacts = function () {
        return app.UPM.directoryEmergencyContacts || null;
    };
    
    onXhrSearchLoad = function (e) {
        //When the search is complete, reset the main people array
        people = [];
        var _people = JSON.parse(xhrSearch.responseText).people;
        for (var i=0, iLength=_people.length; i<iLength; i++) {
            Ti.API.info('calling method');
            people.push(_people[i].attributes);
        }
        Ti.App.fireEvent('DirectoryProxySearchComplete');
    };
    
    onXhrSearchError = function (e) {
        Ti.App.fireEvent('DirectoryProxySearchError');
    };
    
    init();
    
    return self;
};