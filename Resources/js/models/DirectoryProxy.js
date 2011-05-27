var DirectoryProxy = function (facade,opts) {
    var app=facade, init, _self = this, Config, Login, Device, LocalDictionary,
        getQualifiedURL, xhrSearchClient, doXhrSearch,
        xhrSearchOnLoad, xhrSearchOnError,
        person, people = [];

    init = function () {
        Config = app.config;
        Login = app.models.loginProxy;
        Device = app.models.deviceProxy;
        LocalDictionary = app.localDictionary;
        
        //Generate the HTTP request to be used each time a search is performed
        xhrSearchClient = Titanium.Network.createHTTPClient({
            onload: onXhrSearchLoad,
            onerror: onXhrSearchError
        });
    };
    
    this.search = function (query) {
        if (!Device.checkNetwork()) {
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
    this.clear = function () {
        people = [];
        xhrSearchClient.abort();
    };
    
    this.getPeople = function (index) {
        //If no index is provided, return all people. Otherwise, provide one Person.
        if(!index) {
            return people;
        }
        else {
            return people[index];
        }
    };
    
    this.getEmergencyContacts = function () {
        return Config.directoryEmergencyContacts || false;
    };
    
    doXhrSearch = function (query) {
        var url, separator;
        Ti.API.info("query: " + query);
        url = Config.DIRECTORY_SERVICE_URL;
        separator = '?';
        
        for (var i = 0; i < Config.DIRECTORY_SERVICE_SEARCH_FIELDS.length; i++) {
            url += separator + 'searchTerms[]=' + Config.DIRECTORY_SERVICE_SEARCH_FIELDS[i];
            separator = '&';
        }
        separator = '&';
        for (i = 0; i < Config.DIRECTORY_SERVICE_SEARCH_FIELDS.length; i++) {
            url += separator + Config.DIRECTORY_SERVICE_SEARCH_FIELDS[i] + '=' + query;
            separator = '&';
        }

        xhrSearchClient.open('GET', url);
        xhrSearchClient.send();
        Ti.App.fireEvent('DirectoryProxySearching');
    };
    
    onXhrSearchLoad = function (e) {
        //When the search is complete, reset the main people array
        Ti.App.fireEvent('SessionActivity', {context: Login.sessionTimeContexts.NETWORK});
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
                Ti.App.fireEvent('DirectoryProxySearchComplete', {error: LocalDictionary.directoryErrorFetching});
            }            
        })();
    };
    
    onXhrSearchError = function (e) {
        Ti.App.fireEvent('DirectoryProxySearchError');
    };
    
    init();
};