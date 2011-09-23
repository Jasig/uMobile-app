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
//This is a non-functioning interface, only here to provide
// a reference to the public methods required for a Login Method
var ILoginMethod = function () {
    this.login = function (credentials, options) {
        //This method establishes a session, and has event handlers to fire success or failure events
        //The credentials will be { username: string, password: string }
        //Options might contain isUnObtrusive:bool, which will tell the login method not to broadcast an event on success, only on failure.
        //Ultimately should retrieve user's layout and process it into other models
    };
    
    this.logout = function () {
        //Logs out and loads guest layout into other models
    };
    
    this.getLoginURL = function (strURL) {
        //This method takes in a URL and returns a URL that will either 
        // * Automatically log them in and redirect them to the provided url OR
        // * Let them manually log in, and then redirect them to the provided url
    };
};