// listen for load event in the window
$(window).on('load', function() {
  // do things after the DOM loads fully
  console.log("Everything is loaded");

  let listening = false;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (typeof SpeechRecognition !== "undefined") {
      const recognition = new SpeechRecognition();

      const stop = () => {
          $("#mic").removeClass("active");
          recognition.stop();
          console.log("Stop listening")
          listening = false;
      };

      const start = () => {
          $("#mic").addClass("active");
          recognition.start();
          console.log("Start listening")
          listening = true;
      };

      const onResult = event => {
          $("#typed-input").val("");
          for (const res of event.results) {
              const text = res[0].transcript;
              if (res.isFinal) {
                console.log("Finishing one sentence");
              }
              $("#typed-input").val($("#typed-input").val() + text);
              $("#typed-input").animate({
                scrollTop:$("#typed-input")[0].scrollHeight - $("#typed-input").height()
            }, 0)
          }
      };
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.addEventListener("result", onResult);
      $("#mic").click(function() {
          listening ? stop() : start();
          // listening = !listening;
      });


      // press Enter or press submit button
      $('.message-submit').click(function() {
        stop();
        insertUserMessage();
      });

      $(window).on('keydown', function(e) {
        if (e.which == 9) {
          if (listening == false) {
            $("#mic").click();
          } else {
            $('.message-submit').click();
            return false;
          }
        } else if (e.which == 13) {
          $('.message-submit').click();
            return false;
        }
      })

  } else {
      alert("This browser does not support voice recognition feature!");
      $("#mic").hide();
  }


  // First Welcome message from AI
  // console.log("First Greeting!");
  $messages.mCustomScrollbar();
  setTimeout(function() {
    if ($(".animation #gender").val() == 'female'){
      $("#voiceSelecter").val("Google UK English Female");
    }
    if ($(".animation #gender").val() == 'male'){
      $("#voiceSelecter").val("Google UK English Male");
    } 
  }, 1000);


});

var $messages = $('.messages-content'),
  d, h, m,
  i = 0;


function insertUserMessage() {
  msg = $('.message-input').val();
  $('<div class="message message-personal">' + msg + '</div>').appendTo($('.mCSB_container')).addClass('new');
  setDate();
  $('.message-input').val(null);
  updateScrollbar();

  console.log("Sending query to API");
  var send_info = {query: msg};
  $.ajax({
    type: 'post',
    url: '/api',
    data: JSON.stringify(send_info),
    contentType: "application/json; charset=utf-8",
    traditional: true,
    success: function (data) {
        reply = $.trim(data.reply)
        console.log(reply);
        insertAIMessage(reply);
    }
  });
  $("#typed-input").val("");
}



function insertAIMessage(reply) {
  $('<div class="message loading new"><figure class="avatar"><img src="/imgs/doctor.png" /></figure><span></span></div>').appendTo($('.mCSB_container'));
  updateScrollbar();

  setTimeout(function() {
      $('.message.loading').remove();
      $('<div class="message new"><figure class="avatar"><img src="/imgs/doctor.png" /></figure>' + reply + '</div>').appendTo($('.mCSB_container')).addClass('new');
      setDate();
      updateScrollbar();
      i++;
  }, 500 + (Math.random() * 10) * 100);
  $("#texttospeakinput").val(reply);
  $("#imagecontainer").click();
  $("#typed-input").val("");
}

// scroll to the current message in the box
function updateScrollbar() {
  $messages.mCustomScrollbar("update").mCustomScrollbar('scrollTo', 'bottom', {
      scrollInertia: 10,
      timeout: 0
  });
}

// Insert Data for each message box
function setDate() {
  d = new Date()
  if (m != d.getMinutes()) {
      m = d.getMinutes();
      $('<div class="timestamp">' + d.getHours() + ':' + m + '</div>').appendTo($('.message:last'));
  }
}