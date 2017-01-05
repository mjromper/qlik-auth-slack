var OAuth = require('oauth'),
    https = require('https');

var endpoint = {
    "authority": "https://slack.com",
    "authorize_endpoint": "/oauth/authorize",
    "token_endpoint": "/api/oauth.access",
    "scope": "users.profile:read groups:read team:read",
    "state": "qlikslack1234abcd",
    "redirectUriPath": "/oauth2callback",
    "slackApiUri": "slack.com"
};

/**
 * Gets a token for a given resource.
 * @param {string} code An authorization code returned from a client.
 * @param {AcquireTokenCallback} callback The callback function.
 */
function getTokenFromCode( code, state, reqUrl, settings, callback ) {

    if ( state !== endpoint.state ) {
        callback({"error": "state not valid"}, null, null);
        return;
    }

    var OAuth2 = OAuth.OAuth2;
    var oauth2 = new OAuth2(
        settings.client_id,
        settings.client_secret,
        endpoint.authority,
        endpoint.authorize_endpoint,
        endpoint.token_endpoint
    );

    oauth2.getOAuthAccessToken(
        code,
        {
            redirect_uri: reqUrl + endpoint.redirectUriPath
        },
        function (e, accessToken) {
            callback(e, accessToken);
        }
    );
}

/**
 * Gets Slack login url
 */
function getAuthUrl( reqUrl, settings ) {
    var url = endpoint.authority + endpoint.authorize_endpoint +
        "?client_id=" + settings.client_id +
        "&redirect_uri=" + reqUrl + endpoint.redirectUriPath +
        "&scope=" + endpoint.scope +
        "&state=" + endpoint.state;

    if ( settings.slack_team ) {
        url += "&team=" + settings.slack_team;
    }

    return url;
}

/**
 * Gets userId from user data in Slack.
 * @param {string} accessToken
 * @param {Callback} callback The callback function.
 */
function getUserGroups( accessToken, callback ) {
    _request( {
        path: "/api/groups.list?token="+accessToken+"&pretty=1",
        method: "GET"
    }, callback );
}

function getUser( accessToken, callback ) {
    _request( {
        path: "/api/users.profile.get?token="+accessToken+"&pretty=1",
        method: "GET"
    }, callback );
}

/**
 * Gets userId from user data in Office 365.
 * @param {Object} options
 * @param {Callback} callback The callback function.
 */
function _request( options, callback ) {

    options.host = endpoint.slackApiUri;
    options.agent = options.agent || false;
    options.method = options.method || "GET";
    console.log("options", options);
    var req = https.request (options, function( response ) {
        var str = ''
        response.on( 'data', function (chunk) {
            str += chunk;
        });

        response.on( 'end', function () {
            callback( null, JSON.parse(str) );
        } );
    } );
    req.on( 'error', function (err) {
        callback( err, null );
    } );
    req.on( 'timeout', function () {
        // Timeout happend. Server received request, but not handled it
        // (i.e. doesn't send any response or it took to long).
        // You don't know what happend.
        // It will emit 'error' message as well (with ECONNRESET code).
        req.abort();
        callback( "timeout", null );
    } );
    req.end();
}


// ------ LIB exports ------- //
exports.getAuthUrl = getAuthUrl;
exports.getTokenFromCode = getTokenFromCode;
exports.getUser = getUser;
exports.getUserGroups = getUserGroups;