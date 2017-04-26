﻿// This is all pretty bad code. Should be thoroughly reorganized.

// TODO: find a better way to expose these functions to html?
(<any>window).onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
(<any>window).ytApiReady = ytApiReady;
(<any>window).queueSelectedVideo = queueSelectedVideo;
(<any>window).requestSyncWithUser = requestSyncWithUser;
(<any>window).deleteMedia = deleteMedia;

import { MyUser, Media, Session, UserState, WsMessage } from "./Contracts";
import { UICallbacks, UI } from "./UI";
import { MySocket } from "./Sockets"
import { Player } from "./Player"

declare var mobileBrowser: boolean;
declare var gapi: any;

var mUser = new MyUser();
var mSession = new Session();
var mPlayer = new Player(mobileBrowser);
var mSocket: MySocket;
var mUI: UI;

$(document).ready(function () {

    var callbacks = new UICallbacks();
    callbacks.onSendChatMessage = sendChatMessage;
    callbacks.nameChange = saveUserNameChange;
    callbacks.nextMedia = nextVideoInQueue;
    callbacks.pauseMedia = pauseVideo;
    callbacks.playMedia = playVideo;
    callbacks.previousMedia = previousVideoInQueue;
    callbacks.search = searchVideos;

    mUI = new UI(mobileBrowser, callbacks);
    mSocket = new MySocket(mMessageFunctions);

    setupJamSession();
});


function setupJamSession() {
	var pathname = window.location.pathname;
	var encodedSessionName = pathname.replace('\/rooms/', '');

    mSession.Name = decodeURI(encodedSessionName);
    mUser.Name = 'Anonymous';

    var message = new WsMessage();
    message.Action = 'UserJoinSession';
    message.User = mUser;
    message.Session = mSession;

	mSocket.emit(message);
}

//==================================================================
// Functions automatically called when youtube api's are ready
//==================================================================
function onYouTubeIframeAPIReady() {
    mPlayer.initializeYtPlayer(onPlayerStateChange);
}

function ytApiReady() {
	gapi.client.setApiKey("AIzaSyC4A-dsGk-ha_b-eDpbxaVQt5bR7cOUddc");
	gapi.client.load("youtube", "v3", function() {});
}

function onPlayerStateChange(event) {
    if(event.data==0) {
    	nextVideoInQueue();
    }
}

//==================================================================
// WebSocket message response functions
//==================================================================

var mMessageFunctions = {
    'updateUser': onUpdateMeUser,
    'sessionReady': onSessionReady,
    'updateUsersList': onUpdateUsersList,
    'updateQueue': onUpdateQueue,
    'ChatMessage': onReceivedChatMessage,
    'requestUserState': onRequestMyUserState,
    'provideUserState': onUserStateProvided
}

function onUserStateProvided(message: WsMessage) {
    var userToSyncWith = message.User;

    mUser.State.QueuePosition = userToSyncWith.State.QueuePosition;
    mUser.State.Time = userToSyncWith.State.Time;
    mUser.State.YTPlayerState = userToSyncWith.State.YTPlayerState;

    mUI.updateQueue(mSession.Queue, mUser.Id, mUser.State.QueuePosition);

    var currentMedia = mSession.Queue[mUser.State.QueuePosition];

    userStateChange();
}

function onRequestMyUserState(message: WsMessage) {
    var userData = new MyUser();
    userData.Id = message.User.Id; // TODO: bad bad bad
    userData.State.QueuePosition = mUser.State.QueuePosition;
    userData.State.Time = Math.round(mPlayer.getCurrentTime());
    userData.State.YTPlayerState = mPlayer.getCurrentState();

    var outgoingMsg = new WsMessage();
    outgoingMsg.Action = 'ProvideSyncToUser';
    outgoingMsg.User = userData;
    mSocket.emit(outgoingMsg);
}


function onUpdateMeUser(message: WsMessage) {
    var user = message.User;
    mUser = user;	
}

function onSessionReady(message: WsMessage) {
    mSession = message.Session;
    mUser = message.User;

    // TODO: get rid of this bullshit
    if (mSession.Queue.length == 0) {
		$("#p_current_content_info").text("Queue up a song!");
		$("#p_current_recommender_info").text("Use the search bar above.");
	}

    nextVideoInQueue();
    mUI.updateQueue(mSession.Queue, mUser.Id, mUser.State.QueuePosition);
    mUI.updateUsersList(mSession.Users, mUser.Id);
    mUI.sessionReady();
}

