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
var deviceProxy = require('/js/models/DeviceProxy'),
styles = require('/js/style');
exports.createSearchBar = function (opts) {
    var searchBar, searchBarObject = {}, searchBarInput;
    
    if (deviceProxy.isIOS()) {
        searchBar = Titanium.UI.createSearchBar(styles.searchBar);
        searchBarObject.container = searchBar;
        searchBarObject.input = searchBar;
    }
    else {
        searchBar = Titanium.UI.createView(styles.searchBar);
        searchBarInput = Titanium.UI.createTextField(styles.searchBarInput);
        searchBar.add(searchBarInput);
        searchBarObject.container = searchBar;
        searchBarObject.input = searchBarInput;
    }
    
    searchBarObject.hide = searchBarObject.container.hide;
    searchBarObject.show = searchBarObject.container.show;
    
    if (!opts) {
        opts = {};
    }
    
    if (opts.cancel) {
        searchBarObject.input.addEventListener('cancel', opts.cancel);
    }
    if (opts.submit) {
        searchBarObject.input.addEventListener('return', opts.submit);
    }
    if (opts.change) {
        searchBarObject.input.addEventListener('change', opts.change);
    }
    
    searchBarObject.hide = function () {
        //In Android, it didn't respect searchBarObject.hide = searchBar.hide;
        searchBar.hide();
    };
    searchBarObject.show = function () {
        searchBar.show();
    };
    
    return searchBarObject;
};