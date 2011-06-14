var SessionProxy = function (facade) {
    var app = facade, _self = this, Device, Config, Login,
    timers = [], sessionLifeTimeMilli, init,
    onSessionExpire, onTimeout;
    
    /* 
    The SessionProxy acts as a sub-proxy for LoginProxy to maintain a local
    representation of session time for the mobile application session. The current
    Android implementation of Titanium maintains separate sessions for Network requests
    and WebViews, so we need to manage multiple "contexts" for Android. iPhone uses the same
    cookies between network requests and webviews in the app, so we really just need to track
    one session at a time for iPhone.
    */
    
    init = function () {
        Device = app.models.deviceProxy;
        Config = app.config;
        Login = app.models.loginProxy;
        
        //Gets the session expiration time from the config in seconds,
        //converts to milliseconds for use in the setTimeout
        sessionLifeTimeMilli = parseInt(Config.SERVER_SESSION_TIMEOUT * 1000, 10);
        Ti.App.addEventListener('SessionActivity', onSessionActivity);
    };
    
    this.resetTimer = function(context) {
        // There should only be multiple context timers if the OS is Android.
        // Because Android Appcelerator doesn't share cookies between Async requests and webview requests.
        // It also doesn't share cookies between separate webviews.
        
        Ti.API.info("Reset the timer for: " + context + " & timer= " + sessionLifeTimeMilli);
        if (!Device.isAndroid()) {
            // In iPhone we only maintain one timer since cookies are shared
            // between network requests and webviews.
            if(timers[LoginProxy.sessionTimeContexts.NETWORK].counter) {
                Ti.API.debug("counter variable defined, clearing timeout");
                clearTimeout(timers[LoginProxy.sessionTimeContexts.NETWORK].counter);
            }
            timers[LoginProxy.sessionTimeContexts.NETWORK].counter = setTimeout(function() {
                onTimeout(timers[LoginProxy.sessionTimeContexts.NETWORK]);
            }, parseInt(sessionLifeTimeMilli, 10));
            timers[LoginProxy.sessionTimeContexts.NETWORK].isActive = true;
            Ti.App.Properties.setString('timer_' + context, String(new Date().getTime()));
            
            Ti.API.debug("Network timer updated");
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
            Ti.App.Properties.setString('timer_' + context, String(new Date().getTime()));
        }
        else {
            Ti.API.debug("No timers matched the context: " + context);
        }
    };
    
    this.isActive = function (context) {
        Ti.API.debug("this.isActive() in SessionProxy, with context: " + context);
        if (Device.isIOS()) {
            //If it's iphone, we only need to check that one context has an active session.
            if(timers[Login.sessionTimeContexts.NETWORK]) {
                Ti.API.debug("in isActive() in SessionProxy, there IS a timer for the request, and is it active? " + timers[Login.sessionTimeContexts.NETWORK].isActive);
                return timers[Login.sessionTimeContexts.NETWORK].isActive;
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
    
    this.stopTimer = function (context) {
        Ti.API.info("SessionTimerModel.stop() for: " + context);
        if (timers[context]) {
            if(timers[context].counter) {
                clearTimeout(timers[context].counter);
            }
            timers[context].isActive = false;
            Ti.App.Properties.removeProperty('timer_' + context);
        }
    };
    
    this.createSessionTimer = function (context) {
        var session = {};
        if (Device.isAndroid() || (context === LoginProxy.sessionTimeContexts.NETWORK && !timers[context])) {
            session.context = context;
            session.isActive = false;
            timers[context] = session;
        }
        else {
            Ti.API.debug("The platform wasn't android, or the context wasn't network. No need for another context.");
        }
    };
    
    this.validateSessions = function () {
        // This method does two things. It checks any existing timers to see 
        // if the time since their last timestamp is greater than the global
        // session timeout, and if so, stops them.
        // secondly, it returns
        var _currentTime, _sessions = [];
        Ti.API.debug("validateSessions() in SessionProxy");
        // This compares the timestamps of all timers against the current time
        // and the UPM.SERVER_SESSION_TIMEOUT property in config.js
        
        _currentTime = new Date().getTime();

        for (var timer in timers) {
            if (timers.hasOwnProperty(timer)) {
                if (_currentTime - parseInt(Ti.App.Properties.getString('timer_' + timer, 0), 10) < sessionLifeTimeMilli) {
                    Ti.API.info("The timer " + timer + " is still active, milliseconds different: " + (_currentTime - parseInt(Ti.App.Properties.getString('timer_' + timer, 0), 10)));
                    _sessions[timer] = true;
                }
                else {
                    Ti.API.info("The timer " + timer + " is not active, stopping it. milliseconds different: " + (_currentTime - parseInt(Ti.App.Properties.getString('timer_' + timer, 0), 10)));
                    _sessions[timer] = false;
                    _self.stopTimer(timer);
                }
            }
        }
        
        if (Device.isIOS()) {
            //Because we only maintain one timer in iOS, we'll make Webview equal network
            _sessions[LoginProxy.sessionTimeContexts.WEBVIEW] = _sessions[LoginProxy.sessionTimeContexts.NETWORK];
        }
        
        return _sessions;
    };
    
    
    onTimeout = function (session) {
        Ti.API.info("SessionTimerExpired" + session.context);
        Ti.App.fireEvent("SessionTimerExpired", { context: session.context });
    };
    
    onSessionActivity = function (e) {
        Ti.API.debug("onSessionActivity() in SessionProxy");
        if (e.context) {
            Ti.API.debug("Resetting " + e.context + " session");
            _self.resetTimer(e.context);
        }
        else {
            _self.resetTimer();
        }
    };
    
    init();
};