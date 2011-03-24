var SecondaryNavBar = function (facade, opts) {
    //Used to generate secondary navigation bar to be displayed inside various windows in the application beneath the main title bar (GenericTitleBar)
    var self = {},
        app = facade;
    
    function init () {
        if(opts.style) {
            Ti.API.debug("opts.style defined in SecondaryNavBar");
            self = Titanium.UI.createView(style);
        }
        else {
            Ti.API.debug("opts.style not defined in SecondaryNavBar, will create with style: " + app.styles.secondaryNavBar);
            self = Titanium.UI.createView(app.styles.secondaryNavBar);
        }

        if(opts.backButton) {
            self.add(opts.backButton);
        }
    }
    
    init();
    
    return self;
};