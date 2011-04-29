var WindowManager = function (facade) {
    var app=facade, init, self = {}, applicationWindows = [], activityStack = [],
        onAndroidBack, onShowWindow, onShowPortlet;

    init = function () {
        Ti.App.addEventListener('showWindow', onShowWindow);
        Ti.App.addEventListener('showPortlet', onShowPortlet);
    };
    
    self.addWindow = function (windowParams) {
        applicationWindows[windowParams.key] = Titanium.UI.createWindow(windowParams);
        applicationWindows[windowParams.key].addEventListener('android:back', onAndroidBack);
    };
    
    self.openWindow = function (windowKey) {
        if (applicationWindows[windowKey]) {
            app.views.GlobalActivityIndicator.hide();
            if(activityStack.length == 0 || applicationWindows[activityStack[(activityStack.length - 1)]] != applicationWindows[windowKey]) {
                if (applicationWindows[windowKey].initialized) {
                    Ti.API.debug("new window is initialized");
                    applicationWindows[windowKey].show();
                }     
                else {
                    Ti.API.debug("new window is NOT initialized");
                    applicationWindows[windowKey].open();
                }
                if (activityStack.length != 0) {
                    applicationWindows[activityStack[activityStack.length - 1]].hide();
                }
            }
            else {
                Ti.API.debug("You're trying to navigate to the same window you're already in.");
            }
            
            //We want the activity stack to know that this was the most recent window.
            activityStack.push(windowKey);
        }
        else {
            Ti.API.API.error('No window exists for that key');
        }
    };
    
    self.goBack = function () {
        //Show the previous window, and add it to the top of the activity stack.
        if (activityStack.length >= 2) {
            self.openWindow(activityStack[activityStack.length - 2]);
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
        if (applicationWindows.portlet.initialized) {
            Titanium.App.fireEvent('includePortlet', portlet);
            self.openWindow('portlet');
        } 

        else {
            applicationWindows.portlet.addEventListener('open', function(e) {
                Titanium.App.fireEvent('includePortlet', portlet);
            });
            self.openWindow('portlet');
        }
    };
    
    init();
    
    return self;
};