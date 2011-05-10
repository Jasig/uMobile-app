var StartupCommand = function (facade) {
    Ti.API.debug("StartupCommand");
    var app = facade, currentTime, _lastPortlet, _lastWindow;
    
    _lastWindow = Ti.App.Properties.getString('lastWindow', 'home');
    _lastPortlet = Ti.App.Properties.getString('lastPortlet', '');
    app.models.windowManager.openWindow('home');
    //Check if an existing session is still active
    //If so, re-open the last active window.
    
    currentTime = (new Date()).getTime();
    timeDifference = currentTime - Ti.App.Properties.getInt('timer_' + LoginProxy.sessionTimeContexts.NETWORK, 0);
    if (timeDifference > app.UPM.SERVER_SESSION_TIMEOUT * 1000) {
        if (_lastWindow === 'portlet' && _lastPortlet != '') {
            _lastPortlet = JSON.parse(_lastPortlet);
            app.models.windowManager.openWindow(_lastWindow, _lastPortlet);
        }
        else {
            app.models.windowManager.openWindow(_lastWindow);
        }
    }
    else {
        alert("No session. currentTime: " + currentTime + " & timeDifference: " + timeDifference + " & timer_network: " + Ti.App.Properties.getInt('timer_Network'));
    }
};
