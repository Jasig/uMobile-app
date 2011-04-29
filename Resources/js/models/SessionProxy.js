

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
        //There should only be multiple context timers if the OS is Android.
        
        Ti.API.info("Reset the timer for: " + context + " & timer= " + sessionLifeTimeMilli);
        Ti.API.debug("Currently " + timers.length + " timers running.");
        if (Ti.Platform.osname !== 'android') {
            if(timers[LoginProxy.sessionTimeContexts.NETWORK].counter) {
                Ti.API.debug("counter variable defined, clearing timeout");
                clearTimeout(timers[LoginProxy.sessionTimeContexts.NETWORK].counter);
            }
            timers[LoginProxy.sessionTimeContexts.NETWORK].counter = setTimeout(function() {
                onTimeout(timers[LoginProxy.sessionTimeContexts.NETWORK]);
            }, parseInt(sessionLifeTimeMilli, 10));
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
        }
        else {
            Ti.API.debug("Not timers matched the context: " + context);
        }
    };
    
    self.isActive = function (context) {
        Ti.API.debug("self.isActive() in SessionProxy, with context: " + context);
        if (timers[context]) {
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
    
    onSessionActivity = function (e) {
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