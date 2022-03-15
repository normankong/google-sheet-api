"use strict";

const fs = require("fs");
const { google } = require("googleapis");
const tokenHelper = require("./modules/tokenHelper.js");
const { trimObjectSpace } = require("./modules/sheetHelper.js");

const TOKEN_PATH = "token.json";

let credentials = null;
let refreshToken = null;

fs.readFile("credentials.json", "utf8", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);

  credentials = JSON.parse(content);

  fs.readFile(TOKEN_PATH, "utf8", (err, content) => {
    if (err) {
      console.log(err);
      return err;
    }

    refreshToken = JSON.parse(content);
  });
});

/**
 * Entry point to proceed the sheet operation
 */
exports.sheet = (req, res) => {
  switch (req.method) {
    case "GET":
      handleToken(req, res, () => {
        readSheet(req, res);
      });
      break;
    case "POST":
      handleToken(req, res, () => {
        insertSheet(req, res);
      });
      break;
    case "DELETE":
      handleToken(req, res, () => {
        deleteSheet(req, res);
      });
      break;
  }
};

const handleToken = (req, res, callback) => {
  // Refresh the Token if it is expired
  if (refreshToken.expiry_date < Date.now()) {
    console.log("Token is required to refesh");
    tokenHelper.refreshToken(refreshToken, credentials, (err, token) => {
      if (err) return res.end(err);
      refreshToken = token;
      callback();
    });
  } else {
    callback();
  }
};

/**
 * Utility to initialize the Sheets API
 */
const getSheets = () => {
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  const auth = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  auth.setCredentials(refreshToken);

  return google.sheets({ version: "v4", auth });
};

/**
 * Perform to read the sheet.
 */
const readSheet = (req, res) => {

  let [spreadsheetId, sheetNo] = extractRequest(req);

  const sheets = getSheets();

  readSheetProperties(sheets, spreadsheetId)
    .then((sheetInfo) => {
      let row = sheetInfo[sheetNo].properties.gridProperties.rowCount;
      let col = sheetInfo[sheetNo].properties.gridProperties.columnCount;
      let range = `R1C1:R${row}C${col}`;

      sheets.spreadsheets.values.get(
        { spreadsheetId, range },
        (err, result) => {
          if (err) return console.log("The API returned an error: " + err);

          const rows = result.data.values;

          if (rows.length <= 1) {
            return res.send({});
          }

          if (rows.length) {
            let headerRow = rows.shift().map((cell) => cell.trim());

            let response = rows.map((row) => {
              let tmp = {};
              row.map((cell, index) => {
                tmp[headerRow[index]] = cell;
              });
              return tmp;
            });

            res.json(response);
          }
        }
      );
    })
    .catch((err) => {
      res.send(err);
    });
};

/**
 * Perform Insertion on the sheet.
 */
const insertSheet = (req, res) => {
  let [spreadsheetId, sheetNo, body] = extractRequest(req);

  const sheets = getSheets();

  readSheetProperties(sheets, spreadsheetId).then((sheetInfo) => {
    readHeader(sheets, sheetInfo, spreadsheetId, sheetNo, (err, header) => {
      if (err) return res.send(err);

      let insertData = body.map((row) => {
        let dataRow = header.map((element) =>
          row[element] ? row[element] : ""
        );
        return dataRow;
      });

      writeSheet(sheets, sheetInfo, spreadsheetId, sheetNo, insertData)
        .then((x) => res.json(x.data))
        .catch((err) => res.send(err));
    });
  });
};

/**
 * Perform Delettion from the hseet
 */
const deleteSheet = (req, res) => {
  let [spreadsheetId, sheetNo, _, rowNo] = extractRequest(req);

  const sheets = getSheets();

  sheets.spreadsheets.batchUpdate(
    {
      spreadsheetId,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetNo,
                dimension: "ROWS",
                startIndex: rowNo,
                endIndex: rowNo + 1,
              },
            },
          },
        ],
      },
    },
    (err, result, reply) => {
      if (err) return res.send(err);
      res.json(result.status);
    }
  );
};

const readSheetProperties = (sheets, spreadsheetId) => {
  return new Promise((resolve, reject) => {
    sheets.spreadsheets.get({ spreadsheetId }, (err, result) => {
      if (err) return reject(err);
      return resolve(result.data.sheets);
    });
  });
};

const readHeader = (sheets, sheetInfo, spreadsheetId, sheetNo, cb) => {
  let row = sheetInfo[sheetNo].properties.gridProperties.rowCount;
  let col = sheetInfo[sheetNo].properties.gridProperties.columnCount;
  let range = `R1C1:R${row}C${col}`;

  sheets.spreadsheets.values.get({ spreadsheetId, range }, (err, result) => {
    if (err) return cb(err, null);

    const rows = result.data.values;
    if (!rows.length) return cb(null, []);

    // Trim the Header space
    const header = rows[0].map((cell) => cell.trim());
    return cb(null, header);
  });
};

const writeSheet = (sheets, sheetInfo, spreadsheetId, sheetNo, values) => {
  let row = sheetInfo[sheetNo].properties.gridProperties.rowCount;
  let col = sheetInfo[sheetNo].properties.gridProperties.columnCount;
  let range = `R1C1:R${row}C${col}`;

  return new Promise((resolve, reject) => {
    sheets.spreadsheets.values.append(
      {
        spreadsheetId,
        range,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: { values },
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

const extractRequest = (req) => {
  let params = req.params[0].split("/");
  let spreadsheetId = params[0];
  let sheetId = params[1] || 0;
  let body = trimObjectSpace(req.body);
  let rowNo = parseInt(req.query.rowNo, 10);
  return [spreadsheetId, sheetId, body, rowNo];
};
