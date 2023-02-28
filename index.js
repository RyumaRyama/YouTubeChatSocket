const fs = require('fs')
const path = require('path')
const axios = require('axios');

// websocketポート設定
const port = parseInt(fs.readFileSync(path.resolve(__dirname, 'port'), 'utf8'));

const ConnectionStart = (liveChat) => {
  // チャット情報のwebsocket配信
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ port: port });
  liveChat.on('start', chatItem => {
    const title = JSON.parse(chatItem).title;
    console.log('Start!!!');
    console.log(`Title: ${title}`);
  });
  liveChat.on('error', error => {
    fs.appendFileSync('error_log.txt', '--------------------------\n');
    fs.appendFileSync('error_log.txt', Date()+'\n');
    fs.appendFileSync('error_log.txt', error.toString() + '\n');
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

      ws.send(JSON.stringify(data));
    });
  });
};

// youtube-chatでの取得初期化
const { LiveChat } = require("./dist/index");

if ( fs.existsSync( path.resolve(__dirname, 'liveUrl') ) ){
  const liveUrl = fs.readFileSync(path.resolve(__dirname, 'liveUrl'), 'utf8');

  // 配信に接続
  axios(liveUrl).then(res => {
    const liveId = res.data.match(/<meta itemprop="videoId" content="(.+?)">/)[1];

    const liveChat = new LiveChat({liveId: liveId});

    ConnectionStart(liveChat);
  });
}
else {
  // 接続先配信
  const channelUrl = fs.readFileSync(path.resolve(__dirname, 'channelUrl'), 'utf8');

  // 配信に接続
  axios(channelUrl).then(res => {
    const channelId = res.data.match(/<meta itemprop="channelId" content="(.+?)">/)[1];

    const liveChat = new LiveChat({channelId: channelId});

    ConnectionStart(liveChat);
  });
}
