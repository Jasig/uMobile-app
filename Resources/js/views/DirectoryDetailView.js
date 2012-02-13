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

var _view, personDetailTable, titleBar, secondaryNavBar, nameLabel, phoneLabel, attributeTable, backButton,
directoryPerson = require('/js/models/VOs/DirectoryPersonVO'),
styles = require('/js/style').updateStyles(),
config = require('/js/config');

exports.retrieveDetailView = function () {
    if (_view) return _view;
    _view = Titanium.UI.createView(styles.contactDetailView);

    secondaryNavBar = require('/js/views/UI/SecondaryNav').createSecondaryNav();
    secondaryNavBar.view.top = 0;
    secondaryNavBar.rightButton.hide();
    secondaryNavBar.rightButton.visible = false;
    secondaryNavBar.leftButton.addEventListener('click', onBackBtnClick);
    _view.add(secondaryNavBar.view);

    attributeTable = require('/js/views/PersonDetailTableView');
    _view.add(attributeTable.table);

    return _view;
};

exports.render = function (viewModel) {
    var person = directoryPerson.constructVO(viewModel);
    secondaryNavBar.titleLabel.text = person.fullName;
    attributeTable.update(person);
    _view.show();
};

exports.hide = function () {
    _view.hide();
    _view = null;
};

exports.rotate = function (orientation) {
    styles = styles.updateStyles();
    if (_view) _view.height = styles.contactDetailView.height;
};

function constructPerson (attributes) {
    var person = {};
    person.address = {};
    person.email = {};
    person.phone = {};
    person.URL = {};
    
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

    return person;
};

function getAttribute (tiAttrName, attributes) {
    var portalAttrName = config.DIRECTORY_SERVICE_RESULT_FIELDS[tiAttrName];
    if (portalAttrName) {
        var values = attributes[portalAttrName];
        if (values && values.length > 0) {
            return values[0].replace('$', '\n');
        }
    }
    return null;
};

function onBackBtnClick () {
    _view.hide();
};