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

var timer = {}, sessionLifeTimeMilli, 
app = require('/js/Constants');

/* 
The SessionProxy acts as a sub-proxy for the LoginProxy to maintain a local
representation of session time for the mobile application session. The current
Android implementation of Titanium maintains separate sessions for Network requests
and WebViews, so we need to manage multiple "contexts" for Android. iPhone uses the same
cookies between network requests and webviews in the app, so we really just need to track
one session at a time for iPhone.
*/
exports.events = {
    TIMER_EXPIRED   : "SessionTimerExpired"
};


//Gets the session expiration time from the config in seconds,
//converts to milliseconds for use in the setTimeout
sessionLifeTimeMilli = Ti.App.Properties.getInt('SERVER_SESSION_TIMEOUT');
Ti.App.addEventListener(app.events['SESSION_ACTIVITY'], onSessionActivity);

exports.resetTimer = function() {    
    if(timer.counter) {
        try {
            clearTimeout(timer.counter);
        }
        catch (e) {
            Ti.API.error("Couldn't clear timer in SessionProxy");
        }
    }
    timer.counter = setTimeout(function() {
        onTimeout(timer);
    }, sessionLifeTimeMilli);
    timer.isActive = true;
    Ti.App.Properties.setString('sessionTimer', String(new Date().getTime()));
};

exports.isActive = function () {
    //If it's iphone, we only need to check that one context has an active session.
    if(timer) {
        return timer.isActive;
    }
    else {
        return false;
    }
};

exports.stopTimer = function () {
    if (timer) {
        if(timer.counter) {
            clearTimeout(timer.counter);
        }
        timer.isActive = false;
        Ti.App.Properties.removeProperty('sessionTimer');
    }
};

exports.createSessionTimer = function () {
    var session = {};
    session.isActive = false;
    timer = session;
};


function onTimeout () {
    Ti.App.fireEvent(exports.events['TIMER_EXPIRED']);
};

function onSessionActivity (e) {
    //This event fires anytime a request to the portal occurs, which automatically extends the session.
    exports.resetTimer();
};