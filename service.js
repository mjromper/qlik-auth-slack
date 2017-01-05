var express = require('express'),
    app = express(),
    fs = require('fs'),
    https = require("https"),
    //http = require("http"),
    qlikAuth = require('qlik-auth'),
    slack = require('./slack.js');

var settings = {};
var arg = process.argv.slice(2);

arg.forEach( function(a) {
    var key = a.split("=");
    switch( key[0] ) {
      case "user_directory":
        settings.directory = key[1];
        break;
      case "client_id":
        settings.client_id = key[1];
        break;
      case "client_secret":
        settings.client_secret = key[1];
        break;
      case "auth_port":
        settings.port = key[1];
        break;
      case "slack_team":
        settings.slack_team = key[1];
        break;
  }
} );

app.get('/', function ( req, res ) {
    //Init sense auth module
    qlikAuth.init(req, res);
    //Redirect to Office 365 Auth url

    var hostUrl = req.protocol+"://"+req.get('host');
    res.redirect( slack.getAuthUrl(hostUrl, settings) );
});


app.get('/oauth2callback', function ( req, res ) {
    if ( req.query.code !== undefined && req.query.state !== undefined ) {
        var hostUrl = req.protocol+"://"+req.get('host');
        slack.getTokenFromCode( req.query.code, req.query.state, hostUrl, settings, function ( e, accessToken ) {
            if ( e ) {
                res.send( { "error": e } );
                return;
            } else {
                slack.getUser( accessToken, function( e1, user ) {

                    if ( e1 ) {
                        res.send( { "error": e1 } );
                        return;
                    }

                    var ticketReq = {
                        'UserDirectory': settings.directory,
                        'UserId': user.profile.email,
                        'Attributes': []
                    };

                    slack.getUserGroups( accessToken, function( e2, response ) {
                        if ( e2 ) {
                            res.send( { "error": e2 } );
                            return;
                        }
                        if ( response.groups ) {
                            ticketReq.Attributes = response.groups.map( function(g) {
                                return {"Group": g.name};
                            } );
                        }
                        qlikAuth.requestTicket( req, res, ticketReq );
                    });
                });
            }
        });
    } else {
        res.send( {"error": "missing code"} );
    }
});

var options = {
    key: fs.readFileSync( "C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\client_key.pem" ),
    cert: fs.readFileSync( "C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\client.pem" ),
};

//Server application
var server = https.createServer( options, app );
//var server = http.createServer( app );
server.listen( settings.port );
