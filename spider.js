var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var fs = require('fs');

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var url;
var baseUrl;
var START_URL;
var SEARCH_WORD1, SEARCH_WORD2;
var WFILE1, WFILE2;
var exclude = ['@comment', '?diff', '?oldid', '?direction', '?veaction'];

function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

function containBadLink(url){
  for (var i = exclude.length - 1; i >= 0; i--) {
    if(url.indexOf(exclude[i]) !== -1){
      return true;
    }
  }

  return false;
}

var self = module.exports = {

  init : function(start, search1, search2, file1, file2){
    START_URL = start;
    SEARCH_WORD1 = search1;
    SEARCH_WORD2 = search2;
    WFILE1 = file1;
    WFILE2 = file2;

    url = new URL(START_URL);
    baseUrl = url.protocol + "//" + url.hostname;

    pagesToVisit.push(START_URL);

    fs.truncate(WFILE1, 0, (err) => {
        if (err) throw err;

        console.log('Iniciado arquivo 1');
      });
    

    fs.truncate(WFILE2, 0, (err) => {
        if (err) throw err;

        console.log('Iniciado arquivo 2');
      });
      
  },

  crawl : function() {
    var nextPage = pagesToVisit[pagesToVisit.length - 1];

    if(pagesToVisit.length == 0){
      console.log('Busca terminou');
    }
    else{
      if (nextPage in pagesVisited) {
        pagesToVisit.pop();
        // We've already visited this page, so repeat the crawl
        self.crawl();
      } else {
        // New page we haven't visited
        self.visitPage(nextPage, self.crawl);

        console.log(pagesToVisit.length + ' paginas para visitar');
      }
    }
  },

  visitPage: function (url, callback) {
    // Add page to our set
    pagesVisited[url] = true;

    // Make the request
    //console.log("Visiting page " + url);
    request(url, function(error, response, body) {
       // Check status code (200 is HTTP OK)
       //console.log("Status code: " + response.statusCode);
       if(response.statusCode !== 200) {
         callback();
         return;
       }
       // Parse the document body
       var $ = cheerio.load(body);
       self.searchForDiv($, SEARCH_WORD1, url, 'dl', WFILE1);
       self.searchForDiv($, SEARCH_WORD2, url, 'table.collapsible tr td table.article-table', WFILE2);

       self.collectInternalLinks($);
       // In this short program, our callback is just calling crawl()
       callback();
       
    });
  },

  searchForDiv: function ($, word, url, find, arq) {
    var bodyText = $('html > body').text().toLowerCase();
    if(bodyText.indexOf(word.toLowerCase()) !== -1){

      if($(find)[0]){
        var item = $('h1').text();
        var quote = $(find).text();
        var data = '----\n' + item + '{' + url + '}\n' + quote + '----\n';

        fs.appendFile(arq, data, (err) => {
          if (err) throw err;

          console.log('Atualizado arquivo ' + arq);
        });
      }
      
    }
  },

  collectInternalLinks: function ($) {
      var relativeLinks = $("a[href^='/']");
      //console.log("Found " + relativeLinks.length + " relative links on page");
      relativeLinks.each(function() {
          var relurl = baseUrl + $(this).attr('href');

          if(!isInArray(relurl,pagesToVisit) && !containBadLink(relurl)){
            pagesToVisit.push(relurl);
          }
      });
  }
}