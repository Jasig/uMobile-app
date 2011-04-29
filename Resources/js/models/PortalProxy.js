var PortalProxy = function (facade) {
    var app = facade, self = {}, portlets, getPortletsForUser, getShowPortletFunc, sortPortlets, 
        pathToRoot = '../../';
    
    self.getShowPortletFunc = function (portlet) {
        return function () {
            if (portlet.url) {
                Titanium.App.fireEvent('showPortlet', portlet);
            } 
            else {
                Titanium.App.fireEvent(
                    'showWindow', 
                    {
                        oldWindow: 'home',
                        newWindow: portlet.window
                    }
                );
            }
        };
    };
    
    self.getPortlets = function () {
        return portlets;
    };
    
    sortPortlets = function(a, b) {

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
        Ti.API.debug("Getting icon url for: " + JSON.stringify(p));
        var _iconUrl;
        
        if (app.models.resourceProxy.getPortletIcon(p.fname)) {
            Ti.API.debug("getNativeIcon returns icon for " + p.fname);
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
    
    /**
     * This method is currently blocking.
     */
    getPortletList = function() {
        Ti.API.debug('getPortletList');
        var layoutUrl, layoutClient, layoutText,
            onRequestComplete, onRequestError, onGetPortletsComplete, onGetPortletsError;

            onGetPortletsComplete = function (e) {
                Ti.API.debug('onGetPortletsComplete with responseHeader: ' + layoutClient.getResponseHeader('Content-Type'));
                Ti.API.debug('ResponseText is' + layoutClient.responseText);
                
                var responseXML;
                
                if (layoutClient.responseXML == null) {
                    if (typeof DOMParser != "undefined") {
                        // Titanium Desktop 1.0 doesn't fill out responseXML.
                        // We'll use WebKit's XML parser...
                        responseXML = (new DOMParser()).parseFromString(layoutClient.responseText, "text/xml");
                    } else {
                        // Titanium Mobile 1.3 doesn't fill out responseXML on Android.
                        // We'll use Titanium's XML parser...
                        responseXML = Titanium.XML.parseString(layoutClient.responseText);
                    }
                } else {
                    responseXML = layoutClient.responseXML;
                }

                layoutText = responseXML.getElementsByTagName('json-layout').item(0).text;

                portlets = JSON.parse(layoutText).layout;

                // Add locally-configured modules to the module list.
                for (var i = 0; i < app.UPM.LOCAL_MODULES.length; i++) {
                    portlets.push(app.UPM.LOCAL_MODULES[i]);
                }
                
                portlets.sort(sortPortlets);

                // uPortal 3.2 isn't capable of sending the layout as JSON, so the response
                // will be an XML document with the appropriate JSON contained in a 
                // "json-layout" element.  Parse this element as JSON and use the data 
                // array as the initial module list.
                // Ti.API.debug("layoutClient XML: " + JSON.stringify(layoutClient.responseXML));

                Ti.App.fireEvent('PortalProxyPortletsLoaded');
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
    
    self.getPortletsForUser = function(onload) {
        var _portlets;

        Ti.App.fireEvent('PortalProxyGettingPortlets');

        // Get the module list for this user from the portal server and create a 
        // layout based on this list.
        _portlets = getPortletList();
        app.lastUpdate = new Date();
    };
    
    return self;
};