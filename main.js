var spider = require('./spider.js');

spider.init('http://darksouls.wikia.com/wiki/Dark_Souls_Wiki', 'In-Game Description', 'Dialogue', './description.txt', './dialogue.txt');
spider.crawl();