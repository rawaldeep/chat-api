const express = require('express');
const request = require('request');
const RiveScript = require('rivescript');

const app = express();
const PORT = process.env.PORT || 3000;

// Create a new RiveScript bot and load the replies

const bot = new RiveScript();
bot.loadDirectory('./brain').then(() => bot.sortReplies());


app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.send('Invalid verify token');
  }
});

app.post('/webhook', express.json(), (req, res) => {
  const { body } = req;
  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const webhookEvent = entry.messaging[0];
      const senderId = webhookEvent.sender.id;
      const messageText = webhookEvent.message.text;

      // Reply to the received message using RiveScript
      const reply = bot.reply('user', messageText);

      // Send the reply back to the user
      sendMessage(senderId, reply);
    });
    res.sendStatus(200);
  }
});

function sendMessage(recipientId, message) {
  request({
    uri: 'https://graph.facebook.com/v14.0/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: {
      recipient: { id: recipientId },
      message: { text: message }
    }
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      console.log('Message sent successfully');
    } else {
      console.error('Error sending message:', error);
    }
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
