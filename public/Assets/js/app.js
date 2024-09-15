var Myapp = (async function() {
   var socket = null;
   var user_id = null;
   var meeting_id = null;

    function init(uid,mid) {
        user_id = uid;
        meeting_id = mid;
        $('#meetingContainer').show();
        $('#me h2').text(user_id + ' (Me)');
        document.title = user_id;
        event_process_for_signaling_server();
        eventHandeling();
    }

   



     function event_process_for_signaling_server(){
        socket = io.connect();

        var SDP_function = async function(data, to_connid){
            socket.emit("SDPProcess",{
              message: data,
              to_connid: to_connid
            });
        }
        
        socket.on('showFileMessage', function(data){
          var time = new Date();
          var lTime = time.toLocaleString('en-US',{
              hour:'numeric',
              minute:'numeric',
              hour12:true
          });
          var attachFileAreaForOther = document.querySelector('.show-attach-file');
          var attachFileName = data.fileName;
          var attachFilePath = data.filePath;
          attachFileAreaForOther.innerHTML += "<div class='left-align' style='display: flex; align-items:center;'><img src='public/Assets/images/other.jpg'  style='height: 40px; width: 40px;' class='caller-image circle'><div  style='font-weight: 600; margin: 0 5px;'>"+data.username+"</div>:<div> <a style='color: #007bff' href='"+attachFilePath+"' download>"+attachFileName+"</a></div></div><br/>";
        });

        socket.on('connect', function() {
           alert('Connected to the server');
            if(socket.connected){
                AppProcess.init(SDP_function,socket.id);
                if(user_id !== null && meeting_id !== null){
                    socket.emit('userconnect',{
                    displayName:user_id,
                    meetingid:meeting_id});
                }
            }
        });
        

       socket.on('inform_other_about_disconnected_user',(data)=>{
          var connId = data.connId;
          if(connId){
            $('#'+connId).remove();
          }
         $('.participant-count').text(data.uNumber);
         $('#participant_'+data.connID+"").remove();
          AppProcess.closeConnection(connId);
        });
        socket.on('inform-others-about-me',(data)=>{
          addUser(data.other_user_id,data.connID,data.userNumber);  /// add user to the list
          AppProcess.setNewConnectionCall(data.connID);  /// set new connection for the user
        });
        
        socket.on('inform-me-about-other-user',(other_users)=>{
          var userNumber = other_users.length;
          var userNumb = userNumber + 1;
            if(other_users){
            other_users.forEach((user)=>{
              addUser(user.user_ID,user.connection_ID,userNumb);
              AppProcess.setNewConnection(user.connection_ID);
            });
            }
            
        });

        socket.on('SDPProcess',async (data)=>{
          await AppProcess.processClientFunc(data.message,data.from_connid);
        });
        socket.on('showChatMessage',function(data){
          var time = new Date();
          var lTime = time.toLocaleString('en-US',{
             hour:'numeric',
             minute:'numeric',
             hour12:true
          });
          var div = $('<div>').html("<span class='font-weight- bold mr-3' style='color:black'>"+data.from+"</span>"+lTime+"<br>"+data.message);
          $('#messages').append(div);
       });
     }


























    function eventHandeling(){
      $('#btnsend').on('click', function(){
        var msgData = $('#msgbox').val();
         socket.emit('sendMessage', $('#msgbox').val());
         
          var time = new Date();
          var lTime = time.toLocaleString('en-US',{
             hour:'numeric',
             minute:'numeric',
             hour12:true
          });
          var div = $('<div>').html("<span class='font-weight- bold mr-3' style='color: black'>"+user_id+"</span>"+lTime+"<br>"+msgData);
          $('#messages').append(div);
       
         $('msgbox').val('');
      });
      var url = window.location.href;
      $('.meeting-link').text(url);

    $('.divUsers').on('dblclick',"video",function(){
       this.requestFullscreen();
      });

    }
    function addUser(other_user_id,connId,userNum){
        var newDivId = $('#otherTemplate').clone();
        newDivId = newDivId.attr('id',connId).addClass('other');
        newDivId.find('h2').text(other_user_id);
        newDivId.find('video').attr('id','v_'+connId);
        newDivId.find('audio').attr('id','a_'+connId);
        newDivId.show();
        $('#divUsers').append(newDivId);
        $('.in-call-wrap-up').append('<div class="in-call-wrap d-flex justify-content-between aligh-items-center mb-3" id="participant_'+connId+'"> <div class="participant-img-name-wrap display-center cursor-pointer"> <div class="participant-img"> <img src="public/Assets/images/" alt="" class="border border-secondary" style="height: 40px; width: 40px; border-radius: 50%;"> </div> <div class="participant-name ml-2"></div>'+other_user_id +' </div> <div class="participant-action-wrap display-center "> <div class="participant-action-dot display-center mr-2 cursor-pointer"> <span class="material-icons">more_vert</span> </div> <div class="participant-action-pin display-center mr-2 cursor-pointer"> <span class="material-icons">push_pin</span> </div> </div> </div>');
        $('.participant-count').text(userNum);
      }
    $(document).on('click',".people-heading", function(){
       $('.chat-show-wrap').hide(300);
       $('.in-call-wrap-up').show(300);
       $(this).addClass('active');
       $('.chat-heading').removeClass('active');
    });
    $(document).on('click',".chat-heading", function(){
      $('.in-call-wrap-up').hide(300);
      $('.chat-show-wrap').show(300);
      $(this).addClass('active');
      $('.people-heading').removeClass('active');
      
    });
    
    $(document).on('click',".top-left-participant-wrap", function(){
      $('.people-heading').addClass('active');
      $('.chat-heading').removeClass('active');
      $('.g-right-details-wrap').show(300);
      $('.in-call-wrap-up').show(300);
      $('.chat-show-wrap').hide(300);
    });
    $(document).on('click',".top-left-chat-wrap", function(){
    $('.people-heading').removeClass('active');
    $('.chat-heading').addClass('active');
    $('.g-right-details-wrap').show(300);
    $('.in-call-wrap-up').hide(300);
    $('.chat-show-wrap').show(300);
    });
    $(document).on('click',".end-call-wrap", function(){
     $('.top-box-show').css({
        'display':'block'
     }).html('<div class="top-box-align-vertical-middle profile-dialogue-show"> <h1 class="mt-2" style = "text-align: center color:white; ">Leave meeting</h1> <hr> <div class="call-leave-cancel-action d-flex justify-content-center align-items-center w-100"> <a href="/action.html"><button class="call-leave-action btn btn-danger mr-5">Leave</button></a> <button class="call-cancel-action btn btn-secondary">Cancel</button> </div> </div>');


    });
    $(document).on('click','.call-cancel-action', function(){
    $('.top-box-show').html('');
    });
    $(document).on('click','.copy-info',function(){
     var $temp = $("<input>");
     $('body').append($temp);
     $temp.val($('.meeting-url').text()).select();
     document.execCommand('copy');
      $temp.remove();
    });
    $('.link-conf').show();
    setTimeout(function(){
    $('.link-conf').hide();
    
    },3000);
    $(document).mouseup(function(e){
      var container = new Array;
      container.push($('.top-box-show'));
      $.each(container,function(key,value){
        if(!$(value).is(e.target)  && $(value).has(e.target).length == 0){
          $(value).empty();
        }
  });
    });

    





    var base_url = window.location.origin;
   
    $(document).on('click','.share-attach',function(e){
      e.preventDefault();
     var att_img =  $('#customFile').prop('files')[0];
     var formData = new FormData();
     formData.append('zipfile', att_img);
     formData.append('meeting_id', meeting_id);
     formData.append('username',user_id);
     // alert(user_id);
     $.ajax({
         url : base_url+"/attachimg",
         type: 'POST',
         data: formData,
         contentType: false,
         processData: false,
         success: function(response){
           console.log(response);

         },
         error : function(){
           console.log(error);
         },
     });
          var attachFileArea = document.querySelector('.show-attach-file');
          var attachFileName = $('#customFile').val().split('\\').pop();
          var attachFilePath = 'public/attachment/'+meeting_id+'/'+attachFileName;
          attachFileArea.innerHTML += "<div class='left-align' style='display: flex; align-items:center;'><img src='public/Assets/images/other.jpg'  style='height: 40px; width: 40px;' class='caller-image circle'><div  style='font-weight: 600; margin: 0 5px;'>"+user_id+"</div>:<div> <a style='color: #007bff' href='"+attachFilePath+"' download>"+attachFileName+"</a></div></div><br/>";
          $('label.custom-file-label').html('');
          socket.emit('fileTransferToOther',{
            meeting_id:meeting_id,
            username:user_id,
            filePath:attachFilePath,
            fileName:attachFileName
          });

    });
    $(document).on('click','.option-icon',function(){
      $('.recording-show').toggle(300);
    });
    $(document).on('click','.start-record',function(){
      $(this).removeClass().addClass('stop-record btn-danger text-dark').text('Stop Recording');
      startRecording();
    });
    $(document).on('click','.stop-record',function(){
      $(this).removeClass().addClass('start-record btn-dark text-danger').text('Start Recording');
      mediaRecorder.stop();
    });





    


    
   







    $(document).on('click', '.meeting-details-button', function(){
      $('.g-details').slideDown(300);
  });
    $(document).on('click', '.g-details-heading-detail', function(){
    $('.g-details-heading-show').show();
    $('.g-details-heading-show-attachment').hide();
    $('.g-details-heading-attachment').removeClass('active');
    $(this).addClass('active');
  });
    $(document).on('click', '.g-details-heading-attachment', function(){
      $('.g-details-heading-show').hide();
      $('.g-details-heading-show-attachment').show();
      $('.g-details-heading-detail').removeClass('active');
      $(this).addClass('active');
     
      
  });
    $(document).mouseup(function(e){
    var container = new Array;
    container.push($('.g-details'));
    container.push($('.g-right-details-wrap'));
    $.each(container,function(key,value){
      if(  !$(value).is(e.target)  &&  $(value).has(e.target).length == 0){
        $('.g-details-heading-attachment').removeClass('active');
        $('.g-details-heading-detail').removeClass('active');
        $(value).hide(300);
      }
});
  });






  $(document).on('change','.custom-file-input',function(){
    var fileName = $(this).val().split('\\').pop();
    $(this).siblings('.custom-file-label').addClass('selected').html(fileName);

  });





  $(document).on('click',".meeting-heading-cross", function(){
    $('.g-right-details-wrap').toggle(300);
    // alert('hello');
  });






















   var mediaRecorder = null;
   var chunks = [];
   async function captureScreen(mediaConstraints = { video: true }) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia(mediaConstraints);
      return screenStream;
    }
    async function captureAudio(mediaConstraints = { audio: true, video: false }) {
      const audioStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      return audioStream;
    }

    async function startRecording(){
      const screenStream = captureScreen();
      const audioStream = captureAudio();
      const stream = new MediaStream ([...screenStream.getTracks(), ...audioStream.getTracks()]);
       mediaRecorder = new MediaRecorder(stream);
       mediaRecorder.start();

       mediaRecorder.onStop = function(e){
          var clipName = prompt('Enter a name for your clip');
          stream.getTracks().forEach(track => track.stop());
          const blob = new Blob(chunks,{type:'video/webm'});
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = clipName + '.webm';
          document.body.appendChild(a);
          a.click();
          setTimeout(()=>{
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          },100);
         }
         mediaRecorder.ondataavailable = function(e){
          chunks.push(e.data);
        }
    }


    return {
        _init : function(uid,mid) {
            init(uid,mid);
        }
    };
})();




































