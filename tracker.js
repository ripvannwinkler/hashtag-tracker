/*
	A simple Node.js app to monitor a particular hashtag.
  It listens for Tweets with the provided hashtag and then writes them to a local mongoDB database.

	@author: Paul Prae
	@since: 05/14/2015
*/


const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const moment = require('moment');
const Twitter = require('twitter');

const secret = JSON.parse(fs.readFileSync('secret.json', 'utf8'));
const exitEvents = ['SIGINT', 'uncaughtException', 'SIGTERM']

const logFile = path.resolve('./data/tweets.log');
const textFile = path.resolve('./data/tweets.txt');
const client = new Twitter(secret);

const twitterOpts = {
  track: '#unitedstarssweepstakes',
};

twitterOpts.track = '#sexy';

console.log(path.dirname(textFile));
mkdirp(path.dirname(textFile));
mkdirp(path.dirname(logFile));

const writeTweetToLog = tweet => {
  var msg = JSON.stringify(tweet);
  fs.appendFileSync(logFile, `${msg}\r\n`);
  console.log(msg);
}

const writeTweetToFile = tweet => {
  const o = {
    time: moment(tweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').toISOString(),
    id: tweet.id_str,
    is_retweet: !!tweet.retweeted_status,
    in_reply_to: tweet.in_reply_to_status_id_str,
    from_username: tweet.user && tweet.user.screen_name || '',
    media: tweet.entities && tweet.entities.media && tweet.entities.media[0].expanded_url || '',
    mentions: ((tweet.text || '').match(/@\w+/gmi) || []).map(x => x.substring(1)).join(','),
    tags: ((tweet.text || '').match(/#\w+/gmi) || []).map(x => x.substring(1)).join(','),
    text: tweet.text || ''
  }

  const encoding = 'utf8';
  const msg = JSON.stringify(o) + '\r\n';
  fs.appendFileSync(textFile, msg, encoding);
}

const logErrorToConsole = error => {
  console.error(error);
}

const closeAndExit = () => {
  process.exit();
}

process.on('SIGINT', closeAndExit);
process.on('SIGTERM', closeAndExit);
process.on('uncaughtException', closeAndExit);

client.stream('statuses/filter', twitterOpts, stream => {
  stream.on('error', logErrorToConsole);
  stream.on('data', writeTweetToFile);
  stream.on('data', writeTweetToLog);
});