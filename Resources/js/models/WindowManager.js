var WindowManager = function (facade) {
    var app=facade, init, hidePreviousWindow, self = {}, applicationWindows = [], activityStack = [], saveLastWindow,
        onAndroidBack, onShowWindow, onShowPortlet, ensureOpenTimer;

    init = function () {
        Ti.App.addEventListener('showWindow', onShowWindow);
        Ti.App.addEventListener('showPortlet', onShowPortlet);
    };
    
    self.addWindow = function (windowParams) {
        if (windowParams && windowParams.key) {
            applicationWindows[windowParams.key] = windowParams;
        }
        else {
            Ti.API.error("Incomplete windowParams were passed in to addWindow() in WindowManager" + JSON.stringify(windowParams));
        }
    };
    
    self.openWindow = function (windowKey, portlet) {
        Ti.API.debug("openWindow() in WindowManager, key: " + windowKey);
        var callback, 
            homeKey = app.controllers.portalWindowController.key,
            portletKey = app.controllers.portletWindowController.key;
        
        if (applicationWindows[windowKey]) {
            //Make sure the requested window exists, and that it isn't the current window.
            Ti.App.fireEvent('OpeningNewWindow', {key: windowKey, portlet: portlet ? portlet : false});
            
            if (activityStack.length > 0) {
                Ti.API.debug("Passes condition: activityStack.length > 0");
                applicationWindows[self.getCurrentWindow()].close();
            }
            applicationWindows[windowKey].open(portlet ? portlet : null );
            
            activityStack.push(windowKey);
            Ti.App.Properties.setString('lastWindow', windowKey);
            if (portlet) {
                Ti.API.debug("Passes condition: portlet");
                Ti.API.debug("Adding portlet to lastPortlet: " + JSON.stringify(portlet));
                Ti.App.Properties.setString('lastPortlet', JSON.stringify(portlet));
            }
            Ti.App.fireEvent('NewWindowOpened', {key: windowKey});
        }
        else {
            Ti.API.error("Error opening window.");
            Ti.API.error(" applicationWindows[windowKey]" + applicationWindows[windowKey]);
            Ti.API.error("windowKey= " + windowKey + " & self.getCurrentWindow() = " + self.getCurrentWindow());
        }
    };
    
    self.goBack = function () {
        //Show the previous window, and add it to the top of the activity stack.
        if (activityStack.length >= 2) {
            self.openWindow(activityStack[activityStack.length - 2]);
        }
    };
    
    self.getCurrentWindow = function (offset) {
        return activityStack.length > 0 ? activityStack[activityStack.length - 1] : false;
    };
    
    self.getPreviousWindow = function () {
        return activityStack.length > 1 ? activityStack[activityStack.length - 2] : false;
    };
    
    self.getCurrentPortlet = function () {
        // var _currentPortlet = (activityStack.length > 0 && activityStack[activityStack.length -1].portlet) ? activityStack[activityStack.length - 1].portlet : false;
        var _currentPortlet = activityStack[activityStack.length -1].portlet;
        Ti.API.info("getCurrentPortlet() in WindowManager: " + JSON.stringify(_currentPortlet));
        return _currentPortlet;
    };
    
    self.openPreviousSessionWindow = function () {
        // If a session exists, open the previous window. If not, establish a session and then open previous (or home(default))
        // If the last window was a portlet, get the last portlet and parse/pass it as a parameter.
        // Otherwise, just open the last window
        
        /*var _lastWindow, _lastPortlet;
        _lastWindow = Ti.App.Properties.getString('lastWindow', app.controllers.portalWindowController.key);
        if (Ti.App.Properties.hasProperty('lastPortlet')) {
            _lastPortlet = Ti.App.Properties.getString('lastPortlet');
        }
        
        Ti.API.debug("_lastWindow= " + _lastWindow + " & _lastPortlet=" + _lastPortlet);
        
        if (app.models.sessionProxy.validateSessions()[LoginProxy.sessionTimeContexts.NETWORK]) {
            if (_lastWindow === app.controllers.portletWindowController.key && _lastPortlet) {
                Ti.App.debug("_lastWindow is portlet, and the _lastPortlet property was defined.");
                app.models.windowManager.openWindow(_lastWindow, JSON.parse(_lastPortlet));
            }
            else {
                Ti.API.debug("_lastWindow is not portlet, or the _lastPortlet property was not defined.");
                //We don't want to try opening the portlet window if it was the last window,
                //because we don't have a portlet to pass it. So just open the home window.
                app.models.windowManager.openWindow(_lastWindow === app.controllers.portletWindowController.key ? app.controllers.portalWindowController.key : _lastWindow);
            }
        }
        else {
            app.models.loginProxy.establishNetworkSession();
            self.openWindow(app.controllers.portalWindowController.key);
        }*/
        
        //Let's forego this feature in version 1.0, too many cross-platform issues when trying to go-live.
        self.openWindow(app.controllers.portalWindowController);
    };
    
    hidePreviousWindow = function (options) {
        // This will hide the previous window, presuming that the previous window
        // exists, and that it isn't the home screen.
        if (activityStack.length > 0 && self.getCurrentWindow() !== app.controllers.portalWindowController.key) {
            //If there IS a previous window, and the current window isn't home.
            Ti.API.debug("Hiding previous window: " + activityStack[activityStack.length - 1]);
            applicationWindows[activityStack[activityStack.length - 1]].close(options);
        }
    };
    
    //Event Handlers
    onAndroidBack = function (e) {
        self.goBack();
    };
    
    onShowWindow = function (e) {
        Ti.API.debug("showWindow Event. New: " + e.newWindow + ", Old: " + e.oldWindow);
        self.openWindow(e.newWindow);
    };
    
    onShowPortlet = function (portlet) {
        Ti.API.info("Showing portlet window " + portlet.title);
        self.openWindow(app.controllers.portletWindowController.key, portlet);
    };
    
    init();
    
    return self;
};