var AppProcess = (async function(){
  var peers_connection_ids = [];
  var peers_connection = [];
  var remote_vid_stream = [];
  var remote_aud_stream = [];
  var serverProcess = null;
  var local_div = null;
  var audio ;
  var isAudioMute= true;
  var rtp_aud_senders = [];
  var video_states ={
    None:0,
    Camera:1,
    ScreenShare:2
  };
  var videoCamTrack ;
  var video_st = video_states.None;
  var rtp_vid_senders = [];
    async function _init(SDP_function,my_connID){
      serverProcess = SDP_function;
      my_connection_id = my_connID;
     await  eventProcess();
      local_div = $('#localVideoPlayer');
    }
   async function eventProcess(){
      $('#micMuteUnmute').on('click',async function(){
          if(!audio){
            await loadAudio();
            
          }
          if(!audio){
            alert('Permisssion denied for audio');
            return;
          }
          if(isAudioMute){
            audio.enabled = true;
            $(this).html('<span class="material-icons">mic</span>');
            updateMediaSenders(audio,rtp_aud_senders);
          }
          else{
            audio.enabled = false;
            $(this).html("<span class='material-icons' style='width: 100%;'>mic-off</span>");
            updateMediaSenders(rtp_aud_senders);
          }
          isAudioMute = !isAudioMute;
      });
      $('#videoCamOnOff').on('click',async function(){
          if(video_st==video_states.Camera){
            await videoProcess(video_states.None);
          }
          else{
            await videoProcess(video_states.Camera);
          }
      });
      $('#ScreenShareOnOff').on('click',async function(){
          if(video_st==video_states.ScreenShare){
            await videoProcess(video_states.None);
          }
          else{
            await videoProcess(video_states.ScreenShare);
          }
      });
    }
    
    async function loadAudio(){
      try{
       var astream = await navigator.mediaDevices.getUserMedia({
          audio:true,
          video:false
        });
        audio = astream.getAudioTracks()[0];
        audio.enabled = false;
      }
      catch(error){
        console.error(error);
      }
    }

    function connection_status(connection){
      if(connection&&(connection.connectionState=='new'||connection.connectionState=='connecting'||connection.connectionState=='connected')){
        return true;
      }
      else{
        return false;
      }
    }
    async function updateMediaSenders(track,rtp_senders){
      for(var con_id in peers_connection_ids){
        if(connection_status(peers_connection[con_id])){
           if(rtp_senders[con_id]&&rtp_senders[con_id].track){
            rtp_senders[con_id].replaceTrack(track);
           }
            else{
              rtp_senders[con_id] = peers_connection[con_id].addTrack(track);
            }
        }
    }
  }
  async function removeMediaSenders(rtp_senders){
    for(var con_id in peers_connection_ids){
      if(rtp_senders[con_id] &&connection_status(peers_connection[con_id])){
        peers_connection[con_id].removeTrack(rtp_senders[con_id]);
        rtp_senders[con_id] = null;
        
      }
    }
  }
  async function removeVideoStream(rtp_vid_senders){
    if(videoCamTrack){
      videoCamTrack.stop();
      videoCamTrack = null;
      local_div.srcObject = null;
      removeMediaSenders(rtp_vid_senders);
    }
  }
   async function videoProcess(newVideoState){
      
    if(newVideoState == video_states.None){
      $('#videoCamOnOff').html('<span class="material-icons" style="width: 100%">videocam_off</span>');
      
      $('#ScreenShareOnOff').html('<span class="material-icons">present_to_all</span><div>Present Now</div>');

      video_st = newVideoState;
      removeVideoStream(rtp_vid_senders);
      return;
    }

   

    if(newVideoState == video_states.Camera){
      $('#videoCamOnOff').html('<span class="material-icons" style="width: 100%">videocam_on</span>');
    }

     try{
      var vstream = null;
      if(newVideoState === video_states.Camera){
        vstream = await navigator.mediaDevices.getUserMedia({
          video : {
            width:1920,
            height:1080,
          },
          audio:false
        });
      }
      else{
        if(newVideoState === video_states.ScreenShare){
          vstream = await navigator.mediaDevices.getDisplayMedia({
            video:{
              width:1920,
              height:1080
            },
            audio:false
          });
          vstream.oninactive = (event)=>{
            removeVideoStream(rtp_vid_senders);
            $('#ScreenShareOnOff').html('<span class="material-icons">stop_screen_share</span><div">Present Now</div>');

          }
        }
      }
      if(vstream && vstream.getVideoTracks().length>0){
        videoCamTrack = vstream.getVideoTracks()[0];
        if(videoCamTrack){
          local_div.srcObject = new MediaStream([videoCamTrack]);
          updateMediaSenders(videoCamTrack,rtp_aud_senders);
        }
      }
     }
      catch(error){
        console.error(error);
        return;
      }
      video_st = newVideoState;


      if(newVideoState === video_states.Camera){
        $('#videoCamOnOff').html(' <span class="material-icons" style="width: 100%">videocam</span>');
        $('#ScreenShareOnOff').html('<span class="material-icons">stop_screen_share</span><div">Present Now</div>');
      }
      else{
        if(newVideoState === video_states.ScreenShare){
          $('#videoCamOnOff').html(' <span class="material-icons" style="width: 100%">videocam_off</span>');
          $('#ScreenShareOnOff').html('<span class="material-icons text-success">stop_screen_share</span><div class="text-success">Stop Presenting</div>');
        }
      
      }
   }
  var iceConfiguration = {
    iceServers:[
      {
        urls: 'stun:stun.l.google.com:19302'
      },
      {
        urls: 'stun:stun1.l.google.com:19302'
      }
    ]
  }
  async function setConnection(connId){   /// for WebRtc connection
    var connection = new RTCPeerConnection(iceConfiguration);
    connection.onnegotiationneeded = async function(event){
      await setOffer(connId);
    }
    connection.onicecandidate = (function(event){
      if(event.candidate){
        serverProcess(JSON.stringify({'icecandidate':event.candidate}),connId);
      }
    });
    connection.ontrack = (function(event){
       if(!remote_vid_stream[connID]){
        remote_vid_stream[connID] = new MediaStream();
       }
       if(!remote_aud_stream[connID]){
        remote_aud_stream[connID] = new MediaStream();
       }
       if(event.track.kind === 'video'){
        remote_vid_stream[connID]
        .getVideoTracks()
         .forEach(element => {
          remote_aud_stream[connID].removeTrack(element);
        });
        remote_aud_stream[connID].addTrack(event.track);

         var remoteVideoPlayer = document.getElementById('v_'+connId);
         remoteVideoPlayer.srcObject = null;
         remoteVideoPlayer.srcObject = remote_vid_stream[connId];

         remoteVideoPlayer.load();

       }
       else{
           if(event.track.kind === 'audio'){
            remote_aud_stream[connID]
            .getAudioTracks()
            .forEach(element => {
              remote_aud_stream[connID].removeTrack(element);
            });
            remote_aud_stream[connID].addTrack(event.track);

            var remoteAudioPlayer = document.getElementById('a_'+connId);
            remoteAudioPlayer.srcObject = null;
            remoteAudioPlayer.srcObject = remote_aud_stream[connId];
            remoteAudioPlayer.load();
           }
       }
       if(video_st === video_states.ScreenShare||video_st === video_states.Camera){
         if(videoCamTrack){
          updateMediaSenders(videoCamTrack,rtp_aud_senders);
         }
        
      }
       return connection;
    });
     peers_connection_ids[connId] = connId;
     peers_connection[connId] = connection;

    } 
   async function setOffer(connId){
      var connection = peers_connection[connId];
      var offer = await connection.createOffer();

      await connection.setLocalDescription(offer);
      serverProcess(JSON.stringify({offer:connection.localDescription}),connId);
   }
   async function SDPProcess(message,from_connid){
    message = JSON.parse(message);
    if(message.answer){
      await peers_connection[from_connid].setRemoteDescription(new RTCSessionDescription(message.answer));
    }
    else{
      if(message.offer){
          if(!peers_connection[from_connid]){
           await setConnection(from_connid);
          }
          await peers_connection[from_connid].setRemoteDescription(new RTCSessionDescription(message.offer));
          var answer = await peers_connection[from_connid].createAnswer();
          await peers_connection[from_connid].setLocalDescription(answer);
          serverProcess(JSON.stringify({answer:peers_connection[from_connid].localDescription}),from_connid);
      }
      else{
        if(message.icecandidate){
          if(!peers_connection[from_connid]){
            await setConnection(from_connid);
          }
          try{
            await peers_connection[from_connid].addIceCandidate(message.icecandidate);
          }
          catch(error){
            console.error(error);
          }
        }
      
      }
    }
   
    

   }

    async function closeConnectionCall(connId){
      peers_connection_ids[connId] = null;
      if(peers_connection[connId]){
        peers_connection[connId].close();
        peers_connection[connId] = null;
      }
      if(remote_aud_stream[connId]){
        remote_aud_stream[connId].getTracks().forEach((track) => {
          if(track.stop())
          track.stop()
        });
        remote_aud_stream[connId] = null;
      }
      if(remote_vid_stream[connId]){
        remote_vid_stream[connId].getTracks().forEach((track) => {
          if(track.stop())
          track.stop()
        });
        remote_vid_stream[connId] = null;
      }
    }
  return {
    setNewConnection: async function(connId){
      await setConnection(connId);
    },
    init:async function(SDP_function,my_connID){
      await _init(SDP_function,my_connID);
    },
    processClientFunc: async function(data,from_connid){
      await SDPProcess(data,from_connid);
    },
    closeConnectionCall: async function(connId){
      await closeConnectionCall(connId);
    }


  };
})();