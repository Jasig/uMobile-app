var StartupCommand = function (facade) {
    var app = facade;
    Ti.API.debug("StartupCommand");
    
    // This will determine if a network session exists, and what 
    // window was open last time the app closed, and will manage the process
    // of establishing a session and opening the window.
    app.models.windowManager.openPreviousSessionWindow();
};
