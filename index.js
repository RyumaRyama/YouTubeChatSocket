const fs = require('fs')
const path = require('path')
const axios = require('axios');

// 接続先配信
const channelUrl = fs.readFileSync(path.resolve(__dirname, './channelUrl'), 'utf8');

// websocketポート設定
const port = parseInt(fs.readFileSync(path.resolve(__dirname, 'port'), 'utf8'));

// 配信に接続
axios(channelUrl).then(res => {
  // youtube-chatでの取得初期化
  const { LiveChat } = require("./dist/index");
  const channelId = res.data.match(/<meta itemprop="channelId" content="(.+?)">/)[1];

  // チャット情報のwebsocket配信
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ port: port });
  const liveChat = new LiveChat({channelId: channelId});
  liveChat.on('start', chatItem => {
    console.log('start');
    console.log(chatItem);
  });
  liveChat.on('error', error => {
    console.log(error);
  });
  liveChat.start();

  wss.on('connection', ws => {
    liveChat.on('chat', chatItem => {
      const data = {
        type: 'chat',
        body: chatItem,
      }

      if (chatItem.superchat) {
        if (chatItem.superchat.sticker) {
          data.type = 'super-sticker';
        } else {
          data.type = 'super-chat';
        }
      } else if (chatItem.isMilestone) {
        data.type = 'milestone';
      }

      console.log(JSON.parse(JSON.stringify(data)));
      ws.send(JSON.stringify(data));
    });
  });
});
