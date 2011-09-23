var Shibboleth2Login = function (facade) {
    var _self = this;
    
    this._app = facade;
    this._credentials;
    this._client;
    this._loginURL = _self._app.config.SHIB_URL;
    
    this.login = function (credentials, options) {
        Ti.API.debug("login() in Shibboleth2Login");
        
        _self._credentials = credentials;
        
        // First step is to load the HTML form, so we can scrape it
        // and submit login info
        _self.client = Ti.Network.createHTTPClient({
            onload  : _self._onInitialResponse,
            onerror : _self._onInitialError
        });
        _self.client.open('GET', _loginURL);
        _self.client.send();
    };
    
    this.logout = function () {
        
    };
    
    this.getLoginURL = function (url) {
        
    };
    
    this._onInitialResponse = function () {
        Ti.API.debug("_onInitialResponse() In Shibboleth2Login");
        
        
        
    };
    
    this._onInitialError = function () {
        
    };
    
    this._onLoginComplete = function () {
        
    };
    
    this._onLoginError = function () {
        
    };
    
    this._processResponse = function (responseText) {
        
    };
};