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

var models = {}, views = {}, controllers = {};

exports.models = models;
exports.views = views;
exports.controllers = controllers;

exports.registerMember = function (name, member) {
    exports[name] = member;
};

//Controller passed as reference, with name as its key in facade.controllers.
exports.registerController = function (name, controller) {
    controllers[name] = controller;
};

exports.registerModel = function (name, model) {
    models[name] = model;
};

exports.registerView = function (name, view) {
    views[name] = view;
};
    
//Global Events, static variables to access without facade instance.
exports.events = {
    SESSION_ACTIVITY            : 'SessionActivity',
    NETWORK_ERROR               : 'networkConnectionError',
    SHOW_WINDOW                 : 'showWindow',
    SHOW_PORTLET                : 'showPortlet',
    //Layout-related events
    LAYOUT_CLEANUP              : 'layoutcleanup',
    STYLESHEET_UPDATED          : 'updatestylereference',
    DIMENSION_CHANGES           : 'dimensionchanges',
    ANDROID_ORIENTATION_CHANGE  : 'androidorientationchange',
    //Platform level events
    OPEN_EXTERNAL_URL           : 'OpenExternalURL'
};