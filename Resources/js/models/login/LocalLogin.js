var LocalLogin = function (facade) {
    var app = facade, init, _self = this,
    Config, Login, Session, User, client, url, credentials, onLoginComplete, onLoginError;
    
    init = function () {
        Config = app.config;
    };
    
    this.login = function (creds, options) {
        Ti.API.debug("login() in LocalLogin");
        if (!Login) {
            Login = app.models.loginProxy;
        }
        if (!Session) {
            Session = app.models.sessionProxy;
        }
        if (!User) {
            User = app.models.userProxy;
        }
        credentials = creds;
        url = Config.BASE_PORTAL_URL + Config.PORTAL_CONTEXT + '/Login?userName=' + credentials.username + '&password=' + credentials.password + '&refUrl=/uPortal/layout.json';

        client = Titanium.Network.createHTTPClient({
            onload: onLoginComplete,
            onerror: onLoginError
        });
        
        client.open('GET', url, true);

        client.send();
    };
    
    this.getLoginURL = function (url) {
        // This method returns a URL suitable to automatically login a user in a webview.
        if (!User) {
            User = app.models.userProxy;
        }
        credentials = User.getCredentials();
        return Config.BASE_PORTAL_URL + Config.PORTAL_CONTEXT + '/Login?userName=' + credentials.username + '&password=' + credentials.password + '&refUrl=' + Ti.Network.encodeURIComponent(url);
    };
    
    onLoginComplete = function (e) {
        Ti.API.debug("onLoginComplete() in LocalLogin");
        var _layoutUser;

        _layoutUser = Login.getLayoutUser(client);
        
        if (_layoutUser === credentials.username) {
            Ti.API.info("_layoutUser matches credentials.username");
            Ti.API.info("Login.sessionTimeContexts.NETWORK: " + LoginProxy.sessionTimeContexts.NETWORK);
            Session.resetTimer(LoginProxy.sessionTimeContexts.NETWORK);
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
        Session.stopTimer(LoginProxy.sessionTimeContexts.NETWORK);
        Ti.App.fireEvent('EstablishNetworkSessionFailure');
    };
    
    init();
};