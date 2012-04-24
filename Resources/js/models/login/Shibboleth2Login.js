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

var _credentials, 
_client, 
responseConsumerURL, 
AssertionConsumerServiceURL,
ecpResponse, 
ecpRelayState,
config = require('/js/config'),
deviceProxy = require('/js/models/DeviceProxy'),
app = require('/js/Constants'),
refUrl = config.PORTAL_CONTEXT + '/layout.json',
shibECPUrl = config.SHIB_ECP_URL,
shibProtectedUrl = config.SHIB_PROTECTED_URL,
logoutUrl = config.BASE_PORTAL_URL + config.PORTAL_CONTEXT + "/Logout";


exports.login = function (credentials, forceLogout) {
    Ti.API.debug('login() in Shibboleth');
    _credentials = credentials;
    
    //If there's no user name, let's skip a step and load the guest layout
    if (!_credentials.username) {
    	return _onECPResponse3();
    }
    
    function _login (e) {
        
        //ask the client to handle successes and errors.
        _client = Titanium.Network.createHTTPClient({
            onload: _onECPResponse1,
            onerror: _onError
        });

		// Send an initial request to the shibb protected resource
		_client.open('GET',shibProtectedUrl);

        //set the required ecp headers
        _client.setRequestHeader('Accept','text/html; application/vnd.paos+xml');
        _client.setRequestHeader('PAOS','ver="urn:liberty:paos:2003-08";"urn:oasis:names:tc:SAML:2.0:profiles:SSO:ecp"');
        
        if (deviceProxy.isAndroid()) {
        	client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
		}
		
        _client.send();
    }
    if (forceLogout === true) {
        _client = Titanium.Network.createHTTPClient({
            onload: _login,
            onerror: _onError
        });
        _client.open('GET', logoutUrl, true);
        if (deviceProxy.isAndroid()) {
        	_client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
        }
        _client.send();
        return; 
    }
    _login();
};


function _onECPResponse1 () {
	Ti.API.debug('_onECPResponse1()');
	
	//teh raw response
	Ti.API.debug(_client.responseText);
	
    var sEnvelope = _client.responseXML.documentElement;
    var sHeader = sEnvelope.getFirstChild();
	var sBody = sHeader.getNextSibling();
	
	Ti.API.debug(sEnvelope + " root node: "+sEnvelope.nodeName);
	Ti.API.debug(sHeader + " header node: "+sHeader.nodeName);
	Ti.API.debug(sBody + " body node: "+sBody.nodeName);
	
	
	//Get <ecp:RelayState> element
	ecpRelayState = sHeader.getElementsByTagName("ecp:RelayState").item(0);
	
	Ti.API.debug(ecpRelayState + " ecpRelayState node: "+ecpRelayState.nodeName);
	
	//this will be used to check against an attribute in _onECPResponse2
	responseConsumerURL = sHeader.getFirstChild().getAttributeNode("responseConsumerURL").value;
	
	Ti.API.debug("responseConsumerURL: "+responseConsumerURL);
	
	
	//remove the header node
	//which is the post data to be sent
	sEnvelope.removeChild(sHeader);
	
	Ti.API.debug(Titanium.XML.serializeToString(sEnvelope));
	
	//reinitialize the client
    _client = Titanium.Network.createHTTPClient({
        onload: _onECPResponse2,
        onerror: _onError
    });

    _client.open('POST', shibECPUrl);
    
    if (deviceProxy.isAndroid()) {
        _client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
    }
    
    //add the credentials as a basic auth header
    _client.setRequestHeader('Authorization', 'Basic ' +Titanium.Utils.base64encode(_credentials.username+':'+_credentials.password));
   
 	//send the updated envelope	
    _client.send(Titanium.XML.serializeToString(sEnvelope));
        
};

