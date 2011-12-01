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


function getAttribute (tiAttrName, attributes) {
    var portalAttrName = app.config.DIRECTORY_SERVICE_RESULT_FIELDS[tiAttrName];
    if (portalAttrName) {
        var values = attributes[portalAttrName];
        if (values && values.length > 0) {
            return values[0].replace('$', '\n');
        }
    }
    return null;
};

exports.constructVO = function (attributes) {
    var _person = {};
    
    _person.address = {};
    _person.email = {};
    _person.phone = {};
    _person.URL = {};
    
    //A person has the following attributes:
    //Required: name
    //Optional: email (array of email addresses), username, userLoginId, displayName, phone

    _person.address.home = getAttribute('homeAddress', attributes);
    _person.email.home = getAttribute('homeEmail', attributes);
    _person.phone.home = getAttribute('homePhone', attributes);
    _person.URL.home = getAttribute('URL', attributes);
    
    _person.organization = getAttribute('organization', attributes);
    _person.department = getAttribute('department', attributes);
    _person.firstName = getAttribute('firstName', attributes);
    _person.fullName = getAttribute('fullName', attributes);
    _person.jobTitle = getAttribute('jobTitle', attributes);
    _person.lastName = getAttribute('lastName', attributes);        
    
    return _person;
};