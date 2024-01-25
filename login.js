const mysql = require("mysql");
const express = require("express");
const bodyParser = require("body-parser");
const encoder = bodyParser.urlencoded({ extended: true });
const app = express();


const http = require('http');
const socketIO = require('socket.io');
const server = http.createServer(app);
const io = socketIO(server);

app.use("/assets",express.static("assets"));

const connection = mysql.createConnection({
    host: "aws-rds.cbht2ghmproo.ap-northeast-1.rds.amazonaws.com",
    user: "admin",
    password: "Prathamesh",
    database: "mydata"
});
/*
// connect to the database
connection.connect(function(error){
    if (error) throw error
    else console.log("connected to the database successfully!")
});

*/
app.get("/",function(req,res){
    res.sendFile(__dirname + "/index.html");
})

app.post("/",encoder, function(req,res){
    var username = req.body.username;
    var password = req.body.password;
    /*
    connection.query("select * from userdata where Email = ? and Pass = ?",[username,password],function(error,results,fields){
        if (results.length > 0) {
            res.redirect("/roomentry");
        } else {
            res.redirect("/");
        }
        res.end();
    })
    */
})

app.get("/chatapp",function(req,res){
    res.sendFile(__dirname + "/chatapp.html")
})


app.get("/signup", function (req, res) {
    res.sendFile(__dirname + "/signup.html", (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error sending file");
      }
    });
  });
  
  app.post("/signup",encoder, function(req,res){
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;
    /*
    connection.query("Insert into userdata(username,Email,Pass) values(?,?,?)",[username,email,password],function(error,results,fields){
        if (error) {
            console.error(error);
            res.redirect("/signup"); // Redirect on error
        } else {
            res.redirect("/roomentry"); // Redirect on success
        }
        res.end();
    })
    */
    
})



// Serve the HTML page for creating/joining chat rooms
app.get('/roomentry', (req, res) => {
  res.sendFile(__dirname + '/roomentry.html');
});

// Serve the chat.html page
app.get('/chat', (req, res) => {
    res.sendFile(__dirname + '/chatapp.html');
  });
  
// Store active rooms, their participants, and their usernames
const activeRooms = new Map();

io.on('connection', (socket) => {
  socket.on('createRoom', (roomId) => {
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, new Map());
      socket.emit('roomCreated', roomId);
    } else {
      socket.emit('roomExists', roomId);
    }
  });

  socket.on('joinRoom', ({ roomId, username }) => {
    if (activeRooms.has(roomId)) {
      socket.join(roomId);
      const roomParticipants = activeRooms.get(roomId);
      roomParticipants.set(socket.id, username);
      io.to(roomId).emit('userJoined', { roomId, username });

      // Notify the user of the current room participants
      socket.emit('currentParticipants', Array.from(roomParticipants.values()));
    } else {
      socket.emit('roomNotFound', roomId);
    }
  });

  socket.on('message', ({ roomId, username, message }) => {
    io.to(roomId).emit('newMessage', { username, message });
  });  

  // Handle user disconnection and remove them from the room
  socket.on('disconnect', () => {
    activeRooms.forEach((participants, roomId) => {
      if (participants.has(socket.id)) {
        const username = participants.get(socket.id);
        participants.delete(socket.id);
        io.to(roomId).emit('userLeft', { roomId, username });
      }
    });
  });
});


const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});