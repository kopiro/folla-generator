const spawn = require('child_process').spawn;

const FeedParser = require('feedparser');
const request = require('request');
const striptags = require('striptags');
const uuid = require('uuid');
const _ = require('underscore');
const fs = require('fs');

const CACHE = __dirname + '/cache';

function download(feed, voice, callback) {
	let item;
	let count = 0;
	let files = [];

	console.log('Downloading ' + feed);

	const feedparser = new FeedParser();
	feedparser.on('readable', function () {
		while (item = this.read()) {
			if (count < 10) {
				count++;

				let text = striptags(item.description.substr(0, 500));
				const cache_file = CACHE + '/' + uuid.v4() + '.aiff';

				spawn('/usr/bin/say', [ 
				text, 
				'-v', voice, 
				'-o', cache_file
				])
				.on('close', () => {
					files.push(cache_file);
					if (--count == 0) {
						callback(files);
					}
				});
			}
		}
	});

	request(feed)
	.pipe(feedparser);
}

function play(files) {
	console.log('Playing', files);
	files.forEach((f) => {
		spawn('play', [ 
		'-v', (_.random(0, 100) / 100),
		f,
		'pitch', '-q', _.random(-100, 600),
		])
		.on('close', () => {
			setTimeout(() => {
				play([f]);
			}, _.random(0, 3000));
		});
	});
}

var files = [];
download('http://www.huffingtonpost.com/feeds/verticals/arts/index.xml', 'Alex', (f) => {
	files = files.concat(f);
	download('http://www.repubblica.it/rss/cronaca/rss2.0.xml', 'Luca', (files) => {
		files = files.concat(f);
		play(files);
	});
});