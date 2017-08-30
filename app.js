/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Send a message with attachments
* Send a message via direct message (instead of in a public channel)

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node demo_bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "Attach"

  The bot will send a message with a multi-field attachment.

  Send: "dm me"

  The bot will reply with a direct message.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

const http = require('http');
var Botkit = require('../lib/Botkit.js');
var jobSearch = {};

if (!process.env.token) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}
var controller = Botkit.slackbot({
    debug: false
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM(function(err) {
  if (err) {
    throw new Error(err);
  }
});


//TODO: Customize this function!!

controller.hears(['dm me'],['direct_message','direct_mention'],function(bot,message) {
  bot.startConversation(message,function(err,convo) {
    convo.say('Heard ya');
  });

  bot.startPrivateConversation(message,function(err,dm) {
    dm.say('Private reply!');
  });

});


controller.hears(['hello','hi'],['direct_message','direct_mention','mention'],function(bot,message) {
    bot.reply(message,"Hello.");
});


controller.hears(['job', 'unemployed'], ['direct_message'], function(bot,message) {

  bot.startConversation(message, function(err, convo) {
    if(!err){
      convo.say('Let\'s get you a new job!');
      convo.ask('What kind of job? IE - front end, JavaScript, C#...', function(response, convo) {
        convo.next();
      }, {'key': 'technology'});
      convo.ask('Which location(s) are you interested in?', function(response, convo) {
        convo.next();
      }, {'key': 'location'});
      // convo.ask('Any particular company?', [
      //   {
      //     pattern: bot.utterances.yes,
      //     callback: function(response,convo) {
      //       convo.ask('Okay, which one?', function(response, convo) {
      //         convo.next();
      //       });
      //      convo.next();
      //    }, {'key': 'company'});
      //  },
      //   {
      //     pattern: bot.utterances.no,
      //     callback: function(response,convo) {
      //       convo.say('Keeping your options open, I like it!');
      //      convo.next();
      //    }, {'key': 'company'});
      //  },
      //  {
      //     default: true,
      //     callback: function(response,convo) {
      //       // just repeat the question
      //       convo.repeat();
      //       convo.next();
      //     }
      //   }
      // ]);
    }

    convo.on('end', function(convo) {
        if (convo.status == 'completed') {

            jobSearch.technology = convo.extractResponse('technology');
            jobSearch.location = convo.extractResponse('location');
            // jobSearch.company = convo.extractResponse('company');
            bot.reply(message, 'OK! Let me check Glassdoor for a ' + jobSearch.technology + ' postion in ' + jobSearch.location +'!');
            convo.next();
            // var searchURL = 'http://api.indeed.com/ads/apisearch?publisher=1848074416735394&q='+jobSearch.technology+'&l='+jobSearch.location+'&v=2';
            var searchURL = 'api.indeed.com';

            var options = {
              host: searchURL,
              path: '/ads/apisearch?publisher=1848074416735394&q='+ jobSearch.technology + '&l='+ jobSearch.location+'&format=json&v=2',
              method: 'GET'
            }

            var req = http.get(options, (res) => {
              var body = '';
              res.on('data', (d) => {
                body += d;
              });
              res.on('end',(d)=> {
                var data = JSON.parse(body);
                var jobs = data.results;

                for(i = 0;i<jobs.length;i++)
                {
                  var jobTitle =jobs[i]['jobtitle'];
                  var jobCompany =jobs[i]['company'];
                  var jobSnippet =jobs[i]['snippet'];
                  var jobURL =jobs[i]['url'];

                  bot.reply(message, jobCompany + ' is looking for a '+
                                     jobTitle + '. Here\'s what they say: ' + jobSnippet + 'check it out here: ' +jobURL);
                }


              });
            });


        } else {
            // this happens if the conversation ended prematurely for some reason
            bot.reply(message, 'OK, nevermind!');
        }
    });
  });
});
