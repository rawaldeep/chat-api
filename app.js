const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello, Facebook Messenger Chatbot!');
});

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.send('Invalid verify token');
  }
});

app.post('/webhook', (req, res) => {
  const { body } = req;
  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const webhookEvent = entry.messaging[0];
      const senderId = webhookEvent.sender.id;
      const messageText = webhookEvent.message.text;

      // Process the received message and send a reply
      const reply = processMessage(messageText);
      sendMessage(senderId, reply);
    });
    res.sendStatus(200);
  }
});

function processMessage(message) {
  // Process the message and generate a reply
  // Example logic: Echo back the received message
  return `You said: ${message}`;
}

function sendMessage(recipientId, message) {
  request({
    uri: 'https://graph.facebook.com/v14.0/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN  },
    method: 'POST',
    json: {
      recipient: { id: recipientId },
      message: { text: message }
    }
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      console.log('Message sent successfully');
    } else {
      console.error('Error sending message:', error, response, body);
    }
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
