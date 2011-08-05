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
* @implements {IWindowView}
* @constructor
*/
var DirectoryWindowView = function (facade) {
    var app=facade, _self=this, init, UI, Device, DirectoryDetail, Styles, LocalDictionary, defaultTableData=[], tableData = [], _viewModel,
    win, peopleGroup, titleBar, searchBar, noSearchResultsSection, noSearchResultsRow, contentScrollView, peopleListTable, emergencyContactSection, phoneDirectorySection, phoneDirectoryRow, activityIndicator,
    drawDefaultView, displaySearchResults, blurSearch, createDefaultGroups,
    onContactRowClick, onPhoneDirectoryClick, onSearchCancel, onSearchSubmit, onSearchChange, onAndroidSearch;
    
    init = function () {
        Titanium.include('js/views/PersonDetailTableView.js');
        Titanium.include('js/views/DirectoryDetailView.js');
        app.registerView('PersonDetailTableView', PersonDetailTableView); // Used in Directory Window controller to show search results.
        app.registerView('DirectoryDetailView', new DirectoryDetailView(app)); // Subcontext in DirectoryWindowController to show
        
        Ti.App.addEventListener(ApplicationFacade.events['STYLESHEET_UPDATED'], function (e) {
            Styles = app.styles;
        });
        
        Device = app.models.deviceProxy;
        DirectoryDetail = app.views.DirectoryDetailView;
        Styles = app.styles;
        UI = app.UI;
        LocalDictionary = app.localDictionary;
    };
    
    this.open = function (viewModel) {
        _viewModel = viewModel;
        win = Titanium.UI.createWindow({
            url: 'js/views/WindowContext.js',
            backgroundColor: Styles.backgroundColor,
            exitOnClose: false,
            navBarHidden: true
        });
        win.open();
        if (Device.isAndroid()) {
        	win.addEventListener('android:search', onAndroidSearch);
        }
        drawDefaultView();
    };
    
    this.close = function () {
        blurSearch();
        if (win && Device.isAndroid()) {
        	try {
        		win.addEventListener('android:search', onAndroidSearch);
        	}
        	catch (e) {
        		Ti.API.error("Couldn't remove android:search event in DirectoryWindowView");
        	}
        }
        if (win) {
            win.close();
        }
    };
    
    this.reset = function () {
        Ti.API.debug("reset() in DirectoryWindowView");
        blurSearch();
        if (searchBar) { searchBar.input.value = ''; }
        DirectoryDetail.hide();
        if (peopleListTable) { peopleListTable.setData(_viewModel.emergencyContacts || defaultTableData); }
        if (activityIndicator) { activityIndicator.hide(); }
    };
    
    this.showDetail = function (person) {
        DirectoryDetail.render(person);
    };
    
    this.alert = function (attributes) {
        var alertDialog = Titanium.UI.createAlertDialog({
            title: attributes.title,
            message: attributes.message,
            buttonNames: [LocalDictionary.OK]
        });
        activityIndicator.hide();
        alertDialog.show();
    };
    
    this.showActivityIndicator = function (message) {
        if (message) { activityIndicator.setLoadingMessage(message); }
        activityIndicator.show();
    };
    
    this.updateTable = function (newTableData) {
        tableData = newTableData;
        peopleListTable.setData(tableData);
    };
    
    this.displaySearchResults = function (results) {
        var _peopleTableData = [], _people, alertDialog;

        activityIndicator.hide();
        
        //Get array of people from search results from proxy
        _people = results;

        if(_people.length > 0) {
            Ti.API.info(_people);
            for (var i=0, iLength=_people.length; i<iLength; i++) {
                var _contactRow = Titanium.UI.createTableViewRow({
                    title: _people[i].displayName[0],
                    hasChild: true,
                    data: _people[i],
                    className: 'ContactRow'
                });
                _peopleTableData.push(_contactRow);
                _contactRow.addEventListener('click', onContactRowClick);
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
    
    drawDefaultView = function () {
        Ti.API.debug("Adding titleBar in DirectoryWindowController");
        if (win) {
            titleBar = UI.createTitleBar({
                title: LocalDictionary.directory,
                homeButton: true,
                settingsButton: false
            });
            win.add(titleBar);

            createDefaultGroups();

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
            searchBar = UI.createSearchBar({
                cancel: onSearchCancel,
                submit: onSearchSubmit,
                change: onSearchChange
            });
            win.add(searchBar.container);

            win.add(DirectoryDetail.getDetailView());

            activityIndicator = UI.createActivityIndicator();
            activityIndicator.resetDimensions();
            win.add(activityIndicator);
            activityIndicator.hide();
        }
        else {
            Ti.API.error("No win in drawDefaultView() in DirectoryWindowController");
        }
    };
    
    createDefaultGroups = function () {
        defaultTableData = [];
        Ti.API.debug("Adding phoneDirectorySection in DirectoryWindowController");
        if (_viewModel.defaultNumber) {
            //Create the section and one row to display the phone number for the phone directory
            phoneDirectorySection = Titanium.UI.createTableViewSection({
                headerTitle: LocalDictionary.phoneDirectory
            });
            phoneDirectoryRow = Titanium.UI.createTableViewRow({
                title: _viewModel.defaultNumber
            });
            phoneDirectoryRow.addEventListener('click', onPhoneDirectoryClick);
            phoneDirectorySection.add(phoneDirectoryRow);
            defaultTableData.push(phoneDirectorySection);
        }

        //Create a section to display emergency contact numbers

        if (_viewModel.emergencyContacts.length > 0) {
            emergencyContactSection = Titanium.UI.createTableViewSection();
            emergencyContactSection.headerTitle =  LocalDictionary.emergencyContacts;
            for (var i=0, iLength = _viewModel.emergencyContacts.length; i<iLength; i++) {
                var _contact = _viewModel.emergencyContacts[i],
                _emergencyContactRow = Titanium.UI.createTableViewRow({
                    title: _contact.displayName[0],
                    hasChild: true,
                    data: _contact
                });
                emergencyContactSection.add(_emergencyContactRow);
                _emergencyContactRow.addEventListener('click', onContactRowClick);
            }
            defaultTableData.push(emergencyContactSection);
        }
        else {
            Ti.API.info("There aren't any emergency contacts");
        }
    };
    
    //Contact Events
    onContactRowClick = function (e) {
        Ti.API.debug("Contact clicked");
        _self.showDetail(e.source.data);
    };
    
    onPhoneDirectoryClick = function (e) {
        Ti.API.debug("Clicked the phone directory button");
        Ti.Platform.openURL('tel:' + _viewModel.defaultNumber);
    };
    
    onSearchCancel = function (e) {
        Ti.API.debug('onSearchCancel() in DirectoryWindowView');
        _self.reset();
    };
    
    onSearchSubmit = function(e) {
        Ti.API.debug('onSearchSubmit() in DirectoryWindowView');
        blurSearch();
        Ti.App.fireEvent(DirectoryWindowView.events['SEARCH_SUBMIT'], {value: searchBar.input.value});
    };
    
    onSearchChange = function (e) {
        Ti.App.fireEvent(DirectoryWindowView.events['SEARCH_CHANGE'], {value: searchBar.input.value});
        if(searchBar.input.value === '') {
            _self.updateTable(_viewModel.emergencyContacts);
            if (peopleListTable) {
                peopleListTable.setData(defaultTableData);
            }
        }
    };
    
    onAndroidSearch = function (e) {
    	if (searchBar && searchBar.input) {
    		searchBar.input.focus();
    	}
    	if (DirectoryDetail) {
    		DirectoryDetail.hide();
    	}
    };
    
    blurSearch = function () {
        if (searchBar) {
            searchBar.input.blur();
        }
    };
    
    init();
};

DirectoryWindowView.events = {
    SEARCH_SUBMIT   : 'DirectoryWindowSearchSubmit',
    SEARCH_CHANGE   : 'DirectoryWindowSearchChange'
};