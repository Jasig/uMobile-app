/*
 * Licensed to Jasig under one or more contributor license
 * agreements. See the NOTICE file distributed with this work
 * for additional information regarding copyright ownership.
 * Jasig licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a
 * copy of the License at:
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var SessionProxy = function (facade) {
    var app = facade, _self = this, Device, Config, Login,
    timers = [], sessionLifeTimeMilli, init,
    onSessionExpire, onTimeout;
    
    /* 
    The SessionProxy acts as a sub-proxy for app.models.loginProxy to maintain a local
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
        Ti.App.addEventListener(app.events['SESSION_ACTIVITY'], onSessionActivity);
    };
    
    this.resetTimer = function(context) {
        // There should only be multiple context timers if the OS is Android.
        // Because Android Appcelerator doesn't share cookies between Async requests and webview requests.
        // It also doesn't share cookies between separate webviews.
        
        Ti.API.info("Reset the timer for: " + context + " & timer= " + sessionLifeTimeMilli);
        if (!Device.isAndroid()) {
            // In iPhone we only maintain one timer since cookies are shared
            // between network requests and webviews.
            if(timers[app.models.loginProxy.sessionTimeContexts.NETWORK].counter) {
                Ti.API.debug("counter variable defined, clearing timeout");
                try {
                    clearTimeout(timers[app.models.loginProxy.sessionTimeContexts.NETWORK].counter);
                }
                catch (e) {
                    Ti.API.error("Couldn't clear timer in SessionProxy");
                }
            }
            timers[app.models.loginProxy.sessionTimeContexts.NETWORK].counter = setTimeout(function() {
                onTimeout(timers[app.models.loginProxy.sessionTimeContexts.NETWORK]);
            }, parseInt(sessionLifeTimeMilli, 10));
            timers[app.models.loginProxy.sessionTimeContexts.NETWORK].isActive = true;
            Ti.App.Properties.setString('timer_' + context, String(new Date().getTime()));
            
            Ti.API.debug("Network timer updated");
        }
        else if (timers[context]) {
            if(timers[context].counter) {
                Ti.API.debug("counter variable defined, clearing timeout");
                try {
                    clearTimeout(timers[context].counter);
                }
                catch (e) {
                    Ti.API.error("Couldn't clear timeout in SessionProxy");
                }
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
        if (Device.isIOS()) {
            //If it's iphone, we only need to check that one context has an active session.
            if(timers[app.models.loginProxy.sessionTimeContexts.NETWORK]) {
                return timers[app.models.loginProxy.sessionTimeContexts.NETWORK].isActive;
            }
            else {
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
        if (Device.isAndroid() || (context === app.models.loginProxy.sessionTimeContexts.NETWORK && !timers[context])) {
            session.context = context;
            session.isActive = false;
            timers[context] = session;
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
            Ti.API.info("Device.isIOS() in validateSessions()");
            //Because we only maintain one timer in iOS, we'll make Webview equal network
            _sessions[app.models.loginProxy.sessionTimeContexts.WEBVIEW] = _sessions[app.models.loginProxy.sessionTimeContexts.NETWORK];
        }
        
        return _sessions;
    };
    
    
    onTimeout = function (session) {
        Ti.API.info("SessionTimerExpired" + session.context);
        Ti.App.fireEvent(SessionProxy.events['TIMER_EXPIRED'], { context: session.context });
    };
    
    onSessionActivity = function (e) {
        //This event fires anytime a request to the portal occurs, which automatically extends the session.
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

SessionProxy.events = {
    TIMER_EXPIRED   : "SessionTimerExpired"
};