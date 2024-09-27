import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios';
import styled from "styled-components";
import { useNavigate } from 'react-router-dom';
import { allUsersRoute} from '../utils/APIroute';
import APP_HOST from '../configs/envVariables';
import Contacts from '../components/Contacts';
import NoSelectedContact from '../components/NoSelectedContact';
import ChatContainer from '../components/ChatContainer';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'
import { ToastContainer } from 'react-toastify';
import {io} from "socket.io-client";
import VideoChat from "../components/VideoChat";
import VideoCallRequest from '../components/VideoCallRequest';
import { useMediaQuery, Button} from "@mui/material"

function Chat() {
  console.log(APP_HOST);
  const socket = useRef();

  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [currentUser, setCurrentUser] = useState();
  const [currentChat, setCurrentChat] = useState(null)
  const [isLoading, setIsLoading] = useState(false);
  const [calling, setCalling] = useState(false)
  const [callingRequest, setCallingRequest] = useState({ status: false, from: '', fromName: '' })
  const [callStarted, setCallStarted] = useState(false)
  const [peerId, setPeerId] = useState('')
  const [remotePeerId, setRemotePeerId] = useState("")

  const [menuopen, setOpenmenu] = useState(false)

  const getUser = async()=>{
    const user = await JSON.parse(localStorage.getItem('chat-app-user'));
    setCurrentUser(user);
  }

  const getContacts = async()=>{
    const contacts = await axios.get(`${allUsersRoute}/${currentUser._id}`);
    setContacts(contacts.data)
    setIsLoading(false);
  }

  const handleChatChange = (chat)=>{
      setCurrentChat(chat);
  }

  useEffect(()=>{
    if(!localStorage.getItem('chat-app-user')){
      navigate("/login");
    }
    else{
      socket.current = io(APP_HOST);
      getUser();
    }
  },
  // eslint-disable-next-line
  []) 

  useEffect(()=>{
    
    if(currentUser){
      socket.current.emit("add-user", currentUser._id);
    }
  },[currentUser]);

  useEffect(()=>{
    if(currentUser){
      setIsLoading(true);
      getContacts();
    }
  },
  // eslint-disable-next-line
  [currentUser])

  useEffect(() => {
    if (socket.current) {
      socket.current.on("receive-call", (data) => {
        console.log("in chat.jsx data: ", data)
        setCallingRequest({ status: true, from: data.from, fromName: data.fromName  });
      });

      socket.current.on("call-accepted", (data) => {
        setRemotePeerId(data.peerId);
        setCallingRequest({ status: true, from: data.from, fromName: data.fromName });
        console.log("Chat.jsx Call accepted: ", data)
        setCallStarted(true)
        setCalling(false)
      });

      socket.current.on("call-disconnected", (data) => {
        console.log("Call ended by other user")
        setCallStarted(false)
      });
    }
  }, [])

  const callRequest = async () => {

    const user = await JSON.parse(localStorage.getItem("chat-app-user"));

    socket.current.emit("call-user", {
      to: currentChat._id,
      from: user._id,
      fromName: user.username,
    });
    setCalling(true)

  }

  const acceptCall = async () => {
    const user = await JSON.parse(localStorage.getItem("chat-app-user"));

    socket.current.emit("accept-call", {
      to: callingRequest.from,
      from: user._id,
      peerId
    });
    setCallStarted(true)
  }

  const matches = useMediaQuery('(max-width:600px)');

  return (
    <Container>
      <div className='container'>

      {
        matches &&
          (isLoading ? 
          <div >
            <Skeleton count={5}/> 
            <Skeleton count={5}/> 
            <Skeleton count={5}/> 
          </div>
          : 
              <>
              {currentChat ?
              <ChatContainer changeChat={handleChatChange} currentChat={currentChat} socket={socket} callRequest={callRequest} calling={calling} setCalling={setCalling} />
              :
              <Contacts contacts={contacts} currentUser={currentUser} changeChat = {handleChatChange} loading={isLoading}/>
              }
              </>)
           
            
        }
      

        <>
        {!matches && 
        <>
        {
          isLoading ? 
          <div style={{height : "100vh"}}>
            <Skeleton count={5}/> 
            <Skeleton count={5}/> 
            <Skeleton count={5}/> 
          </div>
          : 
          <Contacts contacts={contacts} currentUser={currentUser} changeChat = {handleChatChange} loading={isLoading}/>
        }
        {
          currentChat && (
            <>
            <ChatContainer changeChat={handleChatChange} currentChat={currentChat} socket={socket} callRequest={callRequest} calling={calling} setCalling={setCalling} />
            </>
          ) 
          // : <NoSelectedContact/>
        }
        </>
      }
      </>
        <VideoChat 
          socket={socket} 
          callStarted={callStarted} 
          setCallStarted={setCallStarted} 
          setPeerId={setPeerId} 
          peerId={peerId} 
          calling={calling} 
          setCalling={setCalling} 
          callingRequest={callingRequest} 
          setCallingRequest={setCallingRequest}
          setRemotePeerId={setRemotePeerId}
          remotePeerId={remotePeerId}
        />              
        {callingRequest.status &&
          <VideoCallRequest callingRequest={callingRequest} callStarted={callStarted} acceptCall={acceptCall}/>
        }
      </div>
      <ToastContainer/>
    </Container>
  )
}

const Container = styled.div`
  // height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background: linear-gradient(
    to bottom,
    #FF6F91 0%,
    #FF6F91 20%,
    #DCDCDC 20%,
    #DCDCDC 100%
  );
  &:after{
    position : absolute;
    backgroud-color : #075e54;
  }
  .container {
    // height: 90vh;
    width: 95vw;
    background-color: #ece5dd;
    // display: grid;
    // grid-template-columns: 25% 75%;
    // @media screen and (max-width: 720px) and (max-width: 1080px) {
    //   grid-template-columns: 35% 65%;
    // }
  }

  /* Media query for small screens (mobile phones) */
  @media screen and (max-width: 480px) {
    .container {
      width: 100vw;
      // height: 90vh;
    }
  }

  /* Media query for tablets */
  @media screen and (min-width: 481px) and (max-width: 768px) {
    .container {
      width: 100vw;
      grid-template-columns: 30% 70%;
    }
  }

  /* Media query for large desktops */
  @media screen and (min-width: 1081px) {
    .container {
      grid-template-columns: 20% 80%;
    }
  }
`; 
export default Chat