var DirectoryProxy = function (facade,opts) {
    var app=facade, self = {}, init,
        getQualifiedURL, xhrSearchClient, doXhrSearch,
        xhrSearchOnLoad, xhrSearchOnError,
        person, people = [];

    init = function () {
        //Generate the HTTP request to be used each time a search is performed
        xhrSearchClient = Titanium.Network.createHTTPClient({
            onload: onXhrSearchLoad,
            onerror: onXhrSearchError
        });
    };
    
    self.search = function (query) {
        if (!app.models.deviceProxy.checkNetwork()) {
            return;
        }        
        else if (query === '') {
            people = [];
            Ti.App.fireEvent('DirectoryProxySearchComplete');
        }
        else {
            doXhrSearch(query);
        }
    };
    self.clear = function () {
        people = [];
        xhrSearchClient.abort();
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
        return app.UPM.directoryEmergencyContacts || false;
    };
    
    doXhrSearch = function (query) {
        var url, separator;
        Ti.API.info("query: " + query);
        url = app.UPM.DIRECTORY_SERVICE_URL;
        separator = '?';
        
        for (var i = 0; i < app.UPM.DIRECTORY_SERVICE_SEARCH_FIELDS.length; i++) {
            url += separator + 'searchTerms[]=' + app.UPM.DIRECTORY_SERVICE_SEARCH_FIELDS[i];
            separator = '&';
        }
        separator = '&';
        for (i = 0; i < app.UPM.DIRECTORY_SERVICE_SEARCH_FIELDS.length; i++) {
            url += separator + app.UPM.DIRECTORY_SERVICE_SEARCH_FIELDS[i] + '=' + query;
            separator = '&';
        }

        xhrSearchClient.open('GET', url);
        xhrSearchClient.send();
        Ti.App.fireEvent('DirectoryProxySearching');
    };
    
    onXhrSearchLoad = function (e) {
        //When the search is complete, reset the main people array
        Ti.App.fireEvent('SessionActivity', {context: app.models.loginProxy.sessionTimeContexts.NETWORK});
        people = [];
        (function() {
            try {
                var _people = JSON.parse(xhrSearchClient.responseText).people;
                for (var i=0, iLength=_people.length; i<iLength; i++) {
                    Ti.API.info('calling method');
                    people.push(_people[i].attributes);
                }
                Ti.App.fireEvent('DirectoryProxySearchComplete');
            }
            catch (err) {
                Ti.App.fireEvent('DirectoryProxySearchComplete', {error: app.localDictionary.directoryErrorFetching});
            }            
        })();
    };
    
    onXhrSearchError = function (e) {
        Ti.App.fireEvent('DirectoryProxySearchError');
    };
    
    init();
    
    return self;
};