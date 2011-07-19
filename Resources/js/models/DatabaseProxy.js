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
//
// This module isn't implemented yet, just starting to define the public methods for a good db proxy.
//

var DatabaseProxy = function (facade) {
    var app = facade, _self = this, init, database;
    
    init = function () {
        database = Ti.Database.install('umobile.sqlite','umobile');
    };
    
    this.createTable = function (createOpts) {
        
    };
    
    this.addRows = function (addOpts) {
        
    };
    
    this.getRows = function (queryOpts) {
        //Required: table, 
        //Optional: selColumns, matchColumn, id, limit, 
    };
    
    this.updateRows = function (queryOpts) {
        
    };
    
    this.deleteRows = function (deleteOpts) {
        
    };
    
    this.search = function (queryOpts) {
        //Required: table
        //Optional: 

    };
    
    init();
};