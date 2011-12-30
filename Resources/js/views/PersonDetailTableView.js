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

var person, emptyRow, 
table = Titanium.UI.createTableView(app.styles.directoryDetailAttributeTable), 
_ = require('/js/libs/underscore-min'),
isDataEmpty = false;

exports.table = table;

exports.update = function (p) {
    //Clear the previous data from the table.
    table.data = [];
    _newData = [];
    person = p;
    
    if (!person.email.home && !person.phone.home && !person.jobTitle && !person.organization && !person.address.home) {
        if(!emptyRow) {
            emptyRow = createRow({value: app.localDictionary.noContactData});
        }
        _newData.push(emptyRow);
        isDataEmpty = true;
    }
    
    if (person.email.home) {
        var _emailRow = createRow({label: app.localDictionary.email, value: person.email.home, link: true});

        _newData.push(_emailRow);
        _emailRow.addEventListener('click', onEmailSelect);
    }
    
    if (person.phone.home) {
        var _phoneRow = createRow({label: app.localDictionary.phone, value: person.phone.home, link: true });
        _newData.push(_phoneRow);
        _phoneRow.addEventListener('click', onPhoneSelect);
    }
    
    if (person.jobTitle) {
        _newData.push(createRow({label: app.localDictionary.title, value: person.jobTitle}));
    }
    
    if (person.department) {
        _newData.push(createRow({label: app.localDictionary.department, value: person.department}));
    }
    
    if (person.organization) {
        _newData.push(createRow({label: app.localDictionary.organization, value: person.organization}));
    }
    
    if (person.address.home) {
        var _addressRow = createRow({label: app.localDictionary.address, value: person.address.home, link: true });
        _newData.push(_addressRow);
        _addressRow.addEventListener('click', onMapSelect);
    }
    
    if (person.URL.home) {
        var _urlRow = createRow({label: app.localDictionary.url, value: person.URL.home, link: true});

        _newData.push(_urlRow);
        _urlRow.addEventListener('click', onUrlSelect);
    }
    table.setData(_newData);
};
function createRow (attributes) {
    var _row, _rowOptions, _label, _value, _valueOpts;
    //The only required param in the attributes object is value. "label" is optional but preferred.
    //The layout will change to expand the value text if there's no label with it.
    _rowOptions = _.clone(app.styles.directoryDetailRow);
    
    if (!attributes.label) {
        _rowOptions.className = 'personDataNoLabel';
    }
    else {
        _label = Titanium.UI.createLabel(app.styles.directoryDetailRowLabel);
        _label.text = attributes.label;
        _label.data = attributes.value;
        
        _rowOptions.className = 'personData';
    }
    _rowOptions.data = attributes.value;
    _row = Titanium.UI.createTableViewRow(_rowOptions);        
    if (attributes.label) { 
        _row.add(_label);
        _valueOpts = _.clone(app.styles.directoryDetailRowValue);
    }
    else {
        _valueOpts = _.clone(app.styles.directoryDetailValueNoLabel);
    }
    
    _valueOpts.text = attributes.value;
    _valueOpts.data = attributes.value;
    if (attributes.link) { 
        _valueOpts.color = app.styles.directoryLinkLabel.color;
    }
    _value = Titanium.UI.createLabel(_valueOpts);
    _row.add(_value);
    
    return _row;
}
onEmailSelect = function (e) {
    var _address;
    if(app.models.deviceProxy.isIOS()) {
        var emailDialog = Ti.UI.createEmailDialog({
            toRecipients: [e.source.data]
        });
        emailDialog.open();
    }
    else {
        Ti.Platform.openURL('mailto:' + e.source.data);
    }
};

onPhoneSelect = function (e) {
    var url = 'tel:' + e.source.data.replace(/[^0-9]/g, '');
    Ti.Platform.openURL(url);
};

onMapSelect = function (e) {
    var url = 'http://maps.google.com/maps?q=' + e.source.data.replace('$', ' ');
    Ti.Platform.openURL(url);
};

onUrlSelect = function (e) {
    Ti.Platform.openURL(e.source.data);
};