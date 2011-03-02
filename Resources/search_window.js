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

/**
 * portal_window.js contains setup information for the
 * search tab.
 */

// library includes
Titanium.include('lib.js');


var win, searchWebView, createSearchView;

win = Titanium.UI.currentWindow;

createSearchView = function () {
    if (searchWebView) {
        win.remove(searchWebView);
    }
    searchWebView = Titanium.UI.createWebView({ 
        url: UPM.getSearchPortletUrl() 
    });
    win.add(searchWebView);
};

// initialize the search view
createSearchView();

// when user credentials are authenticated, replace the
// existing web view with one referencing the new login URL
Ti.App.addEventListener('credentialUpdate', function (input) {
    createSearchView();
});
win.add(searchWebView);

