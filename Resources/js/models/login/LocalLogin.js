var LocalLogin = function (facade) {
    var app = facade, init, _self = this,
    loginProxy, sessionProxy, client, url, credentials, onLoginComplete, onLoginError;
    
    init = function () {
        //Nothing to init.
    };
    
    this.login = function (creds, options) {
        Ti.API.debug("login() in LocalLogin");
        if (!loginProxy) {
            loginProxy = app.models.loginProxy;
        }
        if (!sessionProxy) {
            sessionProxy = app.models.sessionProxy;
        }
        if (!userProxy) {
            userProxy = app.models.userProxy;
        }
        credentials = creds;
        url = app.UPM.BASE_PORTAL_URL + app.UPM.PORTAL_CONTEXT + '/Login?userName=' + credentials.username + '&password=' + credentials.password + '&isNativeDevice=true';

        client = Titanium.Network.createHTTPClient({
            onload: onLoginComplete,
            onerror: onLoginError
        });
        
        client.open('GET', url, true);
        /*
            TODO Remove this line when the guest session is returned properly (temporary hack)
        */
        client.setRequestHeader('User-Agent','Mozilla/5.0 (Linux; U; Android 2.1; en-us; Nexus One Build/ERD62) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17 –Nexus');

        client.send();
    };
    
    this.getLoginURL = function (url) {
        // This method returns a URL suitable to automatically login a user in a webview.
        credentials = userProxy.getCredentials();
        return app.UPM.BASE_PORTAL_URL + app.UPM.PORTAL_CONTEXT + '/Login?userName=' + credentials.username + '&password=' + credentials.password + '&isNativeDevice=true&refUrl=' + Ti.Network.encodeURIComponent(url);
    };
    
    onLoginComplete = function (e) {
        Ti.API.debug("onLoginComplete() in LocalLogin");
        var _layoutUser;

        _layoutUser = loginProxy.getLayoutUser(client);
        
        if (_layoutUser === credentials.username) {
            Ti.API.info("_layoutUser matches credentials.username");
            Ti.API.info("loginProxy.sessionTimeContexts.NETWORK: " + LoginProxy.sessionTimeContexts.NETWORK);
            sessionProxy.resetTimer(LoginProxy.sessionTimeContexts.NETWORK);
            // if (!options || !options.isUnobtrusive) {
                Ti.App.fireEvent('EstablishNetworkSessionSuccess', {user: _layoutUser});
            // }
        }
        else {
            Ti.API.error("Network session failed");
            Ti.App.fireEvent('EstablishNetworkSessionFailure', {user: _layoutUser});
        }
    };
    
    onLoginError = function (e) {
        sessionProxy.stopTimer(loginProxy.sessionTimeContexts.NETWORK);
        Ti.App.fireEvent('EstablishNetworkSessionFailure');
    };
};