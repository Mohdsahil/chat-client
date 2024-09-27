import React, { useRef, useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';

import Peer from "peerjs";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});



const VideoChat = (props) => {
 
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerInstance = useRef(null);
  const callInstance = useRef(null); // To keep track of the call instance
  const currentStream = useRef(null); // To keep track of the call instance

  // Initialize PeerJS when component mounts
  useEffect(() => {
    console.log(":in useeffecr 1:")
    const peer = new Peer(); // Create a new PeerJS instance
    peerInstance.current = peer;

    peer.on("open", (id) => {
      props.setPeerId(id)
      console.log(`Peer connected with ID: ${id}`);
      // Notify server of the user's peer ID
      // props.socket.current.emit("add-user", id);
    });
    

    // Handle receiving a call
    peer.on("call", (call) => {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          currentStream.stream = stream;
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.onloadedmetadata = () => {
            localVideoRef.current.play().catch((error) => console.error("Error starting local video:", error));
          };
          // Answer the call with the user's video stream
          call.answer(stream);

          call.on("stream", (remoteStream) => {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.onloadedmetadata = () => {
              remoteVideoRef.current.play().catch((error) => console.error("Error starting local video:", error));
            };
          });

          callInstance.current = call;
        });
    });
  }, [props.socket]);

  // Function to start a video call
  const startCall = async () => {
    const user = await JSON.parse(localStorage.getItem("chat-app-user"));
    const callPeerId = props.remotePeerId; // Assuming the peerId is stored in the user object

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        currentStream.stream = stream;
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.onloadedmetadata = () => {
          localVideoRef.current.play().catch((error) => console.error("Error starting local video:", error));
        };

        const call = peerInstance.current.call(callPeerId, stream); // Make the call

        call.on("stream", (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.onloadedmetadata = () => {
            remoteVideoRef.current.play().catch((error) => console.error("Error starting remote video:", error));
          };
        });

        callInstance.current = call;
      });
  };

  useEffect(() => {
    if (props.remotePeerId) {
      startCall()
    }
  }, [props.remotePeerId])

  // const callRequest = async () => {

  //   const user = await JSON.parse(localStorage.getItem("chat-app-user"));

  //   props.socket.current.emit("call-user", {
  //     to: props.selectForCall._id,
  //     from: user._id,
  //   });
  //   props.setCalling(true)

  // }

  const acceptCall = async () => {
    const user = await JSON.parse(localStorage.getItem("chat-app-user"));

    props.socket.current.emit("accept-call", {
      to: props.callingRequest.from,
      peerId: props.peerId
    });
    props.setCallStarted(true)
  }

  // Function to disconnect the call

  const disconnect = () => {
    // Stop local video stream
       // Set the call state to false
       props.setCallStarted(false);
       props.setCalling(false)
       props.setCallingRequest({ status: false, from: '', fromName: '' });
       props.setRemotePeerId("")
      console.log(":currentStream:", currentStream)

    if (currentStream.stream) {
      currentStream.stream.getTracks().forEach((track) => track.stop());
      currentStream.current = null;
    }

    // Close the PeerJS call
    if (callInstance.current) {
      callInstance.current.close();
      callInstance.current = null;
    }
    

    // Reset video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

 
  }

  const disconnectCall = () => {
    console.log(":in disconnectCall:", props.callingRequest)
    props.socket.current.emit("call-disconnect", {
      to: props.callingRequest.from,
      peerId: props.peerId
    })

    disconnect()
  };

  console.log("props.callingRequest", props.callingRequest)

  useEffect(() => {
    if (props.callStarted == false) {
      disconnect()
    }
  }, [props.callStarted])

  return (


<React.Fragment>

<Dialog
  fullScreen
  open={props.calling || props.callStarted}
  // onClose={disconnectCall}
  TransitionComponent={Transition}
>
  <AppBar sx={{ position: 'relative', backgroundColor: '#fb587f' }}>
    <Toolbar>
     
      <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
        You are on call
      </Typography>
      <IconButton
        edge="start"
        color="inherit"
        onClick={disconnectCall}
        aria-label="close"
      >
        <CloseIcon />
      </IconButton>
    </Toolbar>
  </AppBar>
  <div style={{ textAlign: "center" }}>
          {/* Video Section */}
          <div className="video-section">
            <div>
              <h3>Partner</h3>  
              <video ref={remoteVideoRef} autoPlay 
                style={{
                   width: '100%',
                   maxWidth: '650px',
                }}
              />
            </div>
            <div>
              <h3>You</h3>
              <video ref={localVideoRef} autoPlay muted style={{ width: "135px" }} />
            </div>
            
          </div>

          {/* {props.callStarted && "Connected"} */}

          {/* {!props.callStarted && !props.callingRequest.status && !calling && <button onClick={callRequest}>Start Video Call</button>} */}

          {/* {!props.callStarted && props.callingRequest.status && <button onClick={acceptCall}>You have call from {props.callingRequest.from} Accept</button>} */}

          {props.calling && "Calling...."}

          {props.callStarted && <Button color="error" size="large" variant="contained" onClick={disconnectCall}>Disconnect</Button>}

        </div>
</Dialog>
</React.Fragment>


  );
};

export default VideoChat;
