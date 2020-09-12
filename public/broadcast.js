const peerConnections = {};
var connected = 0;
var broadcasterId;
const config = {
  iceServers: [
    { url: 'stun:stun.l.google.com:19302' },
    // { url: 'stun:stun1.l.google.com:19302' },
    // { url: 'stun:stun2.l.google.com:19302' },
    // { url: 'stun:stun3.l.google.com:19302' },
    // { url: 'stun:stun4.l.google.com:19302' },
    // { 
    //   "urls": "turn:TURN_IP?transport=tcp",
    //   "username": "TURN_USERNAME",
    //   "credential": "TURN_CREDENTIALS"
    // }
  ]
};

const socket = io.connect(window.location.origin);

socket.on("answer", (id, description) => {
  peerConnections[id].setRemoteDescription(description);
});

socket.on("watcher", id => {
  const peerConnection = new RTCPeerConnection(config);
  peerConnections[id] = peerConnection;

  let stream = videoElement.srcObject;
  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };

  peerConnection
    .createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("offer", id, peerConnection.localDescription);
    });
});

socket.on("candidate", (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("broadcasterUniqueCheckResponse", (isUnique) => {
  if (isUnique) {
    socket.emit("broadcaster", broadcasterId);
    document.getElementById('broadcaster-join-id').style.border = '1px solid green';
    document.getElementById("btn-start-share").disabled = false;
  } else {
    document.getElementById('broadcaster-join-id').style.border = '1px solid red';
    document.getElementById("btn-start-share").disabled = true;
  }
});

socket.on("disconnectPeer", id => {
  peerConnections[id].close();
  delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
};

const videoElement = document.querySelector("video");
const audioSelect = document.querySelector("select#audioSource");
const videoSelect = document.querySelector("select#videoSource");

// audioSelect.onchange = getStream;
// videoSelect.onchange = getStream;



let constraints = {
  video: {
    mediaSource: "screen",
    // width: { exact: 640 }, height: { exact: 480 }
  }
};

function getDevices() {
  return navigator.mediaDevices.getUserMedia(constraints);
}

function gotDevices(deviceInfos) {
  deviceInfos[0] = deviceInfos;
  window.deviceInfos = deviceInfos;
}

var promisifiedOldGUM = function (constraints) {

  // First get ahold of getUserMedia, if present
  var getUserMedia = (navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia);

  // Some browsers just don't implement it - return a rejected promise with an error
  // to keep a consistent interface
  if (!getUserMedia) {
    return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
  }

  // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
  return new Promise(function (resolve, reject) {
    getUserMedia.call(navigator, constraints, resolve, reject);
  });

}

function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const constraints = {
    audio: true,
    video: {
      mediaSource: "screen",
      cursor: "always",
      frameRate: { ideal: 10, max: 15 }
    }
  };
  if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {};
  }

  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = promisifiedOldGUM;
  }

  return navigator.mediaDevices
    .getDisplayMedia(constraints)
    .then(gotStream)
    .catch(handleError);
}

async function gotStream(stream) {
  window.stream = stream;
  videoElement.srcObject = stream;
  socket.emit("broadcaster", broadcasterId);
  document.getElementById('btn-start-share').style.display = 'none';
  document.getElementById('btn-stop-share').style.display = 'block';
}

function handleError(error) {
  console.error("Error: ", error);
}

function stopStream(evt) {
  document.getElementById('btn-start-share').style.display = 'block';
  document.getElementById('btn-stop-share').style.display = 'none';
  let tracks = videoElement.srcObject.getTracks();
  tracks.forEach(track => track.stop());
  videoElement.srcObject = null;
}

function isUnique(newBroadcasterId) {
  broadcasterId = newBroadcasterId;
  socket.emit('checkIsBroadcasterIdUnique', broadcasterId)
}