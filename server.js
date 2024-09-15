const express = require('express');
const path = require('path');
const app = express();
const fs = require('fs');
const fileUpload = require('express-fileupload');
var server = app.listen(5500,function (){
    console.log('Server started on port 5500');
});

const io = require('socket.io')(server);
// Serve action.html when the root URL is requested
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'action.html'));
// });

app.use(express.static(path.join(__dirname, '')));




var users = [];


io.on('connection',(socket)=>{
  console.log('socket id is: ',socket.id);
    socket.on('userconnect',(data)=>{
        // console.log('User connected: ',data.displayName, data.meeting_id);
        var other_users = users.filter((user)=>user.meeting_id === data.meetingid);
          users.push({
              connection_ID:socket.id,
              user_ID:data.displayName,
              meeting_ID:data.meetingid
          });
          var userCount = users.length;
          console.log('User connected: ',data.displayName, data.meetingid, userCount);
          other_users.forEach((user) => {
            socket.to(user.connection_ID).emit('inform_others_about_me', {
                other_user_id: data.displayName,
                connId: socket.id,
                userNumber: userCount
            });
        });
        socket.emit('inform-me-about-other-user', other_users);
        
    });
    socket.on('SDPProcess',(data)=>{
        socket.to(data.to_connid).emit('SDPProcess',{
            message:data.message,
            from_connid:socket.id
        });
    });

    socket.on('sendMessage',(msg)=>{
      console.log('Message: ',msg);
      var mUser = users.find(user=>user.connection_ID === socket.id);
      if(mUser){
        var meetingid = mUser.meeting_ID;
        var from = mUser.user_ID;
        var list = users.filter((p)=> p.meeting_ID === meetingid);
        list.forEach((user) => {
            socket.to(user.connection_ID).emit('showChatMessage', {
                from: from,
                message: msg
            });
        });
      }
    });

    socket.on('fileTransferToOther',(msg)=>{
        console.log('Message: ',msg);
        var mUser = users.find(user=>user.connection_ID === socket.id);
        if(mUser){
          var meetingid = mUser.meeting_ID;
          var from = mUser.user_ID;
          var list = users.filter((p)=> p.meeting_ID === meetingid);
          list.forEach((user) => {
              socket.to(user.connection_ID).emit('showFileMessage', {
               username: msg.meeting_id,
               meetingid: msg.username,
               filePath:msg.filePath,
               fileName:msg.fileName
              });
          });
        }
      });
    // socket.on('fileTransferToOther',function (msg){
    //     console.log(msg);

    // });

    socket.on('disconnect',function (){
        console.log('User disconnected: ',data);
        var disUser = users.find(user=>user.connection_ID === socket.id);
        if(disUser){
            var meetingid = disUser.meeting_ID;
            userConnections = users.filter((p)=> p.connection_ID !== socket.id);

            var list = users.filter((p)=> p.meeting_ID === meetingid);
            list.forEach((user) => {
               var userNumberAfUserLeave = users.length;
                socket.to(user.connection_ID).emit('inform_other_about_disconnected_user', {
                    connId: socket.id,
                    uNumber: userNumberAfUserLeave
                });
            });
            
        }
    });
});












app.use(fileUpload());
app.post('/attachimg', function(req,res){
  var data = req.body;
  var imageFile = req.files.zipfile;
  console.log(imageFile);
  var dir = 'public/attachment/'+data.meeting_id+'/';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    imageFile.mv('public/attachment/'+data.meeting_id+'/'+imageFile.name, function(err) {
        if(err){
            console.log('could not upload the image file: ',err);
        }
        else{
            console.log('File uploaded!');
            // res.send('File uploaded!');
        }
    });

});
