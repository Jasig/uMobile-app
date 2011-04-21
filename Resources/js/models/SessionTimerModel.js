var SessionTimerModel = function (facade) {
    var app = facade, self = {}, sessionLifeTimeMilli, init;
    
    init = function () {
        //Gets the session expiration time from the config in seconds,
        //converts to milliseconds for use in the setTimeout
        Ti.API.info("Constructing SessionTimerModel. Config value for SERVER_SESSION_TIMEOUT is " + app.UPM.SERVER_SESSION_TIMEOUT + "& type is: " + typeof app.UPM.SERVER_SESSION_TIMEOUT);
        sessionLifeTimeMilli = app.UPM.SERVER_SESSION_TIMEOUT * 1000;
    };
    
    self.createSessionTimer = function (context) {
        var timer = {}, counter;
        timer.context = context;
        
        function onTimeout () {
            Ti.API.info("SessionTimerExpired" + context);
            Ti.App.fireEvent("SessionTimerExpired", {context: context});
            clearTimeout(counter);
        };
        
        timer.reset = function () {
            Ti.API.info("Reset the timer for: " + context + " & timer= " + sessionLifeTimeMilli);
            if(counter) {
                clearTimeout(counter);
            }
            counter = setTimeout(onTimeout, parseInt(sessionLifeTimeMilli, 10));
        };
        
        timer.stop = function () {
            Ti.API.info("SessionTimerModel.stop() for: " + context);
            if(counter) {
                clearTimeout(counter);
            }
        };
        
        return timer;
    };
    
    init();
    
    return self;
};