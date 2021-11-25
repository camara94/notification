//Express
const express = require('express');

//web-push
const webpush = require('web-push');

//body-parser
const bodyParser = require('body-parser');

//path
const path = require('path');

//using express 
const app = express();

//using bodyparser
app.use(bodyParser.json())


//storing the keys in variables
const publicVapidKey = 'BEj-rR1YmLL0JUZkRca8nXW10WmU21Dg2jnBAVj8JXS3fz91LHXpE6S6qKp2RuG8A3nrB3eUXYb7SPWNw284gUs';
const privateVapidKey = 'VFiwDJSeCH5sMqZIn0Llc2qcJkepdC0m9ABNTpzwSkc';

//setting vapid keys details
webpush.setVapidDetails('mailto:ldamaro98@gmail.com', publicVapidKey,privateVapidKey);

//subscribe route
app.post('/subscribe', (req, res)=>{
    //get push subscription object from the request
    const subscription = req.body;

    //send status 201 for the request
    res.status(201).json({})

    //create paylod: specified the detals of the push notification
    const payload = JSON.stringify({title: 'stardevcgroup.com Push Notification' });

    //pass the object into sendNotification fucntion and catch any error
    webpush.sendNotification(subscription, payload).catch(err=> console.error(err));
})

//set the static path 
app.use(express.static(path.join(__dirname, "client")));

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}    

//check if the serveice worker can work in the current browser
if('serviceWorker' in navigator){
    send().catch(err => console.error(err));
}

//register the service worker, register our push api, send the notification
async function send(){
    //register service worker
    const register = await navigator.serviceWorker.register('/worker.js', {
        scope: '/'
    });

    //register push
    const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,

        //public vapid key
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });
   
    //Send push notification
    await fetch("/subscribe", {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: {
            "content-type": "application/json"
        }
    });
}

self.addEventListener("push", e => {
    const data = e.data.json();
    self.registration.showNotification(
        data.title, // title of the notification
        {
            body: "Push notification from section.io", //the body of the push notification
            image: "https://pixabay.com/vectors/bell-notification-communication-1096280/",
            icon: "https://pixabay.com/vectors/bell-notification-communication-1096280/" // icon 
        }
    );
});

const port = 3000;
app.listen(port, ()=>{
    console.log(`server started on ${port}`)
});