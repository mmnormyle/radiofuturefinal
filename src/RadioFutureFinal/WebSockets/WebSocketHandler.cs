﻿using Newtonsoft.Json;
using RadioFutureFinal.Contracts;
using RadioFutureFinal.DAL;
using RadioFutureFinal.Models;
using System;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace RadioFutureFinal.WebSockets
{
    public class WebSocketHandler
    {
        protected WebSocketConnectionManager _wsConnectionManager { get; set; }
        protected IDbRepository _db { get; set; }

        public WebSocketHandler(IDbRepository db, WebSocketConnectionManager webSocketConnectionManager)
        {
            _wsConnectionManager = webSocketConnectionManager;
            _db = db;
        }

        public void OnConnected(WebSocket socket)
        {
            _wsConnectionManager.AddSocket(socket);
        }

        public virtual async Task OnDisconnected(WebSocket socket)
        {
            await _wsConnectionManager.RemoveSocket(socket);
        }

        public async Task SendMessageAsync(WebSocket socket, WsMessage wsMessage)
        {
            if (socket.State != WebSocketState.Open)
                return;

            string message = JsonConvert.SerializeObject(wsMessage);

            await socket.SendAsync(buffer: new ArraySegment<byte>(array: Encoding.ASCII.GetBytes(message),
                                                                  offset: 0,
                                                                  count: message.Length),
                                   messageType: WebSocketMessageType.Text,
                                   endOfMessage: true,
                                   cancellationToken: CancellationToken.None);
        }

        public async Task SendMessageToSessionAsync(WsMessage message, int sessionId)
        {
            foreach(var socket in _wsConnectionManager.GetSocketsInSession(sessionId))
            {
                await SendMessageAsync(socket.WebSocket, message);
            }
        }


        // TODO: how neccesary is this being async?
        public async Task ReceiveAsync(WebSocket socket, WebSocketReceiveResult result, byte[] buffer)
        {
            var strMessage = Encoding.UTF8.GetString(buffer, 0, result.Count);
            WsMessage wsMessage = null;
            try
            {
                wsMessage = JsonConvert.DeserializeObject<WsMessage>(strMessage);
            }
            catch(Exception e)
            {
                var msg = e.Message;
                // TODO: Throw exception
                return;
            }

            // TODO: smoother way to do this
            Action<WsMessage, MySocket> action = null;
            // TODO: better data structure should make this one call
            MySocket mySocket = _wsConnectionManager.GetSocketById(_wsConnectionManager.GetId(socket));
            if(wsMessage.Action.Equals("UserJoinSession", StringComparison.CurrentCultureIgnoreCase))
            {
                await JoinSession(wsMessage, mySocket);
            }
            else if(wsMessage.Action.Equals("AddMediaToSession", StringComparison.CurrentCultureIgnoreCase))
            {
                // await AddMediaToSession(wsMessage, mySocket);
            }
            else if(wsMessage.Action.Equals("DeleteMediaFromSession", StringComparison.CurrentCultureIgnoreCase))
            {
                // await DeleteMediaFromSession(wsMessage, mySocket);
            }
            else if(wsMessage.Action.Equals("SaveUserVideoState", StringComparison.CurrentCultureIgnoreCase))
            {
                // await SaveUserVideoState(wsMessage, mySocket);
            }
            else if(wsMessage.Action.Equals("SaveUserNameChange", StringComparison.CurrentCultureIgnoreCase))
            {
                // await SaveUserNameChange(wsMessage, mySocket);
            }
            else if(wsMessage.Action.Equals("ChatMessage", StringComparison.CurrentCultureIgnoreCase))
            {
                // await ChatMessage(wsMessage, mySocket);
            }
            else if(wsMessage.Action.Equals("SynchronizeSession", StringComparison.CurrentCultureIgnoreCase))
            {
                // await SynchronizeSession(wsMessage, mySocket);
            }
            else
            {
                // TODO: exception handling
            }
        }

        public async Task SendMessageToAllAsync(WsMessage message)
        {
            foreach (var pair in _wsConnectionManager.GetAll())
            {
                await SendMessageAsync(pair.Value.WebSocket, message);
            }
        }

        // ===============================================
        // TODO: maybe move these functions to another file
        private async Task ClientSessionReady(MySocket socket, Session session, User user)
        {
            // TODO: How can I make sure this is somewhat updated properly?
            var wsMessage = new WsMessage();
            wsMessage.Action = "sessionReady";
            wsMessage.Session = new SessionV1(session);
            wsMessage.User = new UserV1(user);

            await SendMessageAsync(socket.WebSocket, wsMessage);
        }

        private async Task ClientsUpdateSessionUsers(MySocket socket, Session session)
        {
            var wsMessage = new WsMessage();
            wsMessage.Action = "updateUsersList";
            wsMessage.Session = new SessionV1(session);

            await SendMessageToSessionAsync(wsMessage, session.SessionID);
        }


        // ===============================================

        private async Task JoinSession(WsMessage message, MySocket socket)
        {
            var sessionName = message.Session.Name;
            Session session = null;
            bool sessionFound = _db.GetSessionByName(sessionName, out session);
            if(!sessionFound)
            {
                session = await _db.CreateSessionAsync(sessionName);
            }
            _wsConnectionManager.SocketJoinSession(socket, session.SessionID);

            var userName = message.User.Name;
            var user = await _db.AddNewUserToSession(userName, session);

            await ClientSessionReady(socket, session, user);
            await ClientsUpdateSessionUsers(socket, session);
        }

        private async Task AddMediaToSession(WsMessage message, MySocket socket)
        {
            var sessionName = message.Session.Name;
            Session session = null;
            bool sessionFound = _db.GetSessionByName(sessionName, out session);
            if(!sessionFound)
            {
                session = await _db.CreateSessionAsync(sessionName);
            }
            _wsConnectionManager.SocketJoinSession(socket, session.SessionID);

            var userName = message.User.Name;
            var user = await _db.AddNewUserToSession(userName, session);

            await ClientSessionReady(socket, session, user);
            await ClientsUpdateSessionUsers(socket, session);
        }
        private async Task DeleteMediaFromSession(WsMessage message, MySocket socket)
        {
            var sessionName = message.Session.Name;
            Session session = null;
            bool sessionFound = _db.GetSessionByName(sessionName, out session);
            if(!sessionFound)
            {
                session = await _db.CreateSessionAsync(sessionName);
            }
            _wsConnectionManager.SocketJoinSession(socket, session.SessionID);

            var userName = message.User.Name;
            var user = await _db.AddNewUserToSession(userName, session);

            await ClientSessionReady(socket, session, user);
            await ClientsUpdateSessionUsers(socket, session);
        }
        private async Task SaveUserVideoState(WsMessage message, MySocket socket)
        {
            var sessionName = message.Session.Name;
            Session session = null;
            bool sessionFound = _db.GetSessionByName(sessionName, out session);
            if(!sessionFound)
            {
                session = await _db.CreateSessionAsync(sessionName);
            }
            _wsConnectionManager.SocketJoinSession(socket, session.SessionID);

            var userName = message.User.Name;
            var user = await _db.AddNewUserToSession(userName, session);

            await ClientSessionReady(socket, session, user);
            await ClientsUpdateSessionUsers(socket, session);
        }
        private async Task SaveUserNameChange(WsMessage message, MySocket socket)
        {
            var sessionName = message.Session.Name;
            Session session = null;
            bool sessionFound = _db.GetSessionByName(sessionName, out session);
            if(!sessionFound)
            {
                session = await _db.CreateSessionAsync(sessionName);
            }
            _wsConnectionManager.SocketJoinSession(socket, session.SessionID);

            var userName = message.User.Name;
            var user = await _db.AddNewUserToSession(userName, session);

            await ClientSessionReady(socket, session, user);
            await ClientsUpdateSessionUsers(socket, session);
        }
        private async Task ChatMessage(WsMessage message, MySocket socket)
        {
            var sessionName = message.Session.Name;
            Session session = null;
            bool sessionFound = _db.GetSessionByName(sessionName, out session);
            if(!sessionFound)
            {
                session = await _db.CreateSessionAsync(sessionName);
            }
            _wsConnectionManager.SocketJoinSession(socket, session.SessionID);

            var userName = message.User.Name;
            var user = await _db.AddNewUserToSession(userName, session);

            await ClientSessionReady(socket, session, user);
            await ClientsUpdateSessionUsers(socket, session);
        }
        private async Task SynchronizeSession(WsMessage message, MySocket socket)
        {
            var sessionName = message.Session.Name;
            Session session = null;
            bool sessionFound = _db.GetSessionByName(sessionName, out session);
            if(!sessionFound)
            {
                session = await _db.CreateSessionAsync(sessionName);
            }
            _wsConnectionManager.SocketJoinSession(socket, session.SessionID);

            var userName = message.User.Name;
            var user = await _db.AddNewUserToSession(userName, session);

            await ClientSessionReady(socket, session, user);
            await ClientsUpdateSessionUsers(socket, session);
        }

    }
}
