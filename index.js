const prompt = require('prompt');
const XMPP = require('stanza');  


// keep it clean
process.stdout.write('\x1Bc')

// Just a horizontal line
const line = '-'.repeat(process.stdout.columns)
 
// Removes the Prompt and some other options
prompt.start();
prompt.message = '[XMPP LOGIN] ';
prompt.delimiter = '';
prompt.colors = false;
prompt.allowEmpty = false; 

// XMPP LOGIN
// Get two properties from the user: username and password masked

prompt.get([{
    // Prompt username and password variables
    name: 'username',
    message: 'Username:',
    required: true
  },
  {
    name: 'password',
    required: true,
    hidden: true,
    replace: '*',
    conform: function (value) {
      return true;
    },
    message: 'Password:'
  }], function (err, result) {
    

const client = XMPP.createClient({
    // Prompt input results for username and password
    jid: result.username,
    password: result.password,
    resource: 'stanza-login',
    sendReceipts: true,
    capsNode: ' ',
    softwareVersion: ' ',
    transports: {
	    websocket: 'wss://localhost:5443/ws',
    }

});

// Clears screen and exits when user puts incorrect username or password
client.on('auth:failed', function() {
  process.stdout.write('\x1Bc')
  const time = new Date().toLocaleTimeString();
  console.log('\n',time,'\x1b[31m','--- ERROR! ---' ,'\x1b[0m','\n');
  process.exit();
  });

// Lets the User know if a message was failed
client.on('message:failed', function() {
  process.stdout.write('\x1Bc')
  const time = new Date().toLocaleTimeString();
  console.log('\n',time,'\x1b[31m','--- ERROR! - Message Failed ---' ,'\x1b[0m','\n');
  });
  

// Clears screen after successful login
process.stdout.write('\x1Bc')
prompt.message = '';


// session
client.on('session:started', async (from, jid) => {
  
// keep it clean again...
process.stdout.write('\x1Bc')

console.log('\x1b[33m%s\x1b[0m', '--- XMPP Connection ---');
console.log('\x1b[1m\x1b[36m','signed in as:',from,'\x1b[0m','\n');

// Client goes offline if a user connects with the same resource
client.on('--transport-disconnected', function() {
  process.stdout.write('\x1Bc')
  const time = new Date().toLocaleTimeString();
  console.log('\n',time,'\x1b[31m','--- ERROR! - Duplicate resource ---', from ,'\x1b[0m','\n');
  process.exit();
  });

// Roster aka friendslist  
console.log('\x1b[1m\x1b[36m%s\x1b[0m','Friends List:',(await client.getRoster(jid)).items,'\x1b[0m');

// Get Role From vcard
    const vcard = await client.getVCard(jid);
    const vcardrole = vcard.records[4].value;
    console.log('\n','\x1b[1m\x1b[32m','--- Role ---','\x1b[0m','\n',vcardrole,'\n');

// Get Avatar The Base64 string 
// too much data uncomment when working with UI
//    console.log('\n','\x1b[1m\x1b[32m','--- Avatar ---','\x1b[0m');
//    const vcardavatar = vcard.records[0].data;
//    console.log(vcardavatar);


// This sends a presence saying the user is online
// very important
client.sendPresence(console.error);

// linebreak
console.log(line)

// serverline
const myRL = require('serverline')

// This is your username prompt here init
// TimeStamp for init prompt
const time = new Date().toLocaleTimeString();
myRL.init(time +' [ ' + from + ' ]: ')

// function for new time
function TimeStamp() {
  setInterval(function() {  

    // Timestamp for prompt
    const time = new Date().toLocaleTimeString();
    myRL.setPrompt(time +' [ ' + from + ' ]: ')

    
  }, 1000)
}
TimeStamp();


// Sending messages
// Sends messages to the last person who sent to this account if i add the client.on('chat', msg) listener but its gonna break
// make a argument for name of jid then replay
// If you want to send messages that will execute commands then send messages to the jid that has the shell resource
// I can make a prompt to ask to who do you want to send and it just cycles through the users online

    myRL.on('line', function(message) {
      client.sendMessage({
        to: result.username,
        body: message 
    });
    client.sendMarker(message)
  });



// Auto complete for commands
myRL.setCompletion(['bash','help', 'godswords', 'command1', 'status', 'ping', 'buddies','role','stats','hidden','secret','linebreak'])

// This is if you want to exit. Will help alot when you wanna disconnect from xmpp
//myRL.on('SIGINT', function(rl) {
//    rl.question('Confirm exit: ', (answer) => answer.match(/^y(es)?$/i) ? process.exit(0) : rl.output.write('\x1B[1K> '))
//  })

// This is for commands can be used for local or serverend
  myRL.on('line', function(line) {
    //console.log('cmd:', line)
    const time = new Date().toLocaleTimeString();
    switch (line) {
      case 'help':
        console.log(time,'\x1b[36m','help: To get this message.','\x1b[0m')  
        break
      case 'linebreak':
        const line = '-'.repeat(process.stdout.columns)
        console.log(line)  
        break
      case 'hidden':
        console.log(time,'\x1b[36m','Toggle is muted.','\x1b[0m', !myRL.isMuted())
        myRL.setMuted(!myRL.isMuted(), '> [hidden]')
        return true
      case 'secret':
        return myRL.secret('secret:', function() {
        console.log(time,'\x1b[36m',';)','\x1b[0m')  
        })   
    }
    if (myRL.isMuted())
      myRL.setMuted(false)
  })

});




// receiving messages
client.on('chat', msg => {
    
    client.sendMessage({
        to: msg.from,
        //body: msg.body
    });

    client.sendMarker(msg.from);

    // TimeStamp for received messages
    const time = new Date().toLocaleTimeString();
    
    console.log(line);    
    console.log(time,'\x1b[32m[',msg.from,']:\x1b[0m',msg.body);


});

///
// This Area is for remote commands sent from other users and will execute on host
// You can change the chat to groupchat so users can execute commands
// WARNING VCARD WILL OVERFLOOD SCREEN
///

client.on ('chat', msg  => {
    client.sendMessage ({
        to: msg.to,
        body: msg.body            
    });
    // TimeStamp for each remote command
    const time = new Date().toLocaleTimeString();

    if (msg.body === "!command") {
    console.log(time,'\x1b[36m[','execute a command here ]','\x1b[0m') 
    console.log(line)

    // sends message that command was executed
    client.sendMessage({
      //to: msg.from,
      //body: "!command was sent"
    });     
}; 
    if (msg.body === "!line") {
        console.log(line)     
};  
    if (msg.body === "!vcard") {
    console.log(line) 
    console.log(time,'\n','\x1b[1m\x1b[32m','--- Avatar ---','\x1b[0m');
    const vcardavatar = vcard.records[0].data;
    console.log(vcardavatar);
    console.log(line) 
}; 
    if (msg.body === "!clear") {
    console.clear()  
    console.log(time,'\x1b[36m[','Screen cleared ]')   
};
    if (msg.body === "!roster") {
    console.log(line) 
    //console.log('\x1b[1m\x1b[36m','Friends List:',(await client.getRoster(jid)).items,'\x1b[0m');
    console.log(line) 
};  
    if (msg.body === "!role") {
    console.log(line)     
    console.log(time,'\n','\x1b[1m\x1b[32m','--- Role ---','\x1b[0m');
    //const vcard = await client.getVCard(jid);
    //const vcardrole = vcard.records[4].value;
    //console.log(vcardrole,'\n');
    console.log(line) 
    };  
});




// Test function for scrollback of terminal. cool useless data. SPLIT THIS.
function displayFakeLog() {
    let i = 0
    setInterval(function() {
      const currentDate = new Date();
      const time = currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();

      const num = () => Math.floor(Math.random() * 255) + 1
      i++
      console.log(new Date().toLocaleTimeString(),'\x1b[1m\x1b[32m[',i + ' ' + num() + '.' + num() + '.' + num() + ' user connected ]\x1b[0m')
    }, 6000)
  }
  //displayFakeLog()


client.on("marker:displayed", (presence) => {
  const time = new Date().toLocaleTimeString();
  console.log(time,'\x1b[33m','---','Viewed this message ---','\x1b[0m', presence.from)
  client.sendMarker(true);
});

  // This area is for presence 
  // very important but very annoying and can fill up your terminal
  
  // Presence listener
  // This is a presence counter
  let i = 0;
  client.on("stanza", (presence) => {
    // Just a horizontal line
    const line = '-'.repeat(process.stdout.columns)
    const time = new Date().toLocaleTimeString();

    // Displays All Presence in json
    if (presence) {
      client.on ('chat', msg  => {
          if (msg.body === null);
          void(0);
        });
        

      i++
      console.log(line)
      if (presence.show === undefined) 
      console.log(time,'\x1b[33m','---', i ,'PRESENCE ---','\x1b[0m', presence.from);
      else
      console.log(time,'\x1b[33m','---', i ,'PRESENCE ---','\x1b[0m', presence.from, "[Status:", presence.show,"]");
      console.log('\x1b[33m',presence,'\x1b[0m')
      console.log(line)
    }

    // Displays Body Messages
    if (presence.body) {
      //console.log(time,'\x1b[33m','--- Body PRESENCE ---','\x1b[0m', presence.from);
    }

    // Displays if user sent a file
    // sends back a link of file
    if (presence.links[0].url) {
      console.log(time,'--- \x1b[32m',presence.from,'\x1b[0m', 'Uploaded a file ---','\x1b[0m');
      
      const image = presence.links[0].url
      // Do whatever you want with that file here
      client.sendMessage({
        to: presence.from,
        body: image
    });
    
    
    }

    // Displays The type of chat. Groupchat, private message, normal chat etc.
    if (presence.type) {
      //console.log(time,'\x1b[33m','--- Chat Type PRESENCE ---','\x1b[0m', presence.from);
    }

});


  // Displays If user is offline
  client.on("unavailable", (presence) => {
    // Just a horizontal line
    const line = '-'.repeat(process.stdout.columns)
    const time = new Date().toLocaleTimeString();
    if ('unavailable') {
      console.log(time,'\x1b[33m','--- OFFLINE ---','\x1b[0m', presence.from);
      console.log(line)
    }

});


 
client.connect().catch(console.error);
});
