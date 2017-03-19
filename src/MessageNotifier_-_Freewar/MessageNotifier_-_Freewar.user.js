// ==UserScript==
// @name        MessageNotifier - Freewar
// @namespace   Zabuza
// @description Watches the chat and plays a notification sound everytime a new message arrives. Supports adjustable filters.
// @include     *.freewar.de/freewar/internal/chattext.php*
// @version     1
// @require http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @grant       none
// ==/UserScript==

/*
 * Creates a cookie with the given data. If the cookie already exists, it is overriden.
 * @param name The name of the cookie to create
 * @param value The value of the cookie to create
 * @param days The amount of days the cookie should exist until it expires
 */
function createCookie(name, value, days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		var expires = '; expires=' + date.toGMTString();
	} else {
		var expires = '';
	}
	document.cookie = name + '=' + value + expires + '; path=/';
}

/*
 * Gets the content of the cookie with the given name
 * @param c_name The name of the cookie to get
 * @returns The content of the given cookie
 */
function getCookie(c_name) {
	var i, x, y, ARRcookies = document.cookie.split(';');
	for (i = 0; i < ARRcookies.length; i++) {
		x = ARRcookies[i].substr(0, ARRcookies[i].indexOf('='));
		y = ARRcookies[i].substr(ARRcookies[i].indexOf('=') + 1);
		x = x.replace(/^\s+|\s+$/g,'');
		if (x == c_name) {
			return unescape(y);
		}
	}
}

/*
 * Sets the last arrived message. The message is saved via webstorage or as cookie.
 * @param message The message to set
 */
function setLastMessage(message) {
	// Abort if the message is invalid
	if (message == null) {
		return;
	}
	
	if (isSupportingWebStorage()) {
		// Use webstorage
		sessionStorage.setItem('freewarMessageNotifierLastMessage', message);
	} else {
		// Fall back to cookies
		createCookie('freewarMessageNotifierLastMessage', message + '', 2);
	}
}

/*
 * Gets the last arrived message. The message is saved via webstorage or as cookie.
 * @returns The last arrived message
 */
function getLastMessage() {
	var message;
	if (isSupportingWebStorage()) {
		// Use webstorage
		message = sessionStorage.getItem('freewarMessageNotifierLastMessage');
	} else {
		// Fall back to cookies
		message = getCookie('freewarMessageNotifierLastMessage');
	}
	
	// If the message does not exist, return an empty text
	if (message == null) {
		return '';
	} else {
		return message;
	}
}

/*
 * Checks whether the browser does support webstorage or not.
 * @returns True if it is supported, false if not
 */
function isSupportingWebStorage() {
	return typeof(Storage) !== "undefined";
}

/*
 * Checks whether the given element passes the filter or not.
 * @returns True if the element passes the filter, false if not
 */
function doesPassFilter(element) {
	if (filterSettings['directChat']) {
		if ($(element).hasClass('chattext')) {
			return true;
		}
	}
	
	if (filterSettings['clanChat']) {
		if ($(element).hasClass('chattextclan')) {
			return true;
		}
	}
	
	if (filterSettings['screamChat']) {
		if ($(element).hasClass('chattextscream')) {
			return true;
		}
	}
	
	if (filterSettings['groupChat']) {
		if ($(element).hasClass('chattextgroup')) {
			return true;
		}
	}
	
	if (filterSettings['globalChat']) {
		if ($(element).hasClass('chattextglobal')) {
			return true;
		}
	}
	
	if (filterSettings['whisperChat']) {
		if ($(element).hasClass('chattextwhisper')) {
			return true;
		}
	}
	
	if (filterSettings['worldsayChat']) {
		if ($(element).hasClass('chattextworldsay')) {
			return true;
		}
	}
	
	if (filterSettings['infoChat']) {
		if ($(element).hasClass('chattextinfo')) {
			return true;
		}
	}
	
	if (filterSettings['containsText'][0]) {
		var messageContent = $(element).text();
		var needle = filterSettings['containsText'][1];
		if (messageContent.includes(needle)) {
			return true;
		}
	}
	
	if (filterSettings['regexPattern'][0]) {
		var messageContent = $(element).text();
		var pattern = filterSettings['regexPattern'][1];
		if (pattern.test(messageContent)) {
			return true;
		}
	}
	
	return false;
}

/*
 * Processes the given message. If the message passes the filter and is not equal to
 * the last known message a notification sound will be played.
 * @returns 0 if the message was not new nor the last remembered message.
 *  1 if the message was the last remembered message.
 *  2 if the message was new.
 */
function processMessage(element) {
	// Ignore message if it does not pass the filter
	if (!doesPassFilter(element)) {
		return 0;
	}
	
	var messageContent = $(element).text();
	var lastMessage = getLastMessage();
	
	if (messageContent == lastMessage) {
		return 1;
	} else {
		// Remember the current message as new last message
		setLastMessage(messageContent);
		fireNotification();
		return 2;
	}
}

/*
 * Fires a notification sound.
 */
function fireNotification() {
	notificationSound.play();
}

/*
 * Routine function of the script.
 */
function routine() {
	var foundNewMessage = false;
	var foundLastMessage = false;
	// Iterate every message from newest to oldest
	$($('p').get().reverse()).each(function(index) {
		var status = processMessage(this);
		if (status == 1) {
			foundLastMessage = true;
		} else if (status == 2) {
			foundNewMessage = true;
		}
			
		// In either case abort the loop
		if (foundLastMessage || foundNewMessage) {
			return false;
		};
	});
	
	window.setTimeout(routine, 1000);
}

// ADJUST YOUR SETTINGS HERE

var notificationSound = document.createElement('audio');
// ENTER YOUR OWN SOUND FILE HERE
notificationSound.src = 'http://zabuza.square7.ch/freewar/notifier/notification2.mp3';
notificationSound.preload = 'auto';
// ADJUST THE VOLUME: 0.0 - silent, 1.0 - loud
notificationSound.volume = 0.5;

// ADJUST THE FILTER SETTINGS: true - triggers notification, false - gets ignored
var filterSettings = new Object();
filterSettings['directChat'] = false;
filterSettings['clanChat'] = true;
filterSettings['screamChat'] = false;
filterSettings['groupChat'] = true;
filterSettings['globalChat'] = false;
filterSettings['whisperChat'] = true;
filterSettings['worldsayChat'] = false;
filterSettings['infoChat'] = false;
filterSettings['containsText'] = [false, 'example text'];
filterSettings['regexPattern'] = [false, /example regex pattern/];

// Start the routine function
routine();