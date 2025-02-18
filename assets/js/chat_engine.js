class ChatEngine {
  constructor(chatBoxId, userEmail, receiverEmail, receiverId, sendId) {
    this.chatBox = $(`#${chatBoxId}`);
    this.userEmail = userEmail;
    this.receiverEmail = receiverEmail;
    this.receiverId = receiverId;
    this.sendId = sendId;
    this.socket = io.connect("https://instabook-9vjj.onrender.com", {
      transports: ["websocket", "polling", "flashsocket"],
    });
    // this.socket = io.connect("http://localhost:5000", {
    //   transports: ["websocket", "polling", "flashsocket"],
    // });

    if (this.userEmail) {
      this.connectionHandler();
    }
  }

  connectionHandler() {
    let self = this;

    this.socket.on("connect", function () {
      console.log("connection established using sockets...!");

      self.socket.emit("join_room", {
        user_email: self.userEmail,
        receiver_email: self.receiverEmail,
        // receiverId: self.receiverId,
        // sendId: self.sendId,
        chatroom: `FB_${self.sendId}_${self.receiverId}`,
      });

      self.socket.on("user_joined", function (data) {
        console.log("a user joined!", data);
      });

      self.socket.on("populate_db_message", function (data) {
        // console.log('a user joined!', data);

        data.forEach((element) => {
          let newMessage = $("<li>");

          let messageType = "other-message";

          if (element.from_user.email == self.userEmail) {
            messageType = "self-message";
          }

          newMessage.append(
            $("<span>", {
              html: element.message,
            })
          );

          // newMessage.append($('<sub>', {
          //     'html': element.from_user.email
          // }));

          newMessage.addClass(messageType);

          $("#chat-messages-list").append(newMessage);
        });
      });
    });

    $(".video-icon").click(function () {
      // console.log("clicked video btn");
      const chatRoom1 = `FB_${self.sendId}_${self.receiverId}`;
      const chatRoom2 = `FB_${self.receiverId}_${self.sendId}`;
      self.socket.emit("send_link", { chatRoom1, chatRoom2 });
    });

    // : send a message on clicking the send message button
    $("#send-message").click(function () {
      // console.log("presses");
      let msg = $("#chat-message-input").val();
      $("#chat-message-input").val("");
      // console.log(msg);

      if (msg != "") {
        self.socket.emit("send_message", {
          message: msg,
          user_email: self.userEmail,
          to_user: self.receiverEmail,
          chatroom: `FB_${self.sendId}_${self.receiverId}`,
          chatroom2: `FB_${self.receiverId}_${self.sendId}`,
        });
      }
    });

    self.socket.on("receive_message", function (data) {
      if (
        (data.user_email == self.userEmail &&
          data.to_user == self.receiverEmail) ||
        (data.to_user == self.userEmail &&
          data.user_email == self.receiverEmail)
      ) {
        let newMessage = $("<li>");

        let messageType = "other-message";

        if (data.user_email == self.userEmail) {
          messageType = "self-message";
        }

        newMessage.append(
          $("<span>", {
            html: data.message,
          })
        );

        // newMessage.append($('<sub>', {
        //     'html': data.user_email
        // }));

        newMessage.addClass(messageType);

        $("#chat-messages-list").append(newMessage);

        const ele = document.getElementById("chat-messages-list");
        ele.scrollTop = ele.scrollHeight;
      }
    });

    self.socket.on("receive_link", function (data) {
      // console.log("recieved link", data);

      let newMessage = $("<li>");
      newMessage.append(
        $("<span>", {
          html: `<a target='_blank' href="/${data.chatRoom1}">click Here to join videochat </a>`,
        })
      );

      // newMessage.append($('<sub>', {
      //     'html': data.user_email
      // }));

      newMessage.addClass("self-message");

      // console.log(newMessage);

      $("#chat-messages-list").append(newMessage);

      const ele = document.getElementById("chat-messages-list");
      ele.scrollTop = ele.scrollHeight;
    });
  }
}
