/**
 * Firebase Cloud Messaging (FCM) can be used to send messages to clients on iOS, Android and Web.
 *
 * This sample uses FCM to send two types of messages to clients that are subscribed to the `news`
 * topic. One type of message is a simple notification message (display message). The other is
 * a notification message (display notification) with platform specific customizations. For example,
 * a badge is added to messages that are sent to iOS devices.
 */
 const https = require('https');
 const { google } = require('googleapis');
 const functions = require('firebase-functions');
 const admin = require('firebase-admin');
 
 const PROJECT_ID = 'notification-7e2dd';
 const HOST = 'fcm.googleapis.com';
 const PATH = '/v1/projects/' + PROJECT_ID + '/messages:send';
 const MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
 const SCOPES = [MESSAGING_SCOPE];

 admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://notification-7e2dd-default-rtdb.firebaseio.com'
});

exports.addMessage = functions.https.onRequest((req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push it into the Realtime Database then send a response
  admin.database().ref('/messages').push({ original: original }).then(snapshot => {
      // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
      res.redirect(303, snapshot.ref);
  });
});

exports.makeUppercase = functions.database.ref('/messages/{pushId}/original')
    .onCreate((snapshot, context) => {
      // Grab the current value of what was written to the Realtime Database.
      const original = snapshot.val();
      functions.logger.log('Uppercasing', context.params.pushId, original);
      const uppercase = original.toUpperCase();
      // You must return a Promise when performing asynchronous tasks inside a Functions such as
      // writing to the Firebase Realtime Database.
      // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
      return snapshot.ref.parent.child('uppercase').set(uppercase);
    });
 
 /**
  * Get a valid access token.
  */
 // [START retrieve_access_token]
 function getAccessToken() {
   return new Promise(function(resolve, reject) {
     const key = require('C:/Users/damaro/firebase/notification-7e2dd-firebase-adminsdk-ks8wd-19bcdb5cdf.json');
     const jwtClient = new google.auth.JWT(
       key.client_email,
       null,
       key.private_key,
       SCOPES,
       null
     );
     jwtClient.authorize(function(err, tokens) {
       if (err) {
         reject(err);
         return;
       }
       resolve(tokens.access_token);
     });
   });
 }
 // [END retrieve_access_token]
 
 /**
  * Send HTTP request to FCM with given message.
  *
  * @param {object} fcmMessage will make up the body of the request.
  */
 function sendFcmMessage(fcmMessage) {
   getAccessToken().then(function(accessToken) {
     const options = {
       hostname: HOST,
       path: PATH,
       method: 'POST',
       // [START use_access_token]
       headers: {
         'Authorization': 'Bearer ' + accessToken
       }
       // [END use_access_token]
     };
 
     const request = https.request(options, function(resp) {
       resp.setEncoding('utf8');
       resp.on('data', function(data) {
         console.log(options);
         console.log('Message sent to Firebase for delivery, response:');
         console.log(data);
       });
     });
 
     request.on('error', function(err) {
       console.log('Unable to send message to Firebase');
       console.log(err);
     });
 
     request.write(JSON.stringify(fcmMessage));
     request.end();
   });
 }
 
 /**
  * Construct a JSON object that will be used to customize
  * the messages sent to iOS and Android devices.
  */
 function buildOverrideMessage() {
   const fcmMessage = buildCommonMessage();
   const apnsOverride = {
     'payload': {
       'aps': {
         'badge': 1
       }
     },
     'headers': {
       'apns-priority': '10'
     }
   };
 
   const androidOverride = {
     'notification': {
       'click_action': 'android.intent.action.MAIN'
     }
   };
 
   fcmMessage['message']['android'] = androidOverride;
   fcmMessage['message']['apns'] = apnsOverride;
 
   return fcmMessage;
 }
 
 /**
  * Construct a JSON object that will be used to define the
  * common parts of a notification message that will be sent
  * to any app instance subscribed to the news topic.
  */
 function buildCommonMessage() {
   return {
     'message': {
       'topic': 'news',
       'notification': {
         'title': 'FCM Notification',
         'body': 'Notification from FCM'
       }
     }
   };
 }
 
 const message = process.argv[2];
 if (message && message == 'common-message') {
   const commonMessage = buildCommonMessage();
   console.log('FCM request body for message using common notification object:');
   console.log(JSON.stringify(commonMessage, null, 2));
   sendFcmMessage(buildCommonMessage());
 } else if (message && message == 'override-message') {
   const overrideMessage = buildOverrideMessage();
   console.log('FCM request body for override message:');
   console.log(JSON.stringify(overrideMessage, null, 2));
   sendFcmMessage(buildOverrideMessage());
 } else {
   console.log('Invalid command. Please use one of the following:\n'
       + 'node index.js common-message\n'
       + 'node index.js override-message');
 }

 