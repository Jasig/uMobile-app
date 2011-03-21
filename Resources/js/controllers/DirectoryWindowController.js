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
 * settings_window.js contains setup information for the
 * user settings tab.
 */

Ti.API.info("Directory Window Opened");

(function () {
    var win = Titanium.UI.currentWindow,
        app = win.app,
        self = {},
        directoryProxy = app.models.directoryProxy,
        // Data and variables
        peopleResult = [],
        defaultTableData,
        initialized = false,
        //UI Elements
        peopleGroup,
        titleBar,
        searchBar,
        noSearchResultsSection,
        noSearchResultsRow,
        contentScrollView,
        peopleListTable,
        emergencyContactSection,
        phoneDirectorySection,
        phoneDirectoryRow,
        //Methods
        searchSubmit,
        blurSearch,
        displaySearchResults,
        //Event Handlers
        onSearchCancel,
        onPhoneDirectoryClick,
        onSearchSubmit,
        onSearchChange,
        onProxySearching,
        onProxySearchComplete,
        onProxySearchError;
    
    self.init = function () {
        Ti.API.debug("DirectoryWindowController.init()");
        win.backgroundColor = '#fff';
        win.initialized = true;
        titleBar = new win.app.views.GenericTitleBar({
            app: app,
            title: app.localDictionary.directory,
            homeButton: true,
            settingsButton: false,
            windowKey: win.key
        });
        win.add(titleBar);
        
        searchBar = Titanium.UI.createSearchBar({
            top: titleBar.size.height,
            height:50,
            barColor: "#333",
            // clearButtonMode: Ti.UI.INPUT_BUTTONMODE_ALWAYS,
            showCancel: true,
            hintText: app.localDictionary.directorySearchHintText
        });
        win.add(searchBar);
        searchBar.addEventListener('cancel', onSearchCancel);
        searchBar.addEventListener('return',onSearchSubmit);
        searchBar.addEventListener('change', onSearchChange);

        //Create an array to hold the initial data passed into the Directory
        //Initial Data includes phone directory and emergency contacts
        defaultTableData = [];
        
        //Create a section to display emergency contact numbers
        emergencyContactSection = Titanium.UI.createTableViewSection();
        emergencyContactSection.headerTitle =  app.localDictionary.emergencyContacts;
        var tempEmergencyContactRow = Titanium.UI.createTableViewRow({
            title: "Hard-coded contact"
        });
        emergencyContactSection.add(tempEmergencyContactRow);
        defaultTableData.push(emergencyContactSection);
        
        //Create the section and one row to display the phone number for the phone directory
        phoneDirectorySection = Titanium.UI.createTableViewSection();
        phoneDirectorySection.headerTitle = app.localDictionary.phoneDirectory;
        phoneDirectoryRow = Titanium.UI.createTableViewRow({
            title: app.localDictionary.phoneDirectoryNumber
        });
        phoneDirectoryRow.addEventListener('click',onPhoneDirectoryClick);
        phoneDirectorySection.add(phoneDirectoryRow);
        defaultTableData.push(phoneDirectorySection);
            
        //Create the main table
        peopleListTable = Titanium.UI.createTableView({
            data: defaultTableData,
            top: searchBar.size.height + searchBar.top,
            style: Titanium.UI.iPhone.TableViewStyle.GROUPED
        });
        win.add(peopleListTable);
        peopleListTable.addEventListener('touchstart', blurSearch);
        peopleListTable.addEventListener('move', blurSearch);
        
        initialized = true;
    };
    
    displaySearchResults = function () {
        var _peopleTableData = [], _people;
                
        //Get array of people from search results from proxy
        _people = directoryProxy.getPeople();

        if(_people.length > 0) {
            // peopleListTable.show();
            for (var i=0, iLength=_people.length; i<iLength; i++) {
                _peopleTableData.push(Titanium.UI.createTableViewRow({
                    title: _people[i].name,
                    hasChild: true
                }));
            }
            peopleListTable.setData(_peopleTableData);
        }
        else {
            Ti.API.debug("Not more than 0 results");
            if(defaultTableData[0].headerTitle != app.localDictionary.noSearchResults) {
                noSearchResultsSection = Titanium.UI.createTableViewSection();
                noSearchResultsSection.headerTitle = app.localDictionary.noSearchResults;

                defaultTableData.splice(0,0,noSearchResultsSection);
                
                                
            }
            peopleListTable.setData(defaultTableData);
        }
    };
    
    blurSearch = function () {
        searchBar.blur();
    };
    
    // Controller Events
    
    onPhoneDirectoryClick = function (e) {
        Ti.API.debug("Clicked the phone directory button");
        Ti.Platform.openURL('tel:' + app.localDictionary.phoneDirectoryNumber);
    };
    
    onSearchSubmit = function(e) {
        searchBar.blur();
        directoryProxy.search(searchBar.value);
    };
    
    onSearchCancel = function (e) {
        directoryProxy.clear();
        blurSearch();
        displaySearchResults();
    };
    onSearchChange = function (e) {
        if(searchBar.value == '') {
            directoryProxy.clear();
            displaySearchResults();
        }
    };
    
    //Proxy events

    onProxySearching = function (e) {
        Ti.API.info("Searching...");
    };
    
    onProxySearchComplete = function (e) {
        Ti.API.info("Directory Search Complete");
        displaySearchResults();
    };
    
    onProxySearchError = function (e) {
        Ti.API.info("Directory Proxy Search Error");
    };
    
    //Listene for events, mostly fired from models.DirectoryProxy
    Titanium.App.addEventListener('DirectoryProxySearching', onProxySearching);
    Titanium.App.addEventListener('DirectoryProxySearchComplete', onProxySearchComplete);
    Titanium.App.addEventListener('DirectoryProxySearchError', onProxySearchError);
    Titanium.App.addEventListener('showWindow', blurSearch);
    
    if(initialized === false) {
        self.init();        
    }

    return self;
})();