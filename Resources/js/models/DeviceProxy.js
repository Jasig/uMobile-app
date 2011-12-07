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
 
var _orientation;
    
exports.checkNetwork = function() {
    if (!Ti.Network.online) {
        Ti.API.debug("Network is offline");
        return false;
    } else {
        return true;
    }
};

exports.isIOS = function () {
    if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
        return true;
    }
    else {
        return false;
    }
};

exports.isIPad = function () {
    return Ti.Platform.osname === 'ipad' ? true : false;
};

exports.isIPhone = function () {
    return Ti.Platform.osname === 'iphone' ? true : false;
};

exports.isAndroid = function () {
    if (Ti.Platform.osname === 'android') {
        return true;
    }
    else {
        return false;
    }
};

exports.isBlackBerry = function () {
    return false;
};

exports.retrieveWidth = function (dip) {
    var _screenWidth = Ti.Platform.displayCaps.platformWidth;
    
    if (dip && exports.isAndroid()) {
        var _dipFactor;
        switch (Ti.Platform.displayCaps.density) {
            case 'high':
                _dipFactor = 1.5;
                break;
            case 'normal':
                _dipFactor = 1;
                break;
            case 'low':
                _dipFactor = 0.75;
                break;
            default:
                _dipFactor = 1;
        }
        _screenWidth = _screenWidth / _dipFactor;
    }
    return _screenWidth;
};

exports.retrieveHeight = function (dip) {
    var _screenHeight = Ti.Platform.displayCaps.platformHeight;
    
    if (dip && exports.isAndroid()) {
        var _dipFactor;
        switch (Ti.Platform.displayCaps.density) {
            case 'high':
                _dipFactor = 1.5;
                break;
            case 'normal':
                _dipFactor = 1;
                break;
            case 'low':
                _dipFactor = 0.75;
                break;
            default:
                _dipFactor = 1;
        }
        _screenHeight = _screenHeight / _dipFactor;
    }
    return _screenHeight;
};

exports.saveCurrentOrientation = function (orientation) {
    _orientation = orientation;
};

exports.retrieveCurrentOrientation = function () {
    return _orientation || false;
};