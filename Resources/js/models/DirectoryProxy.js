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
        xhrSearch.open('GET',app.UPM.DIRECTORY_SERVICE_URL + query);
        xhrSearch.send();
        Ti.API.info('Query: ' + app.UPM.DIRECTORY_SERVICE_URL);
        Ti.App.fireEvent('DirectoryProxySearching');
    };
    self.clear = function () {
        people = [];
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
        return app.UPM.directoryContacts;
    };
    
    onXhrSearchLoad = function (e) {
        //When the search is complete, reset the main people array
        people = [];
        var _people = JSON.parse(xhrSearch.responseText).people;
        for (var i=0, iLength=_people.length; i<iLength; i++) {
            var _person = new app.models.DirectoryPersonVO(_people[i].name,_people[i].attributes);
            people.push(_person);
        }
        Ti.App.fireEvent('DirectoryProxySearchComplete');
    };
    
    onXhrSearchError = function (e) {
        Ti.App.fireEvent('DirectoryProxySearchError');
    };
    

    
    init();
    
    return self;
};