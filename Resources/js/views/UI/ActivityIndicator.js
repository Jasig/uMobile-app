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
var styles = require('/js/style'),
localDictionary = require('/js/localization')[Ti.App.Properties.getString('locale')];

exports.createActivityIndicator = function () {
    var messageLabel, indicator, dialog;
    indicator = {view: Ti.UI.createView(styles.globalActivityIndicator)};

    dialog = Ti.UI.createView(styles.activityIndicatorDialog);
    indicator.view.add(dialog);

    messageLabel = Ti.UI.createLabel(styles.activityIndicatorMessage);
    messageLabel.text = localDictionary.loading;
    dialog.add(messageLabel);
    
    indicator.setLoadingMessage = function (m) {
        if (typeof m == 'string') {
            messageLabel.text = m;
        }
        else {
            Ti.API.error("Message isn't valid:" + m + ' ' + typeof m);
        }
    };
        
    return indicator;
};