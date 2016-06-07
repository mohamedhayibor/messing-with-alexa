var http = require('http');
var https = require('https');

exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

function getClosest(userLoc, intent, callback){
    var closest = null;
    var req = http.get('http://api.citybik.es/citi-bike-nyc.json', function(response) {
    response.setEncoding('utf-8');
    // Continuously update stream with data
    var body = '';
    response.on('data', function(d) {
      body += d.toString();
    });
    response.on('end', function() {
      // Data reception is done, do whatever with it!
      var parsed = JSON.parse(body);
      speechOutput = parsed;
      handleBikeResponse(parsed, userLoc, intent, callback);
    });
  });
}

function handleBikeResponse(bikeData, userLoc, intent, callback){
    var speechOutput = "I'm sorry I can't find a station near you";
    var closest = null;
    for (var i = 0; i < bikeData.length; i++) {
        try {
            var numBikes = bikeData[i]['bikes'];
            var lat = bikeData[i]['lat'];
            var lon = bikeData[i]['lng'];
            var name = bikeData[i]['name'];
            var nameClean = name.replace(/\d+\s-\s/, "");
            var dist = getDist(userLoc, lat, lon);
            if ((closest ===null || dist <closest.dist) && numBikes > 0)
            {
                closest = { numBikes:numBikes, name:nameClean,dist:dist};
            }
        }
        catch (e) {

        }
    }
    console.log(closest);
    if (closest !== null) {
        speechOutput = "The nearest station with available bikes is " + closest.name + " which has " + closest.numBikes + " bikes and is " +  (Math.round( closest.dist * 10 ) / 10) + " miles away";
    }
    callback({},
         buildSpeechletResponse(intent.name, speechOutput, null, true));
}

function getDist(userLoc, lat, lon) {
    var earth_radius = 6371;
    var userLat = userLoc[0] / Math.pow(10,6);
    var userLon = userLoc[1] / Math.pow(10,6);
    var stationLat = lat / Math.pow(10, 6);
    var stationLon = lon /Math.pow(10, 6);
    var pi =3.14159265359;

    var x1 = earth_radius*Math.cos(userLat*pi/180)*Math.cos(userLon*pi/180);
    var y1 = earth_radius*Math.cos(userLat*pi/180)*Math.sin(userLon*pi/180);
    var z1 = earth_radius*Math.sin(userLat*pi/180);

    var x2 = earth_radius*Math.cos(stationLat*pi/180)*Math.cos(stationLon*pi/180);
    var y2 = earth_radius*Math.cos(stationLat*pi/180)*Math.sin(stationLon*pi/180);
    var z2 = earth_radius*Math.sin(stationLat*pi/180);

    var xDif = x2-x1;
    var yDif = y2-y1;
    var zDif = z2-z1;

    var d = Math.sqrt(xDif*xDif + yDif*yDif + zDif*zDif);
    var dInMiles = d*0.621371;

    return dInMiles;
}

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("GetStationsIntent" === intentName) {
        setStationInSession(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        getWelcomeResponse(callback);
    } else if ("AMAZON.StopIntent" === intentName || "AMAZON.CancelIntent" === intentName) {
        handleSessionEndRequest(callback);
    } else if ("GetStation" === intentName)
    {
        getStation(intent, session, callback);
    }
}


function getStation(intent, session, callback) {
    var speechOutput = "I could not find any stations near you, sorry";
    var address = intent.value;
    console.log("address:" + address);
    var req = https.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + address,
    function(response){
        response.setEncoding('utf-8');
        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
          body += d.toString();
        });
        response.on('end', function() {
          // Data reception is done, do whatever with it!
          var parsed = JSON.parse(body);
          var firstResult = parsed["results"][0];
          var geometry = null;
          var lat = null;
          var lon = null;
          if (firstResult) {
              geometry = firstResult["geometry"];
              var location = geometry["location"];
              lat = location["lat"];
              lon = location["lng"];
          }
          console.log(parsed);
          console.log(geometry);
          console.log("lat: " + lat);
          console.log("lon: " + lon);
          var userLoc = [lat*Math.pow(10,6), lon*Math.pow(10,6)];
          getClosest(userLoc, intent, callback);
        });
    });
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Welcome to the Awesome Bike Share " +
        "Please tell me your station, so that I can provide you with number of available bikes and docks.";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please tell me your station, I didn't get your previous request";
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    var cardTitle = "Session Ended";
    var speechOutput = "Thank you for trying the Alexa Skills Kit sample. Have a nice day!";
    // Setting this to true ends the session and exits the skill.
    var shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

// refactor getFavAttr to getStationsAttr
function createStationAttributes(station) {
    return {
        station: station
    };
}

function getStationFromSession(intent, session, callback) {
    /// refactor code for closest station (swap favoriteColor)
    var station;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if (session.attributes) {
        station = session.attributes.station;
    }

    if ( station ) {
        speechOutput = "Your station is " + station + ". Have a safe ride.";
        shouldEndSession = true;
    } else {
        speechOutput = "I didn't get that quiet well, can you tell me the station again?";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
    callback(sessionAttributes,
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}

// --------------- Helpers that build all of the responses -----------------------
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
