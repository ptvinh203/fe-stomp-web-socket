import React, { useEffect, useState } from "react";
import { over } from "stompjs";
import SockJS from "sockjs-client";

var stompClient = null;
var token =
  "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzI4MzAxNjIzLCJleHAiOjE3MjgzMDg4MjN9.PNLXMwG8xuDXb0ny4DZzAkj8XSpgJzqeylc1TwjaKjSXrE_u47q3IkYvsPgyiPrVBQ0AFAtB9DazTk4_jL2-KzzOocS-M1mZ_-zw541_A9blHA1Ok3yLUZUqtLL0iYpaSYc9iAxIugojrqOx_y9l_Uf3R-KvQ2ki5F5bfUJvfHozdI3WoExHVZqMSXs4uWFRopSRwMSN9mFPbQpN1OiSojmDN70ja59CW4w10bgZc76I6TXp43fRZOEfRUahWZszym_CjLpw_Rz6IKkwiIa01h07hQTWiA4X3Sf_lAAJo5sSifYW-9swEJKAVK-yAyTAN68Y0MBPJNHcdcWXQXfJ1A";
const ChatRoom = () => {
  const [privateChats, setPrivateChats] = useState(new Map());
  const [publicChats, setPublicChats] = useState([]);
  const [userData, setUserData] = useState({
    username: "",
    receivername: "",
    connected: false,
    message: "",
  });

  const connect = () => {
    let Sock = new SockJS("http://localhost:8080/ws"); // connect to websocket
    stompClient = over(Sock);
    stompClient.connect(
      {
        Authorization: "Bearer " + token, // send token to server when connect
      },
      onConnected,
      onError
    );
  };

  const onConnected = () => {
    setUserData({ ...userData, connected: true });
    stompClient.subscribe("/public", onMessageReceived); // subscribe to public channel
    userJoin();
  };

  const userJoin = () => {
    var chatMessage = {
      senderName: userData.username,
      status: "JOIN",
    };
    stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
  };

  const onMessageReceived = (payload) => {
    var payloadData = JSON.parse(payload.body);
    console.log("payloadData", payloadData);

    switch (payloadData.status) {
      case "JOIN":
        if (!privateChats.get(payloadData.senderName)) {
          privateChats.set(payloadData.senderName, []);
          setPrivateChats(new Map(privateChats));
        }
        break;
      case "MESSAGE":
        publicChats.push(payloadData);
        setPublicChats([...publicChats]);
        break;
    }
  };

  const onError = (err) => {
    console.log("Không thể kết nối tới server: ", err);
  };

  const handleMessage = (event) => {
    const { value } = event.target;
    setUserData({ ...userData, message: value });
  };

  const sendValue = () => {
    if (stompClient) {
      var chatMessage = {
        senderName: userData.username,
        message: userData.message,
        status: "MESSAGE",
      };
      stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, message: "" });
    }
  };

  return (
    <div className="container">
      {userData.connected ? (
        <div className="chat-box">
          <div className="member-list">
            <ul>
              <li className={`member active`}>Chatroom</li>
            </ul>
          </div>
          <div className="chat-content">
            <ul className="chat-messages">
              {publicChats.map((chat, index) => (
                <li
                  className={`message ${
                    chat.senderName === userData.username && "self"
                  }`}
                  key={index}
                >
                  {chat.senderName !== userData.username && (
                    <div className="avatar">{chat.senderName}</div>
                  )}
                  <div className="message-data">{chat.message}</div>
                  {chat.senderName === userData.username && (
                    <div className="avatar self">{chat.senderName}</div>
                  )}
                </li>
              ))}
            </ul>

            <div className="send-message">
              <input
                type="text"
                className="input-message"
                placeholder="enter the message"
                value={userData.message}
                onChange={handleMessage}
              />
              <button type="button" className="send-button" onClick={sendValue}>
                send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="register-container">
          <div className="registerbutton">
            <button type="button" onClick={connect}>
              connect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
