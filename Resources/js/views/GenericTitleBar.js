Ti.include('config.js');

var GenericTitleBar = function (opts) {
    var title,
        titleBar = Titanium.UI.createView({
        top: opts.top || 0,
        left: opts.left || 0,
        height: opts.height || 50,
        width: Titanium.Platform.displayCaps.platformWidth,
        backgroundGradient: UPM.GLOBAL_STYLES.titleBarGradient
    });
    if (opts.title) {
        title = Titanium.UI.createLabel({
            textAlign: "center",
            text: opts.title,
            color: "#fff",
            font: { fontWeight: "bold" }
        });
        titleBar.add(title);
    }
    if (opts.backButton) {
        //Expects a view object
        
    }
    if (opts.homeButton) {
        //Expects homeButton to be a boolean indicating whether or not to show the home button
        
    }
    if (opts.settingsButton) {
        //Expects settingsButton to be a boolean indicating whether or not to show the settings icon
        
    }
    
    return titleBar
}