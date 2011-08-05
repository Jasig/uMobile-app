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
* @constructor
* @implements {IDetailView}
*/
var DirectoryDetailView = function (facade) {
    var app = facade, init, _self = this, _view,
        Device, Styles, LocalDictionary, PersonDetailTable, Config, UI,
        //UI Components
        titleBar, secondaryNavBar, nameLabel, phoneLabel, attributeTable, backButton,
        //Methods
        updateValues, constructPerson, getAttribute,
        //Controller Event Handlers
        onDimensionChanges, onBackBtnClick;
    
    init = function () {
        Ti.API.debug('DirectoryDetailController constructed');
        if (!app.models.directoryPersonVO) {
            Ti.include('js/models/VOs/DirectoryPersonVO.js');
            app.registerModel('directoryPersonVO', new DirectoryPersonVO(app));
        }
        DirectoryPerson = app.models.directoryPersonVO;
        Device = app.models.deviceProxy;
        Styles = app.styles;
        LocalDictionary = app.localDictionary;
        PersonDetailTable = app.views.PersonDetailTableView;
        Config = app.config;
        UI = app.UI;
    };
    
    this.getDetailView = function () {
        if (!_view) {
            _view = Titanium.UI.createView(app.styles.contactDetailView);
            secondaryNavBar = UI.createSecondaryNavBar({
                backButtonHandler: onBackBtnClick,
                title: ' ',
                btnFloatLeft: true
            });
            _view.add(secondaryNavBar);

            attributeTable = new PersonDetailTable(app, Styles.directoryDetailAttributeTable);
            _view.add(attributeTable);

            Ti.App.addEventListener(ApplicationFacade.events['STYLESHEET_UPDATED'], function (e) {
                Styles = app.styles;
            });

            Titanium.App.addEventListener(ApplicationFacade.events['DIMENSION_CHANGES'], onDimensionChanges);
        }
        return _view;
    };
    
    this.render = function (viewModel) {
        var person = DirectoryPerson.constructVO(viewModel);
        secondaryNavBar.updateTitle(person.fullName);
        attributeTable.update(person);
        _view.show();
    };
    
    this.hide = function () {
        _view.hide();
    };
    
    constructPerson = function (attributes) {
        Ti.API.info('creating person');
        var person = {};
        person.address = {};
        person.email = {};
        person.phone = {};
        person.URL = {};
        Ti.API.info('created person');
        Ti.API.info(person.address);
        
        //A person has the following attributes:
        //Required: name
        //Optional: email (array of email addresses), username, userLoginId, displayName, phone

        person.address.home = getAttribute('homeAddress', attributes);
        person.email.home = getAttribute('homeEmail', attributes);
        person.phone.home = getAttribute('homePhone', attributes);
        person.URL.home = getAttribute('URL', attributes);
        
        person.organization = getAttribute('organization', attributes);
        person.department = getAttribute('department', attributes);
        person.firstName = getAttribute('firstName', attributes);
        person.fullName = getAttribute('fullName', attributes);
        person.jobTitle = getAttribute('jobTitle', attributes);
        person.lastName = getAttribute('lastName', attributes);        
        Ti.API.info(person);

        return person;
    };

    getAttribute = function (tiAttrName, attributes) {
        Ti.API.info("getting attribute " + tiAttrName);
        var portalAttrName = Config.DIRECTORY_SERVICE_RESULT_FIELDS[tiAttrName];
        if (portalAttrName) {
            var values = attributes[portalAttrName];
            Ti.API.info(values);
            if (values && values.length > 0) {
                return values[0].replace('$', '\n');
            }
        }
        return null;
    };
    
    onDimensionChanges = function (e) {
        Ti.API.debug("onDimensionChanges() in DirectoryDetailController");
        if (_view) {
            _view.width = app.styles.contactDetailView.width;
            _view.height = app.styles.contactDetailView.height;
        }
        if (attributeTable) {
            attributeTable.width = Styles.directoryDetailAttributeTable.width;
        }
        else {
            Ti.API.error("attributeTable is undefined in DirectoryDetailController");
        }
    };
    
    onBackBtnClick = function () {
        Ti.API.debug("onBackBtnClick() in DirectoryDetailController");
        _view.hide();
    };

    init();
};