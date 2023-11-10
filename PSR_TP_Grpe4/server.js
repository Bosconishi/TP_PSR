const http = require("http");
const { Server } = require("socket.io");

let connectedClients = [];
const connectedUsers = [];
const disconnectedUsers = [];
let connectedGroup = [];
const userSockets = {};

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
function findKeyByValue(obj, value) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && obj[key] === value) {
      return key;
    }
  }
  return null;
}
io.on("connection", (socket) => {
  console.log(`A user connected with id ${socket.id}`);

  socket.on('newGroup',({groupName,selectedMembers})=>{
    const Group ={
      groupId:generateUniqueIdGroup(),
      groupName:groupName,
      selectedMembers:selectedMembers
    }
    connectedGroup.push(Group)
    io.emit('allGroup', connectedGroup)
  })

  socket.on('updateGroupData',({group,users})=>{
    const updatedGroupData = connectedGroup.map((row) => {
      if (row.groupId === group) {
        const updatedMembers = [...row.selectedMembers, ...users];
        return { ...row, selectedMembers: updatedMembers };
      }
      return row;
    })
    connectedGroup = updatedGroupData;
    io.emit('allGroup', connectedGroup);
  })

  socket.emit("your id", socket.id);

  socket.on("login", ({ username, password }) => {
    const user = connectedClients.find((u) => u.username === username && u.password === password);
    const userconn = connectedUsers.find((u) => u.username === username && u.password === password);
    const index = disconnectedUsers.findIndex((u) => u.userId === user.userId);

    if (user) {
      if (!userSockets[user.userId]) {
        userSockets[user.userId] = socket.id;
      }
      socket.emit("login_successful", { username: user.username, id: user.userId, socket:user.socketId});
      if(!userconn){
        connectedUsers.push(user);
      }
      
      if (index !== -1) {
        disconnectedUsers.splice(index, 1);
      }
      io.emit("reponse", connectedUsers);
      io.emit("newConnect",user)
      io.emit("userSock",userSockets);
    } else {
      socket.emit("login_failed", "Invalid username or password");
    }
  });

  socket.on("Enregistrer", ({ usernameR, passwordR }) => {
    const existingUser = connectedClients.find((user) => user.username === usernameR);
    if (existingUser) {
      socket.emit("registration_failed", "Username already taken");
      return;
    } else {
      const newUser = {
        userId: generateUniqueId(),
        socketId:socket.id,
        username: usernameR,
        password: passwordR,
        disconnected: false,
      };
      connectedClients.push(newUser);
      if (!userSockets[newUser.userId]) {
        userSockets[newUser.userId] = socket.id;
      }
      socket.emit("registration_successful", {usernameR: newUser.username, id: newUser.userId,});
    }
  });

  socket.on('private message', ({ content, to, from}) => {
  const recipientSocketId = userSockets[to];
  const fromPrivate = findKeyByValue(userSockets, from);

  if (recipientSocketId) {
    const privateMessage = {
      from: from,
      fromPrivate:fromPrivate,
      to:to ,
      content: content,
      private: true,
      type: 'received',
    };
    io.to(recipientSocketId).emit('new private message', privateMessage);
  } else {
    socket.emit('private message failed', 'User is not connected');
  }
});

socket.on('group message', (groupMessageData) => {
  const {uniqueId,content, type, fromUser,fromGroup, groupMembers } = groupMessageData;

  groupMembers.forEach((member) => {
    const userconn = connectedUsers.find((u) => u.username === member);
    if (  userconn && userSockets[userconn.userId]) {
      const groupMessage = {
        uniqueId:uniqueId,
        content,
        type:'received',
        fromUser,
        fromGroup,
        to: member, 
      };

      io.to(userSockets[userconn.userId]).emit('new group message', groupMessage);
    } else {
      console.log(`User ${userSockets[userconn.userId]} is not connected`);
    }
  });
});

  socket.on('public message', (msg,activeSocket,currentTime) => {
    const userid= parseInt(findKeyByValue(userSockets, activeSocket), 10);
    const user = connectedClients.find((user) => user.userId === userid)
    const from =user ?  user.username : ''
    console.log(`Public Message : ${msg} , from : ${from} , at: ${currentTime}`);
    const publicMessage = {
      from: socket.id,
      content: msg,
      private: false,
    };
    io.emit('public message', publicMessage);
  });

  socket.on('updated connectedUsers', () => {
    io.emit('reponse', connectedUsers );
  });
  socket.on('updated connectedGroup', () => {
    io.emit('allGroup', connectedGroup);
  });
  socket.on("disconnect", () => {
    const userId = Object.keys(userSockets).find((key) => userSockets[key] === socket.id);
    if (userId) {
      const userIdNumber = parseInt(userId);
      const userIndex = connectedUsers.findIndex((u) => u.userId === userIdNumber);
      
      if (userIndex !== -1) {
        const disconnectedUser = connectedUsers.splice(userIndex, 1)[0];
        disconnectedUser.disconnected = true;
        disconnectedUsers.push(disconnectedUser);
        io.emit("disconnectUser", disconnectedUser )
        delete userSockets[userId];
      }

      io.emit("reponse", connectedUsers);
      io.emit("userSock",userSockets);
    }
  });
});

function generateUniqueId() {
  return connectedClients.length + 1;
}
function generateUniqueIdGroup() {
  return connectedGroup.length + 1;
}
server.listen(8000, () => {
  console.log("listening on *: 8000");
});

