// ==UserScript==
// @name MyAnimeStream
// @author siku2
// @version 2.0.0
// @description Get the most out of your favourite anime site by turning the page into a streaming site.
// @homepage https://mas.dokkeral.com/
// @downloadURL https://mas.dokkeral.com/download
// @icon https://mas.dokkeral.com/images/logo
// @include /^http(?:s)?\:\/\/myanimelist\.net.*$/
// @include /^http(?:s)?\:\/\/kitsu\.io.*$/
// @noframes True
// @run-at document-start
// @require https://cdn.jsdelivr.net/npm/jquery@3.3.1/dist/jquery.min.js
// @require https://cdn.jsdelivr.net/npm/raven-js@3.26.3/dist/raven.min.js
// @require https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js
// @require https://cdn.jsdelivr.net/npm/plyr@3.3.21/dist/plyr.min.js
// ==/UserScript==
function _asyncToGenerator(e){return function(){var n=e.apply(this,arguments);return new Promise(function(e,t){return function o(i,a){try{var r=n[i](a),s=r.value}catch(e){return void t(e)}if(!r.done)return Promise.resolve(s).then(function(e){o("next",e)},function(e){o("throw",e)});e(s)}("next")})}}var myanimestream=function(exports,$$1,Raven,Cookies,Plyr){"use strict";let loadConfig=(_ref2=_asyncToGenerator(function*(){if(Object.assign(_config,default_config),username){let e;try{e=yield $$1.getJSON(grobberUrl+"/user/"+username+"/config")}catch(e){console.warn("config: couldn't load config"),Raven.captureMessage("Couldn't retrieve config.",{level:"warning",extra:{error:e}})}e&&e.success&&(Object.assign(_config,e.config),console.log("config: loaded config"))}else console.warn("config: Can't load config (user not logged in)")}),function(){return _ref2.apply(this,arguments)});var _ref2;let saveConfig=(_ref3=_asyncToGenerator(function*(){if(username){console.debug("config: saving config");const e=yield $$1.postJSON(grobberUrl+"/user/"+username+"/config",_config);return e.success?(console.log("config: saved config"),!0):(Raven.captureMessage("Couldn't save config.",{level:"warning",extra:{response:e}}),!1)}console.warn("config: can't save config (user not logged in)")}),function(){return _ref3.apply(this,arguments)});var _ref3;let showModal=(_ref4=_asyncToGenerator(function*(e){alert(e)}),function(e){return _ref4.apply(this,arguments)});var _ref4;let findAnimeUID=(_ref5=_asyncToGenerator(function*(e){_animeUidCache||(_animeUidCache=JSON.parse(localStorage.getItem("AnimeUIDs"))||{});const n=yield config.dub,t=_animeUidCache[n?"dub":"sub"];if(t)return t[e]}),function(e){return _ref5.apply(this,arguments)});var _ref5;let setAnimeUID=(_ref6=_asyncToGenerator(function*(e,n){const t=(yield config.dub)?"dub":"sub",o=(_animeUidCache=JSON.parse(localStorage.getItem("AnimeUIDs"))||{})[t];o?o[e]=n:_animeUidCache[t]={[e]:n},localStorage.setItem("AnimeUIDs",JSON.stringify(_animeUidCache))}),function(e,n){return _ref6.apply(this,arguments)});var _ref6;let updateEpisodesAvailable=(_ref7=_asyncToGenerator(function*(){if(!anime.status)return;if("WATCHING"!==anime.status)return void console.log("api: not watching this anime");console.debug("api: setting episodesAvailable to",anime.episodesAvailable,"");const e=safeMongoKey(anime.name),n={};n[e+".uid"]=anime.uid,n[e+".episodesAvailable"]=anime.episodesAvailable,yield $.postJSON(grobberUrl+"/user/"+username+"/episodes",n)}),function(){return _ref7.apply(this,arguments)});var _ref7;let getAnimeInfo=(_ref8=_asyncToGenerator(function*(e,n){anime.name=e,anime.status=n,anime.uid=yield findAnimeUID(e);let t,o=!1;if(anime.uid&&((t=yield $.getJSON(grobberUrl+"/anime/"+anime.uid)).success?o=!0:console.warn('api: Unsuccessful request for uid "'+anime.uid+'":',t,"")),!o){console.log("api: Searching for anime",e,"");const n=yield $.getJSON(grobberUrl+"/search/"+e,{dub:yield config.dub});n.success?(console.log("api: got answer",n,""),t=n.anime[0].anime,anime.uid=t.uid,setAnimeUID(e,anime.uid),o=!0):console.error("api: Couldn't find anime \""+e+'"')}return o?(anime.episodesAvailable=t.episodes,updateEpisodesAvailable(),!0):(animeNotFound(),!1)}),function(e,n){return _ref8.apply(this,arguments)});var _ref8;let closeChangelog=(_ref9=_asyncToGenerator(function*(){$$1("div.changelog-popup").remove(),yield config.set("lastVersion",GM_info.script.version),console.log("changelog: updated version")}),function(){return _ref9.apply(this,arguments)});var _ref9;let showChangelog=(_ref10=_asyncToGenerator(function*(e,n){const t=yield $$1.get(grobberUrl+"/templates/changelog/"+n+"/"+e);!1!==t.success?($$1.injectCSS({".changelog-popup":{position:"fixed","z-index":"2000",top:"50%",left:"50%",transform:"translate(-50%, -50%)",height:"90%","box-shadow":"0 0 100vh 10vh hsla(0, 5%, 4%, 0.7)"}}),$$1("<div class='changelog-popup'></div>").html(t).appendTo("body"),$$1("button.close-changelog-btn").click(closeChangelog)):console.log("changelog: no changes to show")}),function(e,n){return _ref10.apply(this,arguments)});var _ref10;let checkForUpdate=(_ref11=_asyncToGenerator(function*(){const e=GM_info.script.version;if(username){const n=yield config.lastVersion;if(!n)return console.log("changelog: No remote version... Setting to",e,""),void(yield config.set("lastVersion",e));versionBiggerThan(e,n)?(console.log("changelog: showing changelog"),yield showChangelog(e,n)):console.debug("changelog: no new version")}else console.log("changelog: not checking for update because user isn't logged in")}),function(){return _ref11.apply(this,arguments)});var _ref11;let finishedEpisode=(_ref12=_asyncToGenerator(function*(){(yield config.updateAnimeStatus)||console.log("kitsu/pages/anime/episode: Not updating anime status because of user settings"),console.log("kitsu/pages/anime/episode: finished Episode")}),function(){return _ref12.apply(this,arguments)});var _ref12;let onVideoEnd=(_ref13=_asyncToGenerator(function*(){if(yield finishedEpisode(),currentEpisodeIndex$1+1<anime.episodesAvailable){const e=new URL((currentEpisodeIndex$1+2).toString(),window.location.href);e.searchParams.set("autoplay","true"),window.location.href=e.toString()}else console.log("kitsu/pages/anime/episode: reached the last episode")}),function(){return _ref13.apply(this,arguments)});var _ref13;let onPageLeave=(_ref14=_asyncToGenerator(function*(){if(!currentPlayer.ended){const e=currentPlayer.currentTime/currentPlayer.duration;e>(yield config.minWatchPercentageForSeen)&&(console.log("kitsu/pages/anime/episode: Left page with video at "+Math.round(100*e).toString()+"% Counting as finished!"),yield finishedEpisode());const n=new URL(window.location.href);n.searchParams.delete("autoplay"),history.pushState(null,null,n.toString())}}),function(){return _ref14.apply(this,arguments)});var _ref14;let showAnimeEpisode=(_ref15=_asyncToGenerator(function*(e){currentEpisodeIndex$1=e,console.log("kitsu/pages/anime/episode: Creating video embed");const n=yield $.get(grobberUrl+"/templates/player/"+anime.uid+"/"+e.toString());$(n).insertAfter("div.unit-summary"),setupPlyr(),prefetchNextEpisode()}),function(e){return _ref15.apply(this,arguments)});var _ref15;let route=(_ref16=_asyncToGenerator(function*(e){const n=document.querySelector("meta[property='og:title']").getAttribute("content");if(yield getAnimeInfo(n,"ABSENT"),e.match(/^\/episodes\/\d+\/?$/)){const n=parseInt(e.match(/^\/episodes\/(\d+)\/?$/)[1]);yield showAnimeEpisode(n-1)}}),function(e){return _ref16.apply(this,arguments)});var _ref16;let waitForSelector=(_ref17=_asyncToGenerator(function*(e,n){let t=document.querySelector(e);for(;!t;)yield sleep(n),t=document.querySelector(e);return t}),function(e,n){return _ref17.apply(this,arguments)});var _ref17;let watchUrl=(_ref18=_asyncToGenerator(function*(e){console.log("kitsu/index: starting url watcher");let n=location.href;for(;;)location.href!==n&&(console.log("kitsu/index: URL changed"),e(),n=location.href),yield sleep(100)}),function(e){return _ref18.apply(this,arguments)});var _ref18;let route$1=(_ref19=_asyncToGenerator(function*(e){console.debug("kitsu/index: waiting for Kitsu"),yield waitForSelector("div.ember-view",20),console.info("kitsu/index: Kitsu loaded"),_urlWatcher||(_urlWatcher=watchUrl(function(){return route$1(location.pathname)})),e.match(/^\/anime\/[\w-]+/)&&(yield route(e.replace(/^\/anime\/[\w-]+/,"")))}),function(e){return _ref19.apply(this,arguments)});var _ref19;let getCurrentlyWatchingAnimeList=(_ref22=_asyncToGenerator(function*(){let e;for(;!e||e.length<=1;)e=$("table.list-table tbody.list-item"),yield sleep(100);const n=e.filter(function(e,n){return $(n).find("td.data.status").hasClass("watching")}),t=[];for(const e of n)t.push(new AnimeListEntry($(e)));return t}),function(){return _ref22.apply(this,arguments)});var _ref22;let displayCachedAnimeList=(_ref23=_asyncToGenerator(function*(e,n){if(username||console.log("mal/pages/list: not logged in -> not caching anime list"),e)for(const t of n){const n=e[t.safeName];n&&(t._uid=n.uid,t.episodesPreviouslyAvailable=n.episodesAvailable,t.show())}else console.debug("mal/pages/list: No Anime List cached")}),function(e,n){return _ref23.apply(this,arguments)});var _ref23;let cacheAnimeList=(_ref24=_asyncToGenerator(function*(e){username||console.log("mal/pages/list: not logged in -> not caching anime list");const n={};for(const t of e)n[t.safeName]={uid:t._uid,episodesAvailable:t.episodesAvailable};yield $.postJSON(grobberUrl+"/user/"+username+"/episodes",n)}),function(e){return _ref24.apply(this,arguments)});var _ref24;let highlightAnimeWithUnwatchedEpisodes=(_ref25=_asyncToGenerator(function*(){injectBalloonCSS(),$.injectCSS({".episode-status.new-episode":{"font-weight":"bolder",color:"#787878 !important"}});const[e,n]=yield Promise.all([$.getJSON(grobberUrl+"/user/"+username+"/episodes"),getCurrentlyWatchingAnimeList()]),t=displayCachedAnimeList(e,n),o={};for(const e of n)(yield e.uid)&&(o[yield e.uid]=e);const i=yield $.postJSON(grobberUrl+"/anime/episode-count",Object.keys(o));i.success?(yield t,Object.entries(i.anime).forEach(function([e,n]){return o[e].episodesAvailable=n}),n.forEach(function(e){return e.show()}),yield cacheAnimeList(n)):console.warn("mal/pages/list: Got turned down when asking for episode counts: ",i,"")}),function(){return _ref25.apply(this,arguments)});var _ref25;let submitSettings=(_ref26=_asyncToGenerator(function*(){$("div#content div form").serializeArray().forEach(function(e){config[e.name]=formParseValue(e.value)}),(yield saveConfig())?$("#update_success_display").show():$("#update_fail_display").show()}),function(){return _ref26.apply(this,arguments)});var _ref26;let showSettings=(_ref27=_asyncToGenerator(function*(){console.log("mal/pages/settings: Building settings page"),document.querySelector("div#horiznav_nav a[href$=myanimestream]").classList.add("horiznav_active"),document.querySelector("div#content div form").parentElement.innerHTML=yield $.get(grobberUrl+"/templates/mal/settings",yield config.all),document.querySelector("input[name=submit]").addEventListener("click",submitSettings)}),function(){return _ref27.apply(this,arguments)});var _ref27;let updateAnimeStatus=(_ref28=_asyncToGenerator(function*(e){const n=$("#myinfo_status"),t=$("#myinfo_score"),o=$("#myinfo_watchedeps"),i={csrf_token:$('meta[name="csrf_token"]').attr("content"),anime_id:parseInt($("#myinfo_anime_id").val()),status:parseInt(n.val()),score:parseInt(t.val()),num_watched_episodes:parseInt(o.val())||0};Object.assign(i,e),navigator.sendBeacon("/ownlist/anime/edit.json",JSON.stringify(i)),n.val(i.status),t.val(i.score),o.val(i.num_watched_episodes)}),function(e){return _ref28.apply(this,arguments)});var _ref28;let finishedEpisode$1=(_ref29=_asyncToGenerator(function*(){(yield config.updateAnimeStatus)||console.log("mal/pages/anime/episode: Not updating anime status because of user settings");const e=parseInt($("#curEps").text()),n={status:currentEpisodeIndex$2>=e?2:1},t=parseInt($("#myinfo_watchedeps").val())||0;currentEpisodeIndex$2>=t&&(n.num_watched_episodes=currentEpisodeIndex$2),console.log("mal/pages/anime/episode: updating data to:",n,""),yield updateAnimeStatus(n)}),function(){return _ref29.apply(this,arguments)});var _ref29;let onVideoEnd$1=(_ref30=_asyncToGenerator(function*(){if(yield finishedEpisode$1(),currentEpisodeIndex$2+1<=anime.episodesAvailable){const e=new URL((currentEpisodeIndex$2+1).toString(),window.location.href);e.searchParams.set("autoplay","true"),window.location.href=e.toString()}else console.log("mal/pages/anime/episode: reached the last episode")}),function(){return _ref30.apply(this,arguments)});var _ref30;let onPageLeave$1=(_ref31=_asyncToGenerator(function*(){if(!currentPlayer$1.ended){const e=currentPlayer$1.currentTime/currentPlayer$1.duration;e>(yield config.minWatchPercentageForSeen)&&(console.log("mal/pages/anime/episode: Left page with video at "+Math.round(100*e).toString()+"% Counting as finished!"),yield finishedEpisode$1());const n=new URL(window.location.href);n.searchParams.delete("autoplay"),history.pushState(null,null,n.toString())}}),function(){return _ref31.apply(this,arguments)});var _ref31;let createPlayer=(_ref32=_asyncToGenerator(function*(e){const n=yield $.get(grobberUrl+"/templates/player/"+anime.uid+"/"+(currentEpisodeIndex$2-1).toString());e.html(n),setupPlyr$1()}),function(e){return _ref32.apply(this,arguments)});var _ref32;let showAnimeEpisode$1=(_ref33=_asyncToGenerator(function*(){currentEpisodeIndex$2=parseInt(window.location.pathname.match(/^\/anime\/\d+\/[\w-]+\/episode\/(\d+)\/?$/)[1]);const e=$("div.video-embed.clearfix");if(e.length>0){document.querySelector("div.di-b>a").setAttribute("href","../episode");const n=parseInt($("li.btn-anime:last span.episode-number")[0].innerText.split(" ")[1]);if(n<anime.episodesAvailable){const e=document.querySelector("#vue-video-slide"),t=$("li.btn-anime:last").clone().removeClass("play").remove("span.icon-pay");t.find("div.text").html('<span class="episode-number"></span>'),t.find("img.fl-l").attr("src",grobberUrl+"/images/default_poster");for(let o=n;o<anime.episodesAvailable;o++){const n=t.clone(),i=(o+1).toString();n.find("span.episode-number").text("Episode "+i),n.find("a.link").attr("href",i),n.appendTo(e)}}(yield config.replaceStream)?(console.log("mal/pages/anime/episode: Manipulating player"),createPlayer(e),$("div.information-right.fl-r.clearfix").remove()):console.info("mal/pages/anime/episode: Not changing player because of user settings")}else console.log("mal/pages/anime/episode: Creating new video embed and page content"),document.querySelector("td>div.js-scrollfix-bottom-rel>div>div>table>tbody").innerHTML=yield $.get(grobberUrl+"/templates/mal/episode/"+anime.uid+"/"+(currentEpisodeIndex$2-1).toString()),setupPlyr$1();document.querySelector("#vue-video-slide").style.left=(-document.querySelector("li.btn-anime.play").offsetLeft).toString()+"px",prefetchNextEpisode$1()}),function(){return _ref33.apply(this,arguments)});var _ref33;let showAnimeEpisodes=(_ref34=_asyncToGenerator(function*(){const e=document.querySelector("table.episode_list"),n=parseInt(currentURL.searchParams.get("offset"))||0;if(e){console.log("mal/pages/anime/episodes: Manipulating existing episode table...");const t=e.querySelectorAll("tr.episode-list-data").length,o=parseInt(e.querySelector("tr.episode-list-data:last-child td.episode-number").innerText);if(100===t)console.log("mal/pages/anime/episodes: episode table paginated...");else if(o<anime.episodesAvailable){const n=document.querySelector("table.episode_list.descend tr.episode-list-header"),t=document.querySelector("tr.episode-list-data").cloneNode(!0);t.querySelector("td.episode-title").querySelector("span.di-ib").innerText="",t.querySelector("td.episode-aired").remove(),t.querySelector("td.episode-forum").remove();for(let i=o+1;i<anime.episodesAvailable;i++){let o=(i+1).toString(),a=$(t).clone();a.find("td.episode-number").text(o),a.find("td.episode-title").find("a").text("Episode "+o).attr("href","episode/"+o),a.find("td.episode-video>a").attr("href","episode/"+o).find("img").attr("alt","Watch Episode #"+o),a.appendTo(e),a.clone().insertAfter(n)}}else console.log("mal/pages/anime/episodes: They've done their job, this table is complete");fixEpisodePagination(n)}else console.log("mal/pages/anime/episodes: Creating episode table..."),document.querySelector("div.mb4").outerHTML=yield $.get(grobberUrl+"/templates/mal/episode/"+anime.uid,{offset:n});const t=document.querySelector("h2>span.di-ib");t.innerText="("+anime.episodesAvailable.toString()+"/"+t.innerText.split("/")[1]}),function(){return _ref34.apply(this,arguments)});var _ref34;let route$2=(_ref35=_asyncToGenerator(function*(){const e=currentURL.pathname,n=document.querySelector("h1>span[itemprop=name]").innerText,t=determineAnimeStatus();yield getAnimeInfo(n,t),patchNoEpisodeTab(),e.match(/^\/anime\/\d+\/[\w-]+\/?$/)?showAnimeDetails():e.match(/^\/anime\/\d+\/[\w-]+\/episode\/?$/)?yield showAnimeEpisodes():e.match(/^\/anime\/\d+\/[\w-]+\/episode\/\d+\/?$/)?yield showAnimeEpisode$1():console.warn("mal/pages/anime/_router: Unknown anime page")}),function(){return _ref35.apply(this,arguments)});var _ref35;let route$3=(_ref36=_asyncToGenerator(function*(){addUserContext(),startAdObserver();const e=currentURL.pathname;settingPaths.indexOf(e)>-1&&addSettingsButton(),e.match(/^\/anime\/\d+\/[\w-]+\/?/)?yield route$2():e.match(/^\/animelist\/\w+$/)?showAnimeList():e.match(/^\/editprofile\.php$/)&&"myanimestream"===currentURL.searchParams.get("go")&&(yield showSettings())}),function(){return _ref36.apply(this,arguments)});var _ref36;function toCSS(jss,options){function jsonToCSS(e,n){e&&!result[e]&&(result[e]={});for(const t of Object.keys(n)){const o=n[t];if(o instanceof Array){const n=o;for(let o=0;o<n.length;o++)addProperty(e,t,n[o])}else switch(typeof o){case"number":case"string":addProperty(e,t,o);break;case"object":{const n=t.charAt(t.length-1);if(!e||"_"!==n&&"-"!==n)jsonToCSS(makeSelectorName(e,t),o);else{const n=o;for(const o of Object.keys(n)){const i=o.split(/\s*,\s*/);for(let a=0;a<i.length;a++){const r=n[o];if(r instanceof Array){const n=r;for(let o=0;o<n.length;o++)addProperty(e,t+i[a],n[o])}else addProperty(e,t+i[a],n[o])}}}break}}}}function makePropertyName(e){return e.replace(/_/g,"-")}function makeSelectorName(e,n){const t=[],o=n.split(/\s*,\s*/),i=e.split(/\s*,\s*/);for(let e=0;e<i.length;e++){const n=i[e];for(let e=0;e<o.length;e++){const i=o[e];"&"===i.charAt(0)?t.push(n+i.substr(1)):t.push(n?n+" "+i:i)}}return t.join(", ")}function addProperty(e,n,t){"number"!=typeof t||options.useRawValues||(t+="px");const o=n.split(/\s*,\s*/);for(let n=0;n<o.length;n++){const i=makePropertyName(o[n]);result[e][i]?result[e][i].push(t):result[e][i]=[t]}}const result={};if("string"==typeof jss)try{eval("const jss = {"+jss+"}")}catch(e){return"/*\nUnable to parse JSS: "+e+"\n*/"}jsonToCSS("",jss);let ret="";for(const e of Object.keys(result)){const n=result[e];ret+=e+" {\n";for(const e of Object.keys(n)){const t=n[e];for(let n=0;n<t.length;n++)ret+="\t"+e+": "+t[n]+";\n"}ret+="}\n"}return ret}$$1=$$1&&$$1.hasOwnProperty("default")?$$1.default:$$1,Raven=Raven&&Raven.hasOwnProperty("default")?Raven.default:Raven,Plyr=Plyr&&Plyr.hasOwnProperty("default")?Plyr.default:Plyr,$$1(document).ajaxError(function(e,n,t,o){Raven.captureMessage(o||n.statusText,{extra:{type:t.type,url:t.url,data:t.data,status:n.status,error:o||n.statusText,response:n.responseText.substring(0,100)}})});const defaults={truncateFirst:!1,container:null,containerName:"injectCSSContainer",useRawValues:!1};var jQuery;jQuery=$$1,jQuery.injectCSS=function(e,n){(n=jQuery.extend({},defaults,n)).media=n.media||"all";let t=n.container&&jQuery(n.container)||jQuery("#"+n.containerName);t.length||(t=jQuery("<style></style>").appendTo("head").attr({media:n.media,id:n.containerName,type:"text/css"}));let o="";return n.truncateFirst||(o+=t.text()),o+=toCSS(e,n),t.text(o),t},function(e){e.postJSON=function(n,t){return e.ajax({type:"POST",contentType:"application/json",url:n,data:JSON.stringify(t)})}}($$1);const grobberUrl="https://mas.dokkeral.com",ravenDSN="https://1d91640d1e45402c9a8f80e74c24658b@sentry.io/1207280",default_config={lastVersion:null,dub:!1,replaceStream:!0,updateAnimeStatus:!0,minWatchPercentageForSeen:.75};let _configReady=!1,_configLoader;const _config={set:(e,n)=>_asyncToGenerator(function*(){_config[e]=n,yield saveConfig()})()},_configHandler={get:(e,n)=>n in e&&Object.keys(default_config).indexOf(n)<0?e[n]:_asyncToGenerator(function*(){return _configReady||(_configLoader||(_configLoader=loadConfig()),yield _configLoader,_configReady=!0),"all"===n?_config:_config[n]})()},config=new Proxy(_config,_configHandler);function sleep(e){return new Promise(n=>setTimeout(n,e))}function injectBalloonCSS(){$("<link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/balloon-css/0.5.0/balloon.min.css'>").appendTo("head")}function versionBiggerThan(e,n){if(e===n)return null;const t=e.split("."),o=n.split("."),i=Math.min(t.length,o.length);for(let e=0;e<i;e++){if(parseInt(t[e])>parseInt(o[e]))return!0;if(parseInt(t[e])<parseInt(o[e]))return!1}return t.length>o.length||!(t.length<o.length)&&void 0}function safeMongoKey(e){return e.replace(/\./g,"")}function randomItem(e){return e[Math.floor(Math.random()*e.length)]}function animeNotFound(){const e="already-warned-"+anime.name.replace(/\W+/g,"").toLowerCase();if(Cookies.get(e))return console.log("messages: Already warned about missing anime"),Promise.resolve();{let n="Couldn't find \""+anime.name+'"!';return Raven.isSetup()&&(n+=" A report has been created for you and you can expect for this anime to be available soon",Raven.captureMessage('Anime "'+anime.name+'" not found.',{level:"info"})),Cookies.set(e,"true",{expires:1}),showModal(n)}}let _animeUidCache;const anime={uid:null,name:null,episodesAvailable:null,status:null};let username,currentPlayer,currentEpisodeIndex$1,_urlWatcher;function setUsername(e){username=e}function prefetchNextEpisode(){console.log("api: prefetching next episode"),$.get(grobberUrl+"/anime/"+anime.uid+"/"+currentEpisodeIndex.toString()+"/preload")}function setupPlyr(){document.getElementById("player")?(currentPlayer=new Plyr("#player"),"true"===currentURL.searchParams.get("autoplay")&&currentPlayer.play(),currentPlayer.on("ended",onVideoEnd),window.addEventListener("beforeunload",onPageLeave)):console.warn("kitsu/pages/anime/episode: Couldn't find player, assuming this is an iframe!")}const adSearch=["Notice us","ads help us pay the bills"];function adRemove(){Array.from(document.getElementsByTagName("*")).filter(e=>{if(!e.firstChild)return;let n=e.firstChild.nodeValue;return n?Boolean(adSearch.find(e=>n.includes(e))):void 0}).forEach(e=>{for(let n=0;n<5;n++)e=e.parentElement;console.log("mal/ad-remove: removed ad",e,""),e.remove()})}function startAdObserver(){new MutationObserver(adRemove).observe(document.body,{childList:!0}),console.log("mal/ad-remove: observing body!"),adRemove()}class AnimeListEntry{constructor(e){this.el=e}get name(){return this.el.find("td.title a.link").text()}get safeName(){return safeMongoKey(this.name)}get link(){return this.el.find("td.title a.link").attr("href")}get uid(){var e=this;return _asyncToGenerator(function*(){return e._uid||(e._uid=yield findAnimeUID(e.name)),e._uid})()}get uidValid(){var e=this;return _asyncToGenerator(function*(){return(yield e.uid)&&e.episodesAvailable>=0})()}get episodesPreviouslyAvailable(){return this._episodesPreviouslyAvailable}set episodesPreviouslyAvailable(e){this._episodesPreviouslyAvailable=e}get episodesAvailable(){return isNaN(this._episodesAvailable)?this.episodesPreviouslyAvailable:this._episodesAvailable}set episodesAvailable(e){this._episodesAvailable=e}get currentEpisode(){return parseInt(this.el.find("td.progress span a").text())}get nUnseenEpisodes(){return this.episodesAvailable-this.currentEpisode||0}get nNewEpisodes(){return this.episodesAvailable-this.episodesPreviouslyAvailable||0}removePrevious(){this.el.find(".episode-status").remove()}show(){var e=this;return _asyncToGenerator(function*(){let n,t,o;const i=["content-status","episode-status"];if((yield e.uidValid)?e.nNewEpisodes>0?(n=1===e.nNewEpisodes?"new episode!":"new episodes!",i.push("new-episode"),t="There "+(1===e.nNewEpisodes?"is an episode":"are "+e.nNewEpisodes.toString()+" episodes")+" you haven't watched yet!",o=e.link+"/episode/"+(e.currentEpisode+1).toString()):e.nUnseenEpisodes>0&&(n=1===e.nUnseenEpisodes?"unseen episode!":"unseen episodes!",i.push("unseen-episode"),t="There "+(1===e.nUnseenEpisodes?"is an episode":"are "+e.nUnseenEpisodes.toString()+" episodes")+" you haven't watched yet!",o=e.link+"/episode/"+(e.currentEpisode+1).toString()):(yield e.uid)?(n="uid invalid",t="There was a UID cached but the server didn't accept it. Just open the anime page and it should fix itself"):(n="unknown uid",t="There was no UID cached. Just open the anime page and it should fix itself"),n){const a=e.el.find("td.title span.content-status");let r;e.removePrevious(),a.is(":visible")&&(n="| "+n),(r=o?$("<a></a>").attr("href",o):$("<span></span>")).text(n),i.forEach(function(e){return r.addClass(e)}),t&&(r.attr("data-balloon-pos","up"),r.attr("data-balloon",t)),a.after(r)}})()}}function injectRandomAnimeButton(){const e=$("#show-stats-button");e.clone().attr("id","open-random-anime").html('<i class="fa fa-random"></i> Random Anime').click(function(){let e;for(;;){const n=$(randomItem($("tbody.list-item td.title")));if("Not Yet Aired"!==n.find("span.content-status").text()){e=n.find("a.link");break}}console.log('mal/pages/list: randomly selected "',e.text(),'"'),window.location.href=e.attr("href")}).insertBefore(e)}function showAnimeList(){const e=parseInt(currentURL.searchParams.get("status"));highlightAnimeWithUnwatchedEpisodes(),6===e&&injectRandomAnimeButton()}function isMobilePage(){let e=null;return null===e&&(e=!!document.querySelector("a.footer-desktop-button")),e}function addSettingsButton(){const e=document.querySelector("div#horiznav_nav ul");if(e){console.log("mal/pages/settings: Attaching MyAnimeStream settings");const n=document.createElement("li"),t=document.createElement("a");t.setAttribute("href","/editprofile.php?go=myanimestream"),t.innerText="MyAnimeStream",n.appendChild(t),e.appendChild(n)}else console.log("mal/pages/settings: Couldn't find navbar. Not adding Settings!"),Raven.captureMessage("Couldn't add MyAnimeStream settings button (nav not found)",{level:"warning"})}function formParseValue(e){switch(e){case"true":return!0;case"false":return!1}}function showAnimeDetails(){const e=document.getElementById("myinfo_watchedeps"),n=$("div.user-status-block.js-user-status-block"),t=parseInt(e.getAttribute("value"))+1||1;if(t<=anime.episodesAvailable){const e=new URL(window.location.href);e.pathname+="/episode/"+t.toString(),e.searchParams.set("autoplay","true"),$("<a></a>").text((1===t?"Start":"Continue")+" Watching").addClass("inputButton btn-middle").css("padding","4px 12px").css("margin-left","8px").css("color","white").attr("href",e.toString()).appendTo(n)}}let currentPlayer$1,currentEpisodeIndex$2;function setupPlyr$1(){if(document.getElementById("player")){currentPlayer$1=new Plyr("#player"),"true"===new URL(window.location.href).searchParams.get("autoplay")&&currentPlayer$1.play(),currentPlayer$1.on("ended",onVideoEnd$1),window.addEventListener("beforeunload",onPageLeave$1)}else console.warn("mal/pages/anime/episode: Couldn't find player, assuming this is an iframe!")}function prefetchNextEpisode$1(){console.log("mal/pages/anime/episode: prefetching next episode"),$.get(grobberUrl+"/anime/"+anime.uid+"/"+currentEpisodeIndex$2.toString()+"/preload")}function fixEpisodePagination(e){const n=document.querySelector("div.pagination");if(n&&(console.log("mal/pages/anime/episodes: removing existing pagination"),n.parentElement.remove()),anime.episodesAvailable<=100)return void console.log("mal/pages/anime/episodes: no pagination needed");console.log("mal/pages/anime/episodes: building pagination");const t=$("<div></div>").addClass("pagination ac");if(e>200){const n=0===e?"link current":"link";t.append('<a class="'+n+'" href="?offset=0">1 - 100</a><span class="skip">&lt;</span>')}for(let n=Math.max(e-200,0);n<Math.min(e+300,anime.episodesAvailable);n+=100){const o=e===n?"link current":"link";t.append('<a class="'+o+'" href="?offset='+n+'">'+(n+1).toString()+" - "+Math.min(n+100,anime.episodesAvailable).toString()+"</a>")}if(anime.episodesAvailable-e>300){const n=100*Math.floor((anime.episodesAvailable-1)/100),o=e===n?"link current":"link";t.append('<span class="skip">&gt;</span><a class="'+o+'" href="?offset='+n+'">'+n.toString()+" - "+anime.episodesAvailable.toString()+"</a>")}$('<div class="mt12 mb12"></div>').append(t).insertAfter("div.js-scrollfix-bottom-rel>div>table")}function determineAnimeStatus(){return document.querySelector("a#myinfo_status")?"ABSENT":document.querySelector("select#myinfo_status > [selected]").text.toUpperCase()}function patchNoEpisodeTab(){if(!document.querySelector('li a[href$="/episode"]')){console.log("mal/pages/anime/_router: No Episodes tab found, building my own");const e=document.querySelector("div#horiznav_nav li:nth-child(2)"),n=$("<li><a href="+window.location.pathname+"/episode/1>Watch</a></li>");document.querySelector("a.horiznav_active")||n.find("a").addClass("horiznav_active"),n.insertAfter(e)}}const settingPaths=["/editprofile.php","/notification/setting","/ownlist/style","/account/payment"];function addUserContext(){Raven.isSetup()&&(setUsername(unsafeWindow.MAL.USER_NAME),username?(console.log("mal/index: Set user context for",username,""),Raven.setUserContext({username:username,mobile:isMobilePage()})):console.log("mal/index: Not logged in"))}const currentURL=new URL(window.location.href);function init(){let e;switch(currentURL.hostname){case"myanimelist.net":console.info("core: routing MyAnimeList"),e=route$3;break;case"kitsu.io":console.info("core: routing Kitsu"),e=route$1}e&&e(currentURL.pathname),checkForUpdate()}function _init(){$$1(init)}return Raven.config(ravenDSN,{release:GM_info.script.version,tags:{manager_version:GM_info.version},whitelistUrls:[/userscript\.html/g]}).install(),console.info("core: Using Raven DSN!"),Raven.context(_init),exports.currentURL=currentURL,exports}({},jQuery,Raven,Cookies,Plyr);
