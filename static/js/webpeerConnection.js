$(document).ready(function() {
	// JavaScript variables holding stream and connection information
	var localStream, localPeerConnection, remotePeerConnection;

// JavaScript variables associated with HTML5 video elements in the page
var localVideo = document.getElementById('localVideo');

var remoteVideo = document.getElementById('remoteVideo');

// JavaScript variables assciated with call management buttons in the page
var startButton = document.getElementById('startButton');
var callbutton = document.getElementById('callbutton');
var hangupButton  = document.getElementById('hangupButton');

// Just allow the user to click on the Call button at start-up
startButton.disabled = false;
callButton.disabled  = true;
hangupButton.disabled = true;


// Associate JavaScript handlers with click events on the buttons
startButton.onclick  = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

// Utility function for logging information to the JavaScript console
function log(text){
	console.log("At time: " + (performance.now()/ 1000).toFixed(3) + ' ----> ' + text);
}



function successCallback(stream){
	log("Received local stream");

	if(window.URL){
		localVideo.src = URL.createObjectURL(stream);
	}
	else{
		localVideo.src = stream;
	}

	localStream = stream;

	callButton.disabled = false;
}

// Function associated with clicking on the Start button
// This is the event triggering all other actions

function start(){
	log("Request local stream");

	startButton.disabled = true;

	navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

	navigator.getUserMedia({
		audio: true,
		video:true
	},
	successCallback
	,function(error){
		log("navigator.getUserMedia error: ", error);
	});
}


function call(){
	callButton.disabled = true;

	hangupButton.disabled = false;
	log("Starting call");

	if(navigator.webkitGetUserMedia){
		if(localStream.getVideoTracks().length > 0){
			log("Using video device: " + localStream.getVideoTracks()[0].label);
		}
		if(localStream.getAudioTracks().length > 0){
			log("Using audio device: " + localStream.getAudioTracks()[0].label);
		}
	}

	if(navigator.webkitGetUserMedia){
		RTCPeerConnection = webkitRTCPeerConnection;
	}
	else if(navigator.mozGetUserMedia){
		RTCPeerConnection = mozRTCPeerConnection;
		RTCSessionDescription = mozRTCSessionDescription;
		RTCIceCandidate = mozRTCIceCandidate;
	}

	log("RTCPeerConnection object" + RTCPeerConnection);

	var server = null;

	localPeerConnection = new RTCPeerConnection(server);
	log("Created local peer connection object localPeerConnection");

	localPeerConnection.onicecandidate = gotLocalIceCandidate;
	remotePeerConnection = new RTCPeerConnection(server);

	log("Created remote peer connection object localPeerConnection");
	remotePeerConnection.onicecandidate = gotRemoteIceCandidate;

	remotePeerConnection.onaddstream = gotRemoteStream;

	localPeerConnection.addStream(localStream);
	log("Added localStream to localPeerConnection");

	localPeerConnection.createOffer(gotLocalDescription, onSignlingError);
}

function onSignlingError(error){
	console.log('FAiled to create signling message: ' + error.name);
}

function gotLocalDescription(description){
	localPeerConnection.setLocalDescription(description);
	log("Offer from localPeerConnection: \n" + description.sdp);
	remotePeerConnection.setRemoteDescription(description);
	remotePeerConnection.createAnswer(gotRemoteDescription, onSignlingError)
}

function gotRemoteDescription(description){
	remotePeerConnection.setLocalDescription(description);
	log("Answer from remotePeerConnection: \n" + description.sdp);

	localPeerConnection.setRemoteDescription(description)
}

function hangup(){
	log("Ending Call");
	localPeerConnection.close();
	remotePeerConnection.close();
	localPeerConnection = null;
	remotePeerConnection = null;

	hangupButton.disabled = true;
	callButton.disabled = false;
}

function gotRemoteStream(event){
	if(window.URL){
		remoteVideo.src = window.URL.createObjectURL(event.stream);
	}
	else{
		remoteVideo.src = event.stream;
	}
	log("Received remote stream");
}

function gotLocalIceCandidate(event){
	if(event.candidate){
		remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
		log("Local ICE candidate: \n" + event.candidate.candidate);
	}
}

function gotRemoteIceCandidate(event){
	if(event.candidate){
		localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
		log("Local ICE candidate: \n" + event.candidate.candidate);
	}
}

});






