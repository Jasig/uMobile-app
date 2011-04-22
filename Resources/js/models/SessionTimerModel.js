var SessionTimerModel = function (facade) {
    var app = facade, self = {}, sessionLifeTimeMilli, init;
    
    init = function () {
        //Gets the session expiration time from the config in seconds,
        //converts to milliseconds for use in the setTimeout
        sessionLifeTimeMilli = app.UPM.SERVER_SESSION_TIMEOUT * 1000;
    };
    
    self.createSessionTimer = function (context) {
        var session = {}, counter;
        session.context = context;
        session.isActive = false;
        
        function onTimeout () {
            Ti.API.info("SessionTimerExpired" + context);
            Ti.App.fireEvent("SessionTimerExpired", {context: context});
            clearTimeout(counter);
            session.isActive = false;
        };
        
        session.reset = function () {
            Ti.API.info("Reset the timer for: " + context + " & timer= " + sessionLifeTimeMilli);
            if(counter) {
                Ti.API.debug("counter variable defined, clearing timeout");
                clearTimeout(counter);
            }
            counter = setTimeout(onTimeout, parseInt(sessionLifeTimeMilli, 10));
            session.isActive = true;
        };
        
        session.stop = function () {
            Ti.API.info("SessionTimerModel.stop() for: " + context);
            if(counter) {
                clearTimeout(counter);
            }
            session.isActive = false;
        };
        
        return session;
    };
    
    init();
    
    return self;
};