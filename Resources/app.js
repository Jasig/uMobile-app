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

var app = require('/js/Constants'),
deviceProxy = require('/js/models/DeviceProxy'),
loginProxy = require('/js/models/LoginProxy'),
windowManager = require('/js/models/WindowManager'),
appMessages = require('/js/models/AppMessageManager'),
config = require('/js/config');

Ti.Database.install('umobile.sqlite','umobile');

appMessages.register('location', 'map');
appMessages.register('person', 'directory');

Ti.App.fireEvent(app.events['SHOW_WINDOW'], { newWindow : config.HOME_KEY });
if (!deviceProxy.checkNetwork()) {
    Ti.App.fireEvent(app.events['NETWORK_ERROR']);
}
else {
    Ti.App.fireEvent(app.loginEvents['ESTABLISH_NETWORK_SESSION']);
}

Ti.App.addEventListener(app.events['OPEN_EXTERNAL_URL'], function (e) {
	if (e.url) return Ti.Platform.openURL(e.url);
    Ti.API.error("No url was attached to the event: " + JSON.stringify(e));
});

function onOrientationChange (e) {
    if (deviceProxy.retrieveCurrentOrientation() && deviceProxy.retrieveCurrentOrientation() === e.orientation) return;
    deviceProxy.saveCurrentOrientation(e.orientation);
    windowManager.rotateWindow(e.orientation);
}

Ti.Gesture.addEventListener('orientationchange', onOrientationChange);