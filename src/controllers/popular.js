
'use strict';

var nconf = require('nconf'),
	topics = require('../topics'),
	meta = require('../meta'),
	helpers = require('./helpers'),
	plugins = require('../plugins');

var popularController = {};

var anonCache = {}, lastUpdateTime = 0;

var terms = {
	daily: 'day',
	weekly: 'week',
	monthly: 'month',
	alltime: 'alltime'
};

popularController.get = function(req, res, next) {

	var term = terms[req.params.term] || 'day';

	if (!req.uid) {
		if (anonCache[term] && (Date.now() - lastUpdateTime) < 60 * 60 * 1000) {
			return res.render('popular', anonCache[term]);
		}
	}

	topics.getPopular(term, req.uid, meta.config.topicsPerList, function(err, topics) {
		if (err) {
			return next(err);
		}

		var data = {
			topics: topics,
			'feeds:disableRSS': parseInt(meta.config['feeds:disableRSS'], 10) === 1,
			rssFeedUrl: nconf.get('relative_path') + '/popular/' + (req.params.term || 'daily') + '.rss',
			breadcrumbs: helpers.buildBreadcrumbs([{text: '[[global:header.popular]]'}]),
			title: '[[pages:popular-' + term + ']]'
		};

		plugins.fireHook('filter:popular.topics.build', {req: req, res: res, templateData: data}, function(err, data) {
			if (err) {
				return next(err);
			}
			if (!req.uid) {
				anonCache[term] = data.templateData;
				lastUpdateTime = Date.now();
			}
			res.render('popular', data.templateData);
		});
	});
};

module.exports = popularController;