function _onECPResponse2 () {
    Ti.API.debug('_onECPResponse2()');
	
	//teh raw response
	Ti.API.debug(_client.responseText);
	
    var sEnvelope = _client.responseXML.documentElement;
    var sHeader = sEnvelope.getFirstChild();
	var sBody = sHeader.getNextSibling();
	
	Ti.API.debug(sEnvelope + " root node: "+sEnvelope.nodeName);
	Ti.API.debug(sHeader + " header node: "+sHeader.nodeName);
	Ti.API.debug(sBody + " body node: "+sBody.nodeName);
	
	
	//Get <ecp:RelayState> element
	ecpResponse = sHeader.getElementsByTagName("ecp:Response").item(0);
	
	Ti.API.debug(ecpResponse + " ecpResponse node: "+ecpResponse.nodeName);
	
	//this will be used to check against an attribute in _onECPResponse1
	AssertionConsumerServiceURL = sHeader.getFirstChild().getAttributeNode("AssertionConsumerServiceURL").value;
	
	Ti.API.debug("AssertionConsumerServiceURL: "+AssertionConsumerServiceURL);
    
    //if the relay and response attributes match, continue...
    if (AssertionConsumerServiceURL == responseConsumerURL) {
    	
    	//replace the response element in the header with the relaystate element from _onECPResponse1
		sHeader.removeChild(sHeader.getFirstChild());
		sHeader.appendChild(ecpRelayState);
    	
    	Ti.API.debug(Titanium.XML.serializeToString(sEnvelope));
    	
    	//reinitialize the client
	    _client = Titanium.Network.createHTTPClient({
	        onload: _onECPResponse3,
	        onerror: _onError
	    });
	    
        _client.open('POST', AssertionConsumerServiceURL);
        
        _client.setRequestHeader('Content-Type','application/vnd.paos+xml');
        
        if (deviceProxy.isAndroid()) {
	        _client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
	    }
        
        //send the updated envelope	
    	_client.send(Titanium.XML.serializeToString(sEnvelope));

    }
    else {
        Ti.API.error("!_isLoginSuccess()");
        /*
            Apparently the login process has stalled, so we're going to
            attempt to just load the layout anyway and let the app
            figure out how to let the user know.
        */
        _onECPResponse3();
    }
};


function _onECPResponse3 () {
	
	Ti.API.debug('_onECPResponse3()');
	
	//teh raw response
	if (typeof _client != 'undefined'){
		
		Ti.API.debug(_client.status);
		Ti.API.debug(_client.responseText);
		Ti.App.fireEvent(app.loginEvents['LOGIN_METHOD_COMPLETE'], { response : _client.responseText });
		
	}else{
    /*
        Shibboleth has posted back to the portal to log the user in. Now
        we just need to retrieve layout.json.
    */
    _client = Ti.Network.createHTTPClient({
        onload: function (e) {
        	Ti.API.debug('response: '+_client.responseText);
            Ti.App.fireEvent(app.loginEvents['LOGIN_METHOD_COMPLETE'], { response : _client.responseText });
        },
        onerror: function (e) {
            Ti.App.fireEvent(app.loginEvents["LOGIN_METHOD_ERROR"]);
        }
    });

    if (_credentials.username === '' && _client.clearCookies) {
        _client.clearCookies(shibECPUrl);
        _client.clearCookies(shibProtectedUrl);
       	Ti.API.debug("cleared cookies");
    }
    
    _client.open("GET", config.BASE_PORTAL_URL + config.PORTAL_CONTEXT + "/Login?refUrl=/layout.json");
    
    if (deviceProxy.isAndroid()) {
        _client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
    }
    _client.send({autoRedirect:true});
    
   }
};


exports.logout = function () {
    Ti.API.debug('logout() in ShibbolethLogin');
    // Log out the network session, which also clears the webView session in iPhone
    _client = Titanium.Network.createHTTPClient({
        onload: _onLogoutComplete,
        onerror: _onError
    });
    _client.open('GET', logoutUrl, true);
    if (deviceProxy.isAndroid()) {
    	_client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
   }
   _client.send();
};

function _onLogoutComplete (e) {
    Ti.API.debug('_onLogoutComplete() in ShibbLogin');
    _client = Titanium.Network.createHTTPClient({
        onerror: _onError
    });
    
    // If it's Android, we'll use our custom clearcookies method to clear the webview cookies
    if (deviceProxy.isAndroid() && _client.clearCookies) _client.clearCookies(config.BASE_PORTAL_URL);
    
    //clear cookies for other devices
    _client.clearCookies(shibECPUrl);
   	_client.clearCookies(shibProtectedUrl);
    Ti.API.debug("cleared cookies");
    
    _client.open('GET', refUrl, true);
    
    if (deviceProxy.isAndroid()) {
    	_client.setRequestHeader('User-Agent', "Mozilla/5.0 (Linux; U; Android 1.0.3; de-de; A80KSC Build/ECLAIR) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530");
    }
    
    _client.send();
    
};

function _onError (e) {
	Ti.API.debug('_onError() in ShibbLogin');
	Ti.API.debug(_client.status);
	Ti.API.debug(_client.responseText);
    Ti.App.fireEvent(app.loginEvents['LOGIN_METHOD_ERROR']);
};

