const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const screenshotmachine = require('screenshotmachine');

const TOKEN_PATH = 'token.json';
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const websites = {
  '1_iFunded.jpg': 'https://ifunded.de/en/',
  '2_PropertyPartner.jpg': 'https://www.propertypartner.co',
  '3_PropertyMoose.jpg': 'https://propertymoose.co.uk',
  '4_Homegrown.jpg': 'https://www.homegrown.co.uk',
  '5_RealtyMogul.jpg': 'https://www.realtymogul.com'
};


function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, websites);
  });
}

function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

function createAndUploadFile(auth, websites){
  for (const [key, value] of Object.entries(websites)) {

    const drive = google.drive({version: 'v3', auth});
    const fileMetadata = {
      'name': `${key}`,
      'parents': ['1cop3ckyogr9HfA6HP9L9bQWf9GeIJdJH']
    }
    let media = {
      mimeType: 'image/jpeg',
      body:fs.createReadStream('screenshots/'+`${key}`)
    }
    drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    }, (err, file) => {
      if (err) {
        console.error(err);
      } else {
        console.log('File Id: ', file.data.id);
      }
    });

  }
}

function takeScreenshot(filename, website){
  return new Promise((resolve, reject) => {
    var customerKey = '2b01be';
        secretPhrase = '';
        options = {
          url : website,
          dimension : '1920x1080',
          device : 'desktop',
          format: 'jpg',
          cacheLimit: '0',
          delay: '200',
          zoom: '100'
        }

    var apiUrl = screenshotmachine.generateScreenshotApiUrl(customerKey, secretPhrase, options);
    var output = 'screenshots/'+`${filename}`;
    try {
      screenshotmachine.readScreenshot(apiUrl).pipe(fs.createWriteStream(output).on('close', function() {
        resolve('Screenshot saved as ' + filename);
      }));
    } catch (err) {
      reject(err);
    }
  })
}

function uploadImages(){
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    authorize(JSON.parse(content), createAndUploadFile);
  });
}

async function casestudy(){
  try {
    for (const [key, value] of Object.entries(websites)) {
      var result = await takeScreenshot(`${key}`, `${value}`);
      console.log(result);
    }
    uploadImages();
  } catch (err) {
    console.log(err);
  }
}


casestudy();
