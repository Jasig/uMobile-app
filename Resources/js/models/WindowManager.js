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
        var callback, 
            homeKey = app.controllers.portalWindowController.key,
            portletKey = app.controllers.portletWindowController.key;
        
        if (applicationWindows[windowKey] && windowKey !== self.getCurrentWindow()) {
            if (activityStack.length > 0) {
                applicationWindows[self.getCurrentWindow()].close();
            }
            applicationWindows[windowKey].open(portlet ? portlet : null );
            
            activityStack.push(windowKey);
            Ti.App.Properties.setString('lastWindow', windowKey);
            if (portlet) {
                Ti.App.Properties.setString('lastPortlet', JSON.stringify(portlet));
            }
            Ti.App.fireEvent('NewWindowOpened', {key: windowKey});
        }
        
    };
    
    self.goBack = function () {
        //Show the previous window, and add it to the top of the activity stack.
        if (activityStack.length >= 2) {
            self.openWindow(activityStack[activityStack.length - 2]);
        }
    };
    
    self.getCurrentWindow = function () {
        return activityStack.length > 0 ? activityStack[activityStack.length - 1] : false;
    };
    
    self.getCurrentPortlet = function () {
        // var _currentPortlet = (activityStack.length > 0 && activityStack[activityStack.length -1].portlet) ? activityStack[activityStack.length - 1].portlet : false;
        var _currentPortlet = activityStack[activityStack.length -1].portlet;
        Ti.API.info("getCurrentPortlet() in WindowManager: " + JSON.stringify(_currentPortlet));
        return _currentPortlet;
    };
    
    self.getPreviousSessionWindow = function () {
        var db, resultSet, lastWindow = false;
        db = Titanium.Database.open('umobile');
        resultSet = db.execute("SELECT value FROM prefs WHERE name='lastwindow' LIMIT 1");
        while (resultSet.isValidRow()) {
            lastWindow = resultSet.fieldByName('value');
        }
        db.close();
        return lastWindow;
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
        self.openWindow('portlet', portlet);
    };
    
    init();
    
    return self;
};