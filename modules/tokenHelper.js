'use strict';
const request = require("request");

/**
 * Function to refresh the Access Token.
 * 
 * @param {JSON} token is the entire token that generated per customer
 * @param {JSON} credentials is credential of the application after google cloud application registration
 * @param {Function} cb(err, updatedToken, response);
 */
exports.refreshToken = function (token, credentials, cb) {
  request.post(
    "https://accounts.google.com/o/oauth2/token",
    {
      form: {
        refresh_token: token.refresh_token,
        client_id: credentials.installed.client_id,
        client_secret: credentials.installed.client_secret,
        grant_type: "refresh_token",
      },
      json: true,
    },
    function (err, res, body) {
      if (err) return cb(err, body, res);
      if (parseInt(res.statusCode / 100, 10) !== 2) {
        if (body.error) {
          return cb(
            new Error(
              res.statusCode + ": " + (body.error.message || body.error)
            ),
            body,
            res
          );
        }
        if (!body.access_token) {
          return cb(
            new Error(res.statusCode + ": refreshToken error"),
            body,
            res
          );
        }
        return cb(null, body, res);
      }

      // Create the new Token
      let newToken = JSON.parse(JSON.stringify(token));
      newToken.access_token = body.access_token;
      newToken.expiry_date = (new Date()).getTime() + parseInt(body.expires_in, 10) * 1000;

      cb(null, newToken, res);
    }
  );
}

/**
 * Optional function to check the Token validitiy.
 * 
 * @param {String} token is the token that generated per customer
 * @param {Function} cb(err, isValid, res);
 */
exports.checkToken = function (token, cb) {
  tokenJSON = JSON.parse(token);

  request(
    {
      url: tokenJSON.scope,
      headers: {
        Authorization: `${tokenJSON.token_type}: ${tokenJSON.access_token}`,
      },
    },
    function (err, res, json) {
      if (err) return cb(err, json, res);
      cb(null, !json.error, res);
    }
  );
};
