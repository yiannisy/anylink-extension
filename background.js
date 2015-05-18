var proxy_url='http://cookie.stanford.edu:8080'

var profiles = {};
var active_profile = -1;
var active = false;

/**
 * Returns a random alphanumeric string.
 */
function getRandomID() {
    return Math.random().toString(36).slice(2);
}

function generateCookieDescriptor() {
    var chip = Math.floor(Math.random()*(Math.pow(2,32) -1 ));
    var seed = getRandomID();
    var descriptor = new CookieDescriptor(chip, seed);
    return descriptor;
}

function storeProfile(profile, descriptor) {
    var _profile = {id:profile.id, name:profile.name, settings:profile.content, cookie_descriptor:descriptor}
    profiles[_profile.id] = _profile;
}

function activateProfile(id) {
    console.log("setting active profile with id ", id);
    active_profile = id;
    if (active == false) {
	setProxy();
	startCookieAdder();
	active = true;
    }
}

/**
 * Translate dictionary to list in order to fit Angularjs ng-repeat.
 */
function getProfiles() {
    var _profiles = [];
    for( id in profiles ) {
	_profiles.push(profiles[id]);
    }
    return _profiles;
}

function stop() {
    active_profile = -1;
    stopCookieAdder();
    unsetProxy();
    active = false;    
}

/**
 * Stop adding cookies but keep the proxy enabled
 * to check the baseline performance.
 */
function activateProxyBaseline() {
    active_profile = -1;
    stopCookieAdder();
    active = false;
    setProxy();
}

function addCookie(details) {
    var headers = details.requestHeaders;
    cookie = profiles[active_profile].cookie_descriptor.generateCookie().toString();
    headers.push({name:'network-cookie', value:cookie});
    return { requestHeaders: headers };
}

function startCookieAdder() {
    chrome.webRequest.onBeforeSendHeaders.addListener(addCookie, 
						      {urls:["<all_urls>"]},
						      ['requestHeaders','blocking']);
}

function stopCookieAdder() {
    chrome.webRequest.onBeforeSendHeaders.removeListener(addCookie);
}

function setProxy() {
    var config = {
	mode: 'fixed_servers',
	rules: {
	    proxyForHttp: {
		scheme: "http",
		host: "cookie.stanford.edu",
		port: 8080
	    }
	}
    };
    chrome.proxy.settings.set({value: config, scope: 'regular'}, function() {});
}

function unsetProxy() {
    var config = {
	mode: 'direct'
    };
    chrome.proxy.settings.set({value: config, scope: 'regular'}, function() {});
}