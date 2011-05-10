

var SessionProxy = function (facade) {
    var app = facade, self = {}, timers = [], sessionLifeTimeMilli, init, onSessionActivity, onSessionExpire, onTimeout;
    
    /* 
    The SessionProxy acts as a sub-proxy for LoginProxy to maintain a local
    representation of session time for the mobile application session. The current
    Android implementation of Titanium maintains separate sessions for Network requests
    and WebViews, so we need to manage multiple "contexts" for Android. iPhone uses the same
    cookies between network requests and webviews in the app, so we really just need to track
    one session at a time for iPhone.
    */
    
    init = function () {
        //Gets the session expiration time from the config in seconds,
        //converts to milliseconds for use in the setTimeout
        sessionLifeTimeMilli = app.UPM.SERVER_SESSION_TIMEOUT * 1000;
        Ti.App.addEventListener('SessionActivity', onSessionActivity);
    };
    
    onTimeout = function (session) {
        Ti.API.info("SessionTimerExpired" + session.context);
        Ti.App.fireEvent("SessionTimerExpired", {context: session.context});
    };
    
    self.resetTimer = function(context) {
        // There should only be multiple context timers if the OS is Android.
        // Because Android Appcelerator doesn't share cookies between Async requests and webview requests.
        // It also doesn't share cookies between separate webviews.
        
        Ti.API.info("Reset the timer for: " + context + " & timer= " + sessionLifeTimeMilli);
        if (Ti.Platform.osname !== 'android') {
            if(timers[LoginProxy.sessionTimeContexts.NETWORK].counter) {
                Ti.API.debug("counter variable defined, clearing timeout");
                clearTimeout(timers[LoginProxy.sessionTimeContexts.NETWORK].counter);
            }
            timers[LoginProxy.sessionTimeContexts.NETWORK].counter = setTimeout(function() {
                onTimeout(timers[LoginProxy.sessionTimeContexts.NETWORK]);
            }, parseInt(sessionLifeTimeMilli, 10));
            timers[LoginProxy.sessionTimeContexts.NETWORK].isActive = true;
            Ti.App.Properties.setInt('timer_' + context, (new Date()).getTime());
            
            Ti.API.info("Network timer updated at ");
        }
        else if (timers[context]) {
            if(timers[context].counter) {
                Ti.API.debug("counter variable defined, clearing timeout");
                clearTimeout(timers[context].counter);
            }
            
            timers[context].counter = setTimeout(function() {
                onTimeout(timers[context]);
            }, parseInt(sessionLifeTimeMilli, 10));
            
            timers[context].isActive = true;
            Ti.App.Properties.setInt('timer_' + context, (new Date()).getTime());
        }
        else {
            Ti.API.debug("No timers matched the context: " + context);
        }
    };
    
    self.isActive = function (context) {
        Ti.API.debug("self.isActive() in SessionProxy, with context: " + context);
        if (Ti.Platform.osname === 'iphone') {
            //If it's iphone, we only need to check that one context has an active session.
            if(timers[app.models.loginProxy.sessionTimeContexts.NETWORK]) {
                Ti.API.debug("in isActive() in SessionProxy, there IS a timer for the request, and is it active? " + timers[app.models.loginProxy.sessionTimeContexts.NETWORK].isActive);
                return timers[app.models.loginProxy.sessionTimeContexts.NETWORK].isActive;
            }
            else {
                Ti.API.debug("in isActive() in SessionProxy, there's no timer for the request.");
                return false;
            }
        }
        else if (timers[context]) {
            //Not iPhone, so we need to check the specific context.
            return timers[context].isActive;
        }
        else {
            return false;
        }
    };
    
    self.stopTimer = function (context) {
        Ti.API.info("SessionTimerModel.stop() for: " + context);
        if (timers[context]) {
            if(timers[context].counter) {
                clearTimeout(timers[context].counter);
            }
            timers[context].isActive = false;
            Ti.App.Properties.removeProperty('timer_' + context);
        }
    };
    
    self.createSessionTimer = function (context) {
        var session = {};
        if (Ti.Platform.osname === 'android' || (context === LoginProxy.sessionTimeContexts.NETWORK && !timers[context])) {
            session.context = context;
            session.isActive = false;
            timers[context] = session;
        }
        else {
            Ti.API.debug("The platform wasn't android, or the context wasn't network. No need for another context.");
        }
    };
    
    self.validateSessions = function () {
        // This method does two things. It checks any existing timers to see 
        // if the time since their last timestamp is greater than the global
        // session timeout, and if so, stops them.
        // secondly, it returns
        var _currentTime, _sessions = [];
        Ti.API.debug("validateSessions() in SessionProxy");
        // This compares the timestamps of all timers against the current time
        // and the UPM.SERVER_SESSION_TIMEOUT property in config.js
        
        _currentTime = (new Date()).getTime();
        
        for (var timer in timers) {
            if (timers.hasOwnProperty(timer)) {
                if (_currentTime - Ti.App.Properties.getInt('timer_' + timer) < app.UPM.SERVER_SESSION_TIMEOUT * 1000) {
                    Ti.API.info("The timer " + timer + " is still active, milliseconds different: " + (_currentTime - Ti.App.Properties.getInt('timer_' + timer)));
                    _sessions[timer] = true;
                }
                else {
                    Ti.API.info("The timer " + timer + " is not active, stopping it. milliseconds different: " + (_currentTime - Ti.App.Properties.getInt('timer_' + timer)));
                    _sessions[timer] = false;
                    self.stopTimer(timer);
                }
            }
        }
        
        return _sessions;
    };
    
    onSessionActivity = function (e) {
        Ti.API.debug("onSessionActivity() in SessionProxy");
        if (e.context) {
            Ti.API.debug("Resetting " + e.context + " session");
            self.resetTimer(e.context);
        }
        else {
            self.resetTimer();
        }
    };
    
    init();
    
    return self;
};