function onUpdateUsersList(message: WsMessage) {
    var users = message.Session.Users;
    mSession.Users = users;
    mUI.updateUsersList(mSession.Users, mUser.Id);	
}

function onUpdateQueue(message: WsMessage) {
    mSession.Queue = message.Session.Queue;
    if (mUser.State.Waiting) {
        nextVideoInQueue();
    }
    mUI.updateQueue(mSession.Queue, mUser.Id, mUser.State.QueuePosition);
}

function onReceivedChatMessage(message: WsMessage) {
    var chatMessage = message.ChatMessage;
    var userName = message.User.Name;
    mUI.onChatMessage(userName, chatMessage);
}

function sendChatMessage(msg: string) {
    var message = new WsMessage();
    message.Action = 'ChatMessage';
    message.ChatMessage = msg;
    message.User = mUser;
    mSocket.emit(message);
}

function searchVideos(query, callback) {
	var request = gapi.client.youtube.search.list({
        part: "snippet",
        type: "video",
	    q: encodeURIComponent(query).replace(/%20/g, "+"),
	    maxResults: 5
    });

	request.execute(callback);
}

function saveUserNameChange(newName) {
    mUser.Name = newName;
    var message = new WsMessage();
    message.User = mUser;
    message.Action = 'SaveUserNameChange';
    mSocket.emit(message);
}

function userStateChange() {
    if (mUser.State.QueuePosition >= 0 && mUser.State.QueuePosition < mSession.Queue.length) {
        mPlayer.setPlayerContent(mSession.Queue[mUser.State.QueuePosition], mUser.State.Time); 
        mUser.State.Waiting = false;
    }
    else if (mUser.State.QueuePosition < 0 || mUser.State.QueuePosition == mSession.Queue.length) {
        // TODO: set player content to 'waiting on next video'
        mUser.State.Waiting = true;
    }
    else if (mUser.State.QueuePosition == mSession.Queue.length) {
    }
}

function nextVideoInQueue() {
    mUser.State.Time = 0;
    var queue = mSession.Queue;

	if(mUser.State.QueuePosition + 1 < queue.length) {
        mUser.State.QueuePosition = mUser.State.QueuePosition + 1;
    }
    else if (mUser.State.QueuePosition >= 0) {
        mUser.State.QueuePosition = queue.length;
	}

    userStateChange();
}

function pauseVideo() {
    mPlayer.pause();
}

function playVideo() {
    mPlayer.play();
}

function previousVideoInQueue() {
    mUser.State.Time = 0;
    var queue = mSession.Queue;
	if(mUser.State.QueuePosition > 0) {
        mUser.State.QueuePosition = mUser.State.QueuePosition - 1;
        userStateChange();
	}
}


//==================================================================
// These functions are called directly embedded into the html... kinda weird
//==================================================================

function requestSyncWithUser(userId) {
    console.log('request sync with user');

    var user = new MyUser();
    user.Id = userId;
    var message = new WsMessage();
    message.Action = 'RequestSyncWithUser';
    message.User = user;
    mSocket.emit(message);
}

function queueSelectedVideo(elmnt) {

	$("#div_search_results").fadeOut();
	$("#input_search").val("");
	var VideoId = elmnt.getAttribute('data-VideoId');
	var Title = elmnt.innerText || elmnt.textContent;
	var ThumbURL = elmnt.getAttribute('data-ThumbURL');

    var media = new Media();
    media.YTVideoID = VideoId;
    media.VideoTitle = Title;
    media.ThumbURL = ThumbURL;
    media.UserId = mUser.Id;
    media.UserName = mUser.Name;

    var message = new WsMessage();
    message.Action = 'AddMediaToSession';
    message.Media = media;

    //TODO: local add media
    mSocket.emit(message);
}

function deleteMedia(mediaId: number, position: number) {

    mSession.Queue.splice(position, 1);
    if (mUser.State.QueuePosition >= position) {
        mUser.State.QueuePosition -= 1;
        userStateChange();
    }
    mUI.updateQueue(mSession.Queue, mUser.Id, mUser.State.QueuePosition);

    var mediaToDelete = new Media();
    mediaToDelete.Id = mediaId;

    var message = new WsMessage();
    message.Action = 'DeleteMediaFromSession';
    message.Media = mediaToDelete;

    mSocket.emit(message);
}