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
var _intents = {}, app = require('/js/Constants');
exports.register = function (intent, windowKey, portlet) {
    _intents[intent] = { window: windowKey };
    if (portlet) _intents[intent].portlet = portlet;
};

exports.broadcast = function (intent, payload) {
    if (!_intents[intent]) return false;
    windowData = { newWindow: _intents[intent].window, parameters: payload };
    if (_intents[intent].portlet) windowData.portlet = _intents[intent].portlet;
    return Ti.App.fireEvent(app.events[_intents[intent].portlet ? 'SHOW_PORTLET' : 'SHOW_WINDOW'], windowData);
};