var PortalProxy = function (facade) {
    var app = facade, self = {}, portlets = [], sortPortlets, loadPortletList, init,
        pathToRoot = '../../';
    
    init = function () {
        //Nothing to see here
    };
    
    self.getShowPortletFunc = function (portlet) {
        //Returns a function to the PortalWindowController to open the appropriate window 
        //when an icon is clicked in the home screen grid.
        
        Ti.API.debug("getShowPortletFunc() in PortalProxy");
        return function () {
            if (portlet.url) {
                Ti.API.debug("portlet.url exists in getShowPortletFunc() in PortalProxy");
                app.models.windowManager.openWindow(app.controllers.portletWindowController.key, portlet);
            } 
            else {
                Ti.API.debug("portlet.url doesn't exist in getShowPortletFunc() in PortalProxy");
                app.models.windowManager.openWindow(portlet.window);
            }
        };
    };
    
    self.getPortlets = function () {
        Ti.API.debug("getPortlets() in PortalProxy");
        return portlets;
    };
    
    sortPortlets = function(a, b) {
        if (!a.title || !b.title) {
            Ti.API.error("Missing a title for one of these:" + JSON.stringify(a) + " & " + JSON.stringify(b));
            return -1;
        }
        // get the values for the configured property from 
        // each object and transform them to lower case
        var aprop = a.title.toLowerCase();
        var bprop = b.title.toLowerCase();

        // if the values are identical, indicate an equals
        if (aprop === bprop) {
            return 0;
        }

        // otherwise perform a normal alphabetic sort
        if (aprop > bprop) {
            return 1;
        } else {
            return -1;
        }

    };
        
    self.getIconUrl = function (p) {
        var _iconUrl;
        
        if (app.models.resourceProxy.getPortletIcon(p.fname)) {
            _iconUrl = app.models.resourceProxy.getPortletIcon(p.fname);
        }
        else if (p.iconUrl && p.iconUrl.indexOf('/') == 0) {
            _iconUrl = app.UPM.BASE_PORTAL_URL + p.iconUrl;
        } 
        else if (p.iconUrl) {
            _iconUrl = pathToRoot + p.iconUrl;
        } 
        else {
            _iconUrl = app.UPM.BASE_PORTAL_URL + '/ResourceServingWebapp/rs/tango/0.8.90/32x32/categories/applications-other.png';
        }

        return _iconUrl;
    };

    loadPortletList = function() {
        Ti.API.debug('loadPortletList() in PortalProxy');
        var layoutUrl, layoutClient, layoutText,
            onRequestComplete, onRequestError, onGetPortletsComplete, onGetPortletsError;

            onGetPortletsComplete = function (e) {
                Ti.API.debug('onGetPortletsComplete with responseHeader: ' + layoutClient.getResponseHeader('Content-Type'));
                
                var responseXML, nativeModules = app.UPM.getLocalModules();
                
                if (layoutClient.responseXML == null) {
                    if (typeof DOMParser != "undefined") {
                        // Titanium Desktop 1.0 doesn't fill out responseXML.
                        // We'll use WebKit's XML parser...
                        responseXML = (new DOMParser()).parseFromString(layoutClient.responseText, "text/xml");
                    } 
                    else {
                        // Titanium Mobile 1.3 doesn't fill out responseXML on Android.
                        // We'll use Titanium's XML parser...
                        responseXML = Titanium.XML.parseString(layoutClient.responseText);
                    }
                } 
                else {
                    responseXML = layoutClient.responseXML;
                }

                layoutText = responseXML.getElementsByTagName('json-layout').item(0).text;

                portlets = JSON.parse(layoutText).layout;
                var module;
                for (module in nativeModules) {
                    if (nativeModules.hasOwnProperty(module)) {
                        nativeModules[module].added = false;
                    }
                }
                for (var i = 0, iLength = portlets.length; i<iLength; i++ ) {
                    
                    if(nativeModules[portlets[i].fname]) {
                        Ti.API.info("We have a match for " + portlets[i].fname + ", and it is: " + JSON.stringify(nativeModules[portlets[i].fname]));
                        portlets[i] = nativeModules[portlets[i].fname];
                        nativeModules[portlets[i].fname].added = true;
                    }
                }
                
                for (module in nativeModules) {
                    if (nativeModules.hasOwnProperty(module)) {
                        Ti.API.info("Remaining module: " + JSON.stringify(nativeModules[module]));
                        if(nativeModules[module].title && !nativeModules[module].added && !nativeModules[module].doesRequireLayout) {
                            // As long as the module has a title, hasn't already been added, and doesn't 
                            // require the fname for the module to be returned in the personalized layout.
                            portlets.push(nativeModules[module]);
                        }
                        else {
                            Ti.API.debug("Ignoring this prototype artifact in nativeModules: " + JSON.stringify(nativeModules[module]));
                        }                        
                    }
                }
                
                portlets.sort(sortPortlets);

                // uPortal 3.2 isn't capable of sending the layout as JSON, so the response
                // will be an XML document with the appropriate JSON contained in a 
                // "json-layout" element.  Parse this element as JSON and use the data 
                // array as the initial module list.
                // Ti.API.debug("layoutClient XML: " + JSON.stringify(layoutClient.responseXML));

                Ti.App.fireEvent('PortalProxyPortletsLoaded', {user: JSON.parse(layoutText).user});
            };

            onGetPortletsError = function (e) {
                Ti.App.fireEvent("PortalProxyNetworkError", {message: app.localDictionary.couldNotConnectToPortal});
            };

        // Send a request to uPortal's main URL to get a JSON representation of the
        // user layout
        layoutUrl = app.UPM.BASE_PORTAL_URL + app.UPM.PORTAL_CONTEXT;
        layoutClient = Titanium.Network.createHTTPClient({
            onload: onGetPortletsComplete,
            onerror: onGetPortletsError
        });
        layoutClient.open('GET', layoutUrl, true);
        layoutClient.send();
    };
    
    self.getPortletsForUser = function() {
        var _portlets;

        Ti.App.fireEvent('PortalProxyGettingPortlets');

        // Get the module list for this user from the portal server and create a 
        // layout based on this list.
        _portlets = loadPortletList();
    };
    
    init();
    
    return self;
};