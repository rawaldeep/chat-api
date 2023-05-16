const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Your verify token. Should be a random string.
let VERIFY_TOKEN = process.env.VERIFY_TOKEN

app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    console.log('Validating webhook');
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error('Failed validation. Make sure the validation tokens match.');
    res.sendStatus(403);          
  }  
});

app.post('/webhook', (req, res) => {
  let data = req.body;

  if (data.object === 'page') {
    data.entry.forEach((entry) => {
      let pageID = entry.id;
      let timeOfEvent = entry.time;

      entry.messaging.forEach((event) => {
        if (event.message) {
          receivedMessage(event);
        }
      });
    });
    res.sendStatus(200);
  }
});

function receivedMessage(event) {
  let senderID = event.sender.id;
  let recipientID = event.recipient.id;
  let timeOfMessage = event.timestamp;
  let message = event.message;

  let messageId = message.mid;
  let messageText = message.text;

  if (messageText) {
    sendTextMessage(senderID, "Echo: " + messageText);
  }
}

function sendTextMessage(recipientId, messageText) {
  let messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData
  }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      console.log("Successfully sent message");
    } else {
      console.error("Unable to send message");
      console.error(response);
      console.error(error);
    }
  });  
}

app.listen(process.env.PORT || 3000, () => console.log('Webhook server is listening, port 3000'));