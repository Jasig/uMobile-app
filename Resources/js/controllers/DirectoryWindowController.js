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

 /**
  * @constructor
  */
var DirectoryWindowController = function (facade) {
    var win, app = facade, _self = this, Directory, DirectoryDetail, Styles, LocalDictionary, UI, UPM, init,
        // Data and variables
        initialized, peopleResult = [], defaultTableData = [], 
        //UI Elements
        peopleGroup, titleBar, searchBar, noSearchResultsSection, noSearchResultsRow, contentScrollView, peopleListTable, emergencyContactSection, phoneDirectorySection, phoneDirectoryRow, contactDetailView, activityIndicator,
        //Methods
        drawDefaultView, resetHome, searchSubmit, openContactDetail, blurSearch, displaySearchResults,
        //Event Handlers
        onSearchCancel, onPhoneDirectoryClick, onSearchSubmit, onSearchChange, onContactRowClick, onNewWindowOpened, onProxySearching, onProxySearchComplete, onProxySearchError;
    
    init = function () {
        Ti.API.debug("init() in DirectoryWindowController");
        _self.key = 'directory';        
    };
    
    this.open = function () {
        if (!initialized) {
            Titanium.include('js/models/DirectoryProxy.js');
            Titanium.include('js/views/PersonDetailTableView.js');
            Titanium.include('js/controllers/DirectoryDetailController.js');
            
            app.registerModel('directoryProxy', new DirectoryProxy(app)); //Manages real-time searching the uPortal service for directory entries, used primarily by DirectoryWindowController.
            app.registerView('PersonDetailTableView', PersonDetailTableView); // Used in Directory Window controller to show search results.
            app.registerController('DirectoryDetailController', DirectoryDetailController); // Subcontext in DirectoryWindowController to show 
            
            //Listene for events, mostly fired from models.DirectoryProxy
            Ti.App.addEventListener('NewWindowOpened', onNewWindowOpened);
            Titanium.App.addEventListener('DirectoryProxySearching', onProxySearching);
            Titanium.App.addEventListener('DirectoryProxySearchComplete', onProxySearchComplete);
            Titanium.App.addEventListener('DirectoryProxySearchError', onProxySearchError);
            Ti.App.addEventListener('updatestylereference', function (e) {
                Styles = app.styles;
            });

            //Set pointers to necessary members of facade
            Directory = app.models.directoryProxy;
            DirectoryDetail = app.controllers.DirectoryDetailController;
            Styles = app.styles;
            LocalDictionary = app.localDictionary;
            UI = app.UI;
            UPM = app.config;

            initialized = true;
        }
        
        win = Titanium.UI.createWindow({
            url: 'js/views/WindowContext.js',
            backgroundColor: Styles.backgroundColor,
            title: LocalDictionary.directory,
            exitOnClose: false,
            navBarHidden: true
            // orientationModes: [Ti.UI.PORTRAIT]
        });
        win.open();
        drawDefaultView();
    };
    
    this.close = function (options) {
        if (win) {
            win.close();
        }
    };
    
    drawDefaultView = function () {
        var activityIndicatorTimeout;
        Ti.API.debug("Adding titleBar in DirectoryWindowController");
        if (win) {
            titleBar = UI.createTitleBar({
                title: LocalDictionary.directory,
                homeButton: true,
                settingsButton: false
            });
            win.add(titleBar);

            Ti.API.debug("Adding phoneDirectorySection in DirectoryWindowController");
            if (UPM.phoneDirectoryNumber) {
                //Create the section and one row to display the phone number for the phone directory
                phoneDirectorySection = Titanium.UI.createTableViewSection();
                phoneDirectorySection.headerTitle = LocalDictionary.phoneDirectory;
                phoneDirectoryRow = Titanium.UI.createTableViewRow({
                    title: UPM.phoneDirectoryNumber
                });
                phoneDirectoryRow.addEventListener('click',onPhoneDirectoryClick);
                phoneDirectorySection.add(phoneDirectoryRow);
                defaultTableData.push(phoneDirectorySection);
            }

            Ti.API.info("Emergency Contacts? " + Directory.getEmergencyContacts());
            //Create a section to display emergency contact numbers

            if (Directory.getEmergencyContacts().length > 0) {
                defaultTableData = [];
                emergencyContactSection = Titanium.UI.createTableViewSection();
                emergencyContactSection.headerTitle =  LocalDictionary.emergencyContacts;
                for (var i=0, iLength = Directory.getEmergencyContacts().length; i<iLength; i++) {
                    var _contact = Directory.getEmergencyContacts()[i],
                    _emergencyContactRow = Titanium.UI.createTableViewRow({
                        title: _contact.displayName[0],
                        hasChild: true,
                        data: _contact
                    });
                    emergencyContactSection.add(_emergencyContactRow);
                    _emergencyContactRow.addEventListener('click',onContactRowClick);
                }
                defaultTableData.push(emergencyContactSection);            
            }
            else {
                Ti.API.info("There aren't any emergency contacts");
            }

            Ti.API.debug("Adding peopleListTable in DirectoryWindowController");
            //Create the main table
            peopleListTable = Titanium.UI.createTableView({
                data: defaultTableData,
                top: Styles.titleBar.height + Styles.searchBar.height
            });

            peopleListTable.style = Titanium.UI.iPhone.TableViewStyle.GROUPED;

            win.add(peopleListTable);
            peopleListTable.addEventListener('touchstart', blurSearch);
            peopleListTable.addEventListener('move', blurSearch);

            Ti.API.debug("Adding searchBar in DirectoryWindowController");

            //Create and add a search bar at the top of the table to search for contacts
            searchBar = UI.createSearchBar();
            Ti.API.info("searchBar: " + searchBar);
            win.add(searchBar.container);
            searchBar.input.addEventListener('cancel', onSearchCancel);
            searchBar.input.addEventListener('return', onSearchSubmit);
            searchBar.input.addEventListener('change', onSearchChange);

            //Create the contact detail view but don't show it yet.
            contactDetailView = new DirectoryDetail(app);
            win.add(contactDetailView);


            activityIndicator = UI.createActivityIndicator();
            activityIndicator.resetDimensions();
            win.add(activityIndicator);
            activityIndicator.hide();
        }
        else {
            Ti.API.error("No win in drawDefaultView() in DirectoryWindowController");
        }
    };
    
    resetHome = function () {
        Ti.API.debug("resetHome() in DirectoryWindowController");
        blurSearch();
        if (searchBar) { searchBar.input.value = ''; }
        if (Directory) { Directory.clear(); }
        if (peopleListTable) { peopleListTable.setData(defaultTableData); }
        if (contactDetailView) { contactDetailView.hide(); }
        if (activityIndicator) { activityIndicator.hide(); }
    };
    
    displaySearchResults = function () {
        var _peopleTableData = [], _people, alertDialog;
                
        //Get array of people from search results from proxy
        _people = Directory.getPeople();

        if(_people.length > 0) {
            Ti.API.info(_people);
            for (var i=0, iLength=_people.length; i<iLength; i++) {
                var _contactRow = Titanium.UI.createTableViewRow({
                    title: _people[i].displayName[0],
                    hasChild: true,
                    data: _people[i]
                });
                _peopleTableData.push(_contactRow);
                _contactRow.addEventListener('click',onContactRowClick);
            }
            peopleListTable.setData(_peopleTableData);
        }
        else {
            Ti.API.debug("Not more than 0 results");
            alertDialog = Titanium.UI.createAlertDialog({
                title: LocalDictionary.noResults,
                message: LocalDictionary.noSearchResults,
                buttonNames: [LocalDictionary.OK]
            });
            alertDialog.show();
            peopleListTable.setData(defaultTableData);
        }
    };
    
    openContactDetail = function (person) {
        Ti.API.debug('openContactDetail called in DirectoryWindowController');
        Ti.API.debug(contactDetailView);
        Ti.API.debug(person);
        activityIndicator.hide();
        contactDetailView.update(person);
        contactDetailView.show();
    };
    
    blurSearch = function () {
        if (searchBar) {
            searchBar.input.blur();
        }
    };
    
    // Controller Events
    onNewWindowOpened = function (e) {
        if (e.key !== _self.key) {
            blurSearch();
        }
    };
    // Search Events
    onPhoneDirectoryClick = function (e) {
        Ti.API.debug("Clicked the phone directory button");
        Ti.Platform.openURL('tel:' + UPM.phoneDirectoryNumber);
    };
    
    onSearchSubmit = function(e) {
        Ti.API.debug('onSearchSubmit');
        blurSearch();
        Directory.search(searchBar.input.value);
    };
    
    onSearchChange = function (e) {
        if(searchBar.input.value === '') {
            Directory.clear();
            peopleListTable.setData(defaultTableData);
        }
    };

    onSearchCancel = function (e) {
        Ti.API.debug('onSearchCancel');
        resetHome();
    };
    
    //Contact Events
    onContactRowClick = function (e) {
        Ti.API.debug("Contact clicked:" + JSON.stringify(e.source.data));
        openContactDetail(e.source.data);
    };
    
    //Proxy events

    onProxySearching = function (e) {
        activityIndicator.setLoadingMessage(LocalDictionary.searching + '...');
        activityIndicator.show();
        Ti.API.info("Searching...");
    };
    
    onProxySearchComplete = function (e) {
        var alertDialog;
        
        activityIndicator.hide();
        Ti.API.info("Directory Search Complete");
        
        if (!e.error) {
            displaySearchResults();
        }
        else {
            alertDialog = Titanium.UI.createAlertDialog({
                title: LocalDictionary.error,
                message: e.error,
                buttonNames: [LocalDictionary.OK]
            });
            alertDialog.show();
        }
    };
    
    onProxySearchError = function (e) {
        activityIndicator.hide();
        var alertDialog = Titanium.UI.createAlertDialog({
            title: LocalDictionary.errorPerformingSearch,
            message: LocalDictionary.noSearchResults,
            buttonNames: [LocalDictionary.OK]
        });
        alertDialog.show();
        Ti.API.error("Directory Proxy Search Error");
    };
    
    if(!initialized) {
        init();
    }
};