$(document).ready(function() {
	
	var sendChannel, receiveChannel;

	var startButton = document.getElementById('startButton');
	var sendButton = document.getElementById('sendButton');
	var closeButton = document.getElementById('closeButton');

	startButton.disabled = false;
	sendButton.disabled = true;
	closeButton.disabled = true;

	startButton.onclick = createConnection;
	sendButton.onclick = sendData;
	closeButton.onclick = CloseDataChannels;

	function log(text){
		console.log("At time: " + (performance.now() / 1000).toFixed(3) +  " ----> " + text);
	}

	function createConnection() {
		if(navigator.webkitGetUserMedia){
			RTCPeerConnection = webkitRTCPeerConnection;
		}
		else if(navigator.mozGetUserMedia){
			RTCPeerConnection = mozRTCPeerConnection;
			RTCSessionDescription = mozRTCSessionDescription;
			RTCIceCandidate = mozRTCIceCandidate;
		}

		log("RTCPeerConnection object: " + RTCPeerConnection);

		var server = null;

		var pc_contraints = {
			'optional':[
			{'DtlsSrtpKeyAgreement': true}
			]
		};

		localPeerConnection = new RTCPeerConnection(server, pc_contraints);

		try{
			sendChannel =localPeerConnection.createDataChannel(
				"sendDataChannel",{reliable: true}
				);

			log("Create reliable send data channel");
		}
		catch(e){
			alert('Failed to create data channel' + e);
		}

		localPeerConnection.onicecandidate = gotLocalCandidate;

		sendChannel.onopen = handSendChannelStateChange;
		sendChannel.onclose = handSendChannelStateChange;

		window.remotePeerConnection = new RTCPeerConnection(server, pc_contraints);

		log("Create remite peer connection object , with DataChannel");

		remotePeerConnection.onicecandidate = gotRemoteCandidate;
		remotePeerConnection.ondatachannel = gotReceiveChannel;
		
		localPeerConnection.createOffer(gotLocalDescription,onSignalingError);

		startButton.disabled = true;
		closeButton.disabled = false;
	}
	function onSignalingError(error){
		log("Failed to create signaling message " + error.name);
	}

	function sendData(){
		var data  = document.getElementById('dataChannelSend').value;
		sendChannel.send(data);
		log("Send data: " + data);
	}

	function CloseDataChannels(){
		log('Closing data channels');
		sendChannel.close();
		log('Closed data channel with label :' + sendChannel.label);
		receiveChannel.close();
		log('Closed data channel with label');
		localPeerConnection.close();
		remotePeerConnection.close();
		log('Closed peer connections');

		startButton.disabled = false;
		sendButton.disabled = true;
		closeButton.disabled = true;

		dataChannelSend.value = "";
		dataChannelReceive.value = "";
		dataChannelSend.disabled = true;
		dataChannelSend.placeholder = "1: Press Start;\
		2: Enter text\
		3: Press Send.";
	}

	function gotLocalDescription(desc){
		localPeerConnection.setLocalDescription(desc);
		log('localDescriptionConnection\'s SDP: \m' + desc.sdp);
		remotePeerConnection.setRemoteDescription(desc);
		remotePeerConnection.createAnswer(gotRemoteDescription, onSignalingError);
	}

	function gotRemoteDescription(desc){
		remotePeerConnection.setLocalDescription(desc);
		log("gotRemoteDescription SDP :" + desc.sdp);

		localPeerConnection.setRemoteDescription(desc);
	}

	function gotLocalCandidate(event){
		if(event.candidate){
			remotePeerConnection.addIceCandidate(event.candidate);
			log("local ICE candidate: \n" + event.candidate.candidate);
		}
	}


	function gotRemoteCandidate(event){
		if(event.candidate){
			localPeerConnection.addIceCandidate(event.candidate);
			log("remote ICE candidate: \n" + event.candidate.candidate);
		}
	}

	function gotReceiveChannel(event){
		log("Received Channel Callback: event --> " + event);

		receiveChannel = event.channel;

		receiveChannel.onopen = handleReceiveChannelStateChange;
		receiveChannel.onmessage = handleMessage;
		receiveChannel.onclose = handleReceiveChannelStateChange;

	}

	function handleMessage(event){
		log('Received message: ' + event.data);
		document.getElementById('dataChannelReceive').value = event.data;
		document.getElementById('dataChannelSend').value = '';
	}

	function handSendChannelStateChange(){
		var readyState = sendChannel.readyState;
		log("Send channel state is: " + readyState);

		if(readyState == 'open'){
			dataChannelSend.disabled = false;
			dataChannelSend.focus();
			dataChannelSend.placeholder = "";
			sendButton.disabled = false;
			closeButton.disabled = false;

		}
		else{
			dataChannelSend.disabled = true;
			sendButton.disabled = true;
			closeButton.disabled = true;
		}
	}

	function handleReceiveChannelStateChange(){
		var readyState = receiveChannel.readyState;
		log("Received channel state is: " + readyState);
	}
});


