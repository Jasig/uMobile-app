//This is a non-functioning interface, only here to provide
// a reference to the public methods required for a Login Method
var ILoginMethod = function () {
    this.login = function (credentials, options) {
        //This method establishes a session, and has event handlers to fire success or failure events
        //The credentials will be { username: string, password: string }
        //Options might contain isUnObtrusive:bool, which will tell the login method not to broadcast an event on success, only on failure.
    };
    
    this.getLoginURL = function (strURL) {
        //This method takes in a URL and returns a URL that will either 
        // * Automatically log them in and redirect them to the provided url OR
        // * Let them manually log in, and then redirect them to the provided url
    };
};