# Google Sheet to API

## Introduction
This repo is inspired by [sheet.best](https://sheet.best/) that turns spreadsheets into REST APIs. Builds applications faster without worrying about a backend. 

This repo contains the 3 operations on Google Sheet API

| Operation      | Description |
| ----------- | ----------- |
| GET      | Read a given public sheet (or private sheet if you use your own credential)       |
| POST   | Insert new row to a given sheet        |
| DELETE   | Delete a row from a given sheet    |

## Usage
Sheet ID is optional
1) GET /SHEET_ID/SHEET_NO
2) POST /SHEET_ID/SHEET_NO
3) DELETE /SHEET_ID/SHEET_NO

## Deployment
Deploy it to cloud function, google cloud function require additional 2 credential files 
| File      | Description |
| ----------- | ----------- |
| credentials.json  | Application registration in order to enable the Google sheet API | 
| token.json | An OAuth token for access public google sheet |


```
# Create a zip modeule as json file will not be upload by gcloud function deploy
zip deploy.zip modules/* package* index.js credentials.json token.json

# Upload to Cloud Storage
gsutil cp deploy.zip gs://staging.gcp-api-00001.appspot.com/

# Trigger the deployment
gcloud functions deploy google-sheet-api --runtime nodejs16 --entry-point sheet --trigger-http --allow-unauthenticated --source=gs://staging.gcp-api-00001.appspot.com/deploy.zip
```

## Note
Never checkin credential / token file to GIT

## Reference

1. https://developers.google.com/sheets/api/guides/concepts
2. https://siddharth-shingate.medium.com/implementing-google-sheet-apis-using-node-js-with-basic-crud-operations-34aa17d3619
3. https://theoephraim.github.io/node-google-spreadsheet/
4. https://www.npmjs.com/package/google-spreadsheet

