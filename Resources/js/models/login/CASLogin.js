var CASLogin = function (facade) {
    var app = facade, init, _self = this,
    loginProxy, sessionProxy, client, credentials, options, url,
    onLoginError, onLoginComplete, onInitialResponse, onInitialError;
    
    init = function () {
        //Nothing to init.
    };
    
    this.login = function (creds, opts) {
        if (!loginProxy) {
            loginProxy = app.models.loginProxy;
        }
        if (!sessionProxy) {
            sessionProxy = app.models.sessionProxy;
        }
        credentials = creds;
        options = opts;

        url = app.UPM.CAS_URL + '/login?service=' + Titanium.Network.encodeURIComponent(app.UPM.BASE_PORTAL_URL + app.UPM.PORTAL_CONTEXT + '/Login?isNativeDevice=true');

        // Send an initial response to the CAS login page
        client = Titanium.Network.createHTTPClient({
            onload: onInitialResponse,
            onerror: onInitialError
        });
        client.open('GET', url, false);
        /*
            TODO Remove this line when the guest session is returned properly (temporary hack)
        */
        client.setRequestHeader('User-Agent','Mozilla/5.0 (Linux; U; Android 2.1; en-us; Nexus One Build/ERD62) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17 –Nexus');

        client.send();
    };
    
    this.getLoginURL = function (url) {
        var separator = url.indexOf('?') >= 0 ? '&' : '?';
        return app.UPM.CAS_URL + '/login?service=' + Titanium.Network.encodeURIComponent(url + separator + 'isNativeDevice=true');
    };
    
    onLoginComplete = function (e) {
        Ti.API.debug("onLoginComplete() in CASLogin");
        // Examine the response to determine if authentication was successful.  If
        // we get back a CAS page, assume that the credentials were invalid.
        var failureRegex = new RegExp(/body id="cas"/);
        if (failureRegex.exec(client.responseText)) {
            sessionProxy.stopTimer(LoginProxy.sessionTimeContexts.NETWORK);
            Ti.App.fireEvent('EstablishNetworkSessionFailure');
        } else {
            sessionProxy.resetTimer(LoginProxy.sessionTimeContexts.NETWORK);
            if (!options || !options.isUnobtrusive) {
                Ti.App.fireEvent('EstablishNetworkSessionSuccess');
            }
        }
    };
    
    onLoginError = function (e) {
        Ti.API.error("onLoginError() in CASLogin");
        sessionProxy.stopTimer(LoginProxy.sessionTimeContexts.NETWORK);
        Ti.App.fireEvent('EstablishNetworkSessionFailure');
    };
    
    onInitialError = function (e) {
        Ti.API.error("onInitialError() in CASLogin");
        sessionProxy.stopTimer(LoginProxy.sessionTimeContexts.NETWORK);
        Ti.App.fireEvent('EstablishNetworkSessionFailure');
    };
    
    onInitialResponse = function (e) {
        Ti.API.debug("onInitialResponse() in CASLogin");
        var flowRegex, flowId, initialResponse, data;
        // Parse the returned page, looking for the Spring Webflow ID.  We'll need
        // to post this token along with our credentials.
        initialResponse = client.responseText;
        Ti.API.debug("initialResponse: " + initialResponse);
        flowRegex = new RegExp(/input type="hidden" name="lt" value="([a-z0-9]*)?"/);
        Ti.API.debug("flowRegex: " + flowRegex);
        flowId = flowRegex.exec(initialResponse)[1];
        Ti.API.debug("flowId: " + flowId);

        // Post the user credentials and other required webflow parameters to the 
        // CAS login page.  This step should accomplish authentication and redirect
        // to the portal if the user is successfully authenticated.
        client = Titanium.Network.createHTTPClient({
            onload: onLoginComplete,
            onerror: onLoginError
        });
        client.open('POST', url, true);
        /*
            TODO Remove this line when the guest session is returned properly (temporary hack)
        */
        client.setRequestHeader('User-Agent','Mozilla/5.0 (Linux; U; Android 2.1; en-us; Nexus One Build/ERD62) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17 –Nexus');
        
        data = { 
            username: credentials.username, 
            password: credentials.password, 
            lt: flowId, 
            _eventId: 'submit', 
            submit: 'LOGIN' 
        };
        client.send(data);
        Ti.API.debug("client.send() with data: " + JSON.stringify(data));
    };
};