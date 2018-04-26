(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){

// Require in Reddit.js API wrapper module w/ browserify
require("reddit.js"); // Don't need to catch return value,
// module simply stores everything in window.reddit object

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getRandomPost(){
  return new Promise (function(resolve,reject){
    reddit.random("nocontext").fetch(resolve);
  });
}

async function getValidPostTitle(){
  var title;

  title = await getRandomPost();
  title = title[0].data.children[0].data.title;
  
  // Remove any enclosing quotation marks
  
  title = title.replace(/^\s*[\"'“]/, "")
  title = title.replace(/[\"'”]\s*$/, "")
  
  // If there are quotations w/i the body of the post title
  // we want to replace those with the ' character
  title = title.replace(/[\"”“]/g, "'")

  title = capitalizeFirstLetter(title);
  return title;
}


function replaceFullSentence(quoteMatch, containingElem, replacement){

  // Add quotations to post title
  replacement = '“' + replacement + '”';

  // We will keep the original final puntuation mark unless:
  //  
  //  1. The original quote ends in a ?, since this would only
  //     make sense in the unlikely event that the replacement is
  //     also a question, OR 
  //     
  //  2. The replacement ends in a ?, in which case we should use
  //     the ? 

  let origPunct = quoteMatch.match(/[.,!](?=[\"”]\s*$)/);
  if (origPunct){ 
    
    if (replacement.match(/[.,!](?=[\"”])/)){
      replacement = replacement.replace(/[.,!](?=[\"”])/, origPunct);
    }
    else if(!replacement.match(/\?(?=[\"”])/)){
      replacement = replacement.replace(/”/, origPunct + '”');
    }
  }

  console.log("match: ", quoteMatch, "containingElem: ", containingElem, "replacement: ", replacement);
  
  containingElem.textContent = String(containingElem.textContent).replace(quoteMatch, replacement);
}

function replaceHiatus(quoteMatch, containingElem, replacement){
  
  replacement = '“' + replacement + '”';

  console.log("Replacement = ", replacement);
  

  let origPunct = quoteMatch.match(/[.,!](?=[\"”]\s*$)/);
  if (origPunct){ 
    
    if (replacement.match(/[.,!](?=[\"”])/)){
      replacement = replacement.replace(/[.,!](?=[\"”])/, origPunct);
    }
    else if(!replacement.match(/\?(?=[\"”])/)){
      replacement = replacement.replace(/”/, origPunct + '”');
    }
  }

  // Split up the original quote into left and right, ignoring the intervening text, 
  // which will not be replaced. 
  const leftQuote = quoteMatch.match(/[\"“]\s*[A-Z][^"”“]+(?=,[\"”])/),
    rightQuote = quoteMatch.match(/(?<=,\s*[\"“])[^"”“]+[\"”]\s*$/);

  console.log("leftQuote ", leftQuote, "rightQuote ", rightQuote);
  
  // Split up the replacement as sensibly as possible.
  var leftReplace,
      rightReplace;
  
  // If the replacement is composed of more than one sentence, a sentence boundary
  // would make an ideal splitting point. 
  if (replacement.match(/[\"“]\s*[^.,!?]+[.,!?]\s*.+[.,!?]\s*[\"”]/)){

    console.log('=== Sentence Boundary match ===');
    
    leftReplace = replacement.match(/[\"“]\s*[^.,!?]+/);
    rightReplace = replacement.match(/(?<=[\"“]\s*[^.,!?]+[.,!?]\s*)[^\s].*$/);
  }
  // Otherwise, just cut it in half and hope for the best
  else{
    let splitReplacement = replacement.split(" ");
    leftReplace = splitReplacement.slice(0, splitReplacement.length/2).join(" ");
    rightReplace = splitReplacement.slice(splitReplacement.length/2).join(" ");
  }
  console.log("leftReplace ", leftReplace, "rightReplace ", rightReplace);
  
  // Make replacement ...
  containingElem.textContent = containingElem.textContent.replace(leftQuote, leftReplace);
  containingElem.textContent = containingElem.textContent.replace(rightQuote, rightReplace);
  
}

// Collect all the elements we're interested in into a single array
var textElements = [];
var tagsToCheck = ["h1","h2","h3","h4","h5","p","li","div", "span"];

tagsToCheck.forEach(function(tag){
  document.querySelectorAll(tag).forEach(function(elem){
    textElements.push(elem);
  });
})

// Filter down to just elements containing quotes 
var containsQuotes = textElements.filter(function(elem){
  return (elem.textContent.includes('"') || elem.textContent.includes('“'));
})

// Sometimes an element's textContent can end up containing
// the text of a script or style. We don't want those.

containsQuotes = containsQuotes.filter(function(elem){return !(elem.textContent.match(/<.*>/)||div.textContent.match(/{(.*:.*;\s)+}/));});

// If there are any quotes on the page, continue ...
if(containsQuotes.length > 0)
{
  containsQuotes.forEach(function(elem){
    // Try to match two different patterns against the textContent of elem 
    let modifiedContent = elem.textContent,
              
        // This pattern will match just the quotes and the text they enclose in 
        // the following two examples:       
        // - "This quotation ends with a period, but question mark or exclamation would also match."
        // - "This quotation ends with a comma," it read. 
        
        fullSentencePattern = /[\"“]\s*[A-Z][^"”“]+([\.\?\!]\s*[\"”]|,\s*[\"”](?=[^"”“]+[\.\?\!]))/g,

        // This pattern will match the entire text in the following example:
        // - "While I waited," he explained, "the paint began to dry." 
        // The quotes that match this pattern will need to be replaced using a different
        // routine from those matching the first pattern, since we will want to keep the 
        // unquoted text the same but replace the quote-enclosed substrings on either side. 

        hiatusPattern = /[\"“]\s*[A-Z][^"”“]+,["”][^"”“]+,\s*["“][^"”“]+[\.\?\!]\s*["”]/g;
 
    let fullSentenceMatches = elem.textContent.match(fullSentencePattern),
        hiatusMatches = elem.textContent.match(hiatusPattern);

    if (fullSentenceMatches){
      fullSentenceMatches.forEach(function(match){
        getValidPostTitle()
          .then(replaceFullSentence.bind(null, match, elem))
      });
    }
    
    if (hiatusMatches){
      hiatusMatches.forEach(function(match){
        getValidPostTitle()
          .then(replaceHiatus.bind(null, match, elem))
      });
    }
    
  })
}
},{"reddit.js":2}],2:[function(require,module,exports){
/**
 * Reddit API wrapper for the browser (https://git.io/Mw39VQ)
 * @author Sahil Muthoo <sahil.muthoo@gmail.com> (https://www.sahilm.com)
 * @license MIT
 */
!function(window){"use strict";function listing(on,extras){return extras=extras||[],withFilters(on,["after","before","count","limit","show"].concat(extras))}function fetch(on){return{fetch:function(res,err){getJSON(redditUrl(on),res,err)}}}function withFilters(on,filters){var ret={};on.params=on.params||{},filters=filters||[];for(var without=function(object,key){var ret={};for(var prop in object)object.hasOwnProperty(prop)&&prop!==key&&(ret[prop]=object[prop]);return ret},i=0;i<filters.length;i++)ret[filters[i]]=function(f){return"show"===f?function(){return on.params[f]="all",without(this,f)}:function(arg){return on.params[f]=arg,without(this,f)}}(filters[i]);return ret.fetch=function(res,err){getJSON(redditUrl(on),res,err)},ret}function redditUrl(on){var url="https://www.reddit.com/";if(void 0!==on.subreddit&&(url+="r/"+on.subreddit+"/"),url+=on.resource+".json",function(object){var ret=[];for(var prop in object)object.hasOwnProperty(prop)&&ret.push(prop);return ret}(on.params).length>0){var qs=[];for(var param in on.params)on.params.hasOwnProperty(param)&&qs.push(encodeURIComponent(param)+"="+encodeURIComponent(on.params[param]));url+="?"+qs.join("&")}return url}function getJSON(url,res,err){get(url,function(data){res(JSON.parse(data))},err)}function get(url,res,err){var xhr=new XMLHttpRequest;xhr.open("GET",url,!0),xhr.onload=function(){return res(xhr.response)},xhr.onerror=function(){if(void 0!==err)return err(xhr.response)},xhr.send()}var reddit=window.reddit={};reddit.hot=function(subreddit){return listing({subreddit:subreddit,resource:"hot"})},reddit.top=function(subreddit){return listing({subreddit:subreddit,resource:"top"},["t"])},reddit.controversial=function(subreddit){return listing({subreddit:subreddit,resource:"controversial"},["t"])},reddit.new=function(subreddit){return listing({subreddit:subreddit,resource:"new"})},reddit.about=function(subreddit){return fetch({subreddit:subreddit,resource:"about"})},reddit.random=function(subreddit){return fetch({subreddit:subreddit,resource:"random"})},reddit.info=function(subreddit){return withFilters({subreddit:subreddit,resource:"api/info"},["id","limit","url"])},reddit.comments=function(article,subreddit){return withFilters({subreddit:subreddit,resource:"comments/"+article},["comment","context","depth","limit","sort"])},reddit.recommendedSubreddits=function(srnames){return withFilters({resource:"api/recommend/sr/"+srnames},["omit"])},reddit.subredditsByTopic=function(query){return fetch({resource:"api/subreddits_by_topic",params:{query:query}})},reddit.search=function(query,subreddit){return withFilters({subreddit:subreddit,resource:"search",params:{q:query}},["after","before","count","limit","restrict_sr","show","sort","syntax","t"])},reddit.searchSubreddits=function(query){return listing({resource:"subreddits/search",params:{q:query}})},reddit.popularSubreddits=function(){return listing({resource:"subreddits/popular"})},reddit.newSubreddits=function(){return listing({resource:"subreddits/new"})},reddit.aboutUser=function(username){return fetch({resource:"user/"+username+"/about"})}}(window);
},{}]},{},[1]);
