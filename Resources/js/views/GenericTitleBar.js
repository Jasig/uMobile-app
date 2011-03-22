// Ti.include('config.js');

var GenericTitleBar = function (opts) {
    //Required: opts.app, opts.windowKey
    //Optional attributes include top, left, height, title, homeButton (bool), backButton (View), settingsButton (bool)
    var title,
        backButton,
        homeButton,
        settingsButton,
        titleBar = Titanium.UI.createView({
            // top: opts.top || 0,
            // left: opts.left || 0,
            // height: opts.height || opts.app.UPM.TITLEBAR_HEIGHT,
            width: Titanium.Platform.displayCaps.platformWidth,
            // backgroundGradient: opts.app.UPM.GLOBAL_STYLES.titleBarGradient,
            className: 'titleBar'
        });
    if (opts.title) {
        //Places the title in the center of the titlebar...
        
        title = Titanium.UI.createLabel({
            text: opts.title,
            className: 'titleBarLabel'
        });
        titleBar.add(title);
    }
    if (opts.backButton) {
        //This adds a button at the left of the title bar, presumably to go back to a previous view. Not limited to that, as there are no event listeners added here.
        //Expects a view object.
        //There should only be either a home button or backbutton, not both.
        backButton = opts.backButton;
        titleBar.add(backButton);
        
        //Manually add gradient changes for button toggle
        backButton.addEventListener("touchstart",function(e){
            e.source.backgroundGradient = opts.app.UPM.GLOBAL_STYLES.titleBarGradient;
        });
        backButton.addEventListener("touchend",function(e){
            e.source.backgroundGradient = opts.app.UPM.GLOBAL_STYLES.titleBarButtonGradient;
        });
    }
    if (opts.homeButton && !opts.backButton) {
        //Expects homeButton to be a boolean indicating whether or not to show the home button
        //There shouldn't be a home button and back button, as then the bar just gets too cluttered. Back button wins in a fight.
        homeButton = Titanium.UI.createImageView({
            image: opts.app.UPM.getResourcePath("icons/tab-home.png"),
            width: 18,
            height: 18,
            left: 10
        });
        titleBar.add(homeButton);
        
        homeButton.addEventListener('singletap', function() {
            Ti.App.fireEvent(
                'showWindow', 
                {
                    oldWindow: opts.windowKey,
                    newWindow: 'home'
                }
            );
        });
    }
    if (opts.settingsButton) {
        //Expects settingsButton to be a boolean indicating whether or not to show the settings icon
        settingsButton = Titanium.UI.createImageView({
    	    height: 18,
    	    width: 18,
    	    image: opts.app.UPM.getResourcePath("icons/tab-settings.png"),
    	    left: Ti.Platform.displayCaps.platformWidth - 28
    	});
    	titleBar.add(settingsButton);
    	
    	settingsButton.addEventListener('singletap', function (e) {
            Ti.App.fireEvent(
                'showWindow', 
                {
                    oldWindow: 'home',
                    newWindow: 'settings',
                    transition: Titanium.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT 
                }
            );
        });
    }

    return titleBar;
};