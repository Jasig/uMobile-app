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
 
/* 
* [jcross]: This is an experimental base prototype for window controllers. Currently not implemented.
* @Interface
*/
var WindowControllerBase = function () {
    var _app, _window, _key, _state, _states, _self = this;

    this._init = function () {
        _states = {
            INITIALIZED : "Initialized",
            OPENED      : "Opened", 
            CLOSED      : "Closed"
        };
        
    };
    
    this.open = function(){
        if (_window) {
            _window.open();
        }
    };
    
    this.close = function () {
        if (_window) {
            _window.close();
        }
        else {
            Ti.API.error("No _window exists in " + (_key || 'noKey'));
        }
    };
    
    this.setWindow = function (options) {
        _window = Titanium.UI.createWindow(options || {});
    };
    
    this.getWindow = function () {
        return _window;
    };
        
    this.getApp = function () {
        return _app || false;
    };
    
    this.setKey = function (key) {
        if (typeof key === "string") {
            _key = key;
            return key;
        }
        else {
            Ti.API.error("Key was not a string: " + key);
        }
        return false;
    };
    
    this.getKey = function () {
        return _key || false;
    };
    
    this.setState = function (stateKey) {
        if (_states[stateKey]) {
            _state = _states[stateKey];
            return _state;
        }
        else {
            Ti.API.error("No state exists for " + stateKey);
        }
        return false;
    };
    
    this.getState = function () {
        return _state || false;
    };
};