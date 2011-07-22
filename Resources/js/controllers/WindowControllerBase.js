/* 
* @Interface
*/
var WindowControllerBase = function () {
    var _app, _window, _key, _state, _states, _self = this;

    this._init = function () {
        _states = {
            INITIALIZED : "Initialized",
            OPENED      : "Opened", 
            CLOSED      : "Closed"
        };
        
    };
    
    this.open = function(){
        if (_window) {
            _window.open();
        }
    };
    
    this.close = function () {
        if (_window) {
            _window.close();
        }
        else {
            Ti.API.error("No _window exists in " + (_key || 'noKey'));
        }
    };
    
    this.setWindow = function (options) {
        _window = Titanium.UI.createWindow(options || {});
    };
    
    this.getWindow = function () {
        return _window;
    };
    
    this.setApp = function (a) {
        if (typeof a === "ApplicationFacade") {
            _app = a;
            _self.Styles = _app.styles;
            _self.Device = _app.models.deviceProxy;
            _self.Portal = _app.models.portalProxy;
            _self.PortalWindow = _app.controllers.portalWindowController;
            _self.User = _app.models.userProxy;
            _self.Windows = _app.models.windowManager;
            return _self;
        }
        else {
            Ti.API.error("The provided app isn't the proper type: " + typeof a);
        }
        return false;
    };
    
    this.getApp = function () {
        return _app || false;
    };
    
    this.setKey = function (key) {
        if (typeof key === "string") {
            _key = key;
            return key;
        }
        else {
            Ti.API.error("Key was not a string: " + key);
        }
        return false;
    };
    
    this.getKey = function () {
        return _key || false;
    };
    
    this.setState = function (stateKey) {
        if (_states[stateKey]) {
            _state = _states[stateKey];
            return _state;
        }
        else {
            Ti.API.error("No state exists for " + stateKey);
        }
        return false;
    };
    
    this.getState = function () {
        return _state || false;
    };
};