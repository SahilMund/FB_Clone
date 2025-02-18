const User = require("../models/user");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../config/cloudinary");

// Rendering profile pages
module.exports.profile = function (req, res) {
  User.findById(req.params.id, function (err, user) {
    return res.render("user_profile", {
      title: "User Profile",
      profile_user: user,
    });
  });
};

// Controlller for updating users profile
module.exports.updateProfile = async function (req, res) {
  if (req.user.id == req.params.id) {
    try {
      let user = await User.findById(req.params.id);

      //as our form is multipart form, so we can't read it using req.params, so need to use multer req object
      User.uploadedAvatar(req, res, async function (err) {
        try {
          if (err) {
            console.log("*****Multer Error: ", err);
          }

          user.name = req.body.name;
          user.email = req.body.email;
          user.password = req.body.password;
          if (req.file) {
            const res = await cloudinary.uploader.upload(req.file.path, {
              public_id: req.file.filename,
            });

            user.avatar = res.secure_url;
          }

          // console.log(user);
          user.save();
          req.flash("success", "Profile updated successfully !!");
          return res.redirect("back");
        } catch (error) {
          console.log(error);
        }
      });
    } catch (err) {
      req.flash("error", err);
      return res.redirect("back");
    }
  } else {
    req.flash("error", "Unauthorized!");
    return res.status(401).send("Unauthorized");
  }
};

// Controller for handling Friend Requests functionality :-
module.exports.sendFriendRequest = async function (req, res) {
  try {
    let sender = await User.findById(req.user.id);
    let receiver = await User.findById(req.params.id);

    // Creating two objects, sender and receiver and push it into the users friendlist with the status

    let senderObj = {
      userid: req.params.id,
      status: "Send",
    };
    let receiverObj = {
      userid: req.user.id,
      status: "Receive",
    };

    sender.friendList.push(senderObj);
    sender.save();

    receiver.friendList.push(receiverObj);
    receiver.save();

    req.flash("success", "Friend Request Sent Successfully");
    return res.redirect("back");
  } catch (error) {
    req.flash("error", error);
    return res.status(500).send(error);
  }
};

module.exports.acceptFriendRequest = async function (req, res) {
  try {
    let acceptor = await User.findOne({ _id: req.user.id });
    let requestor = await User.findOne({ _id: req.params.id });

    //let's update the model
    // Updating the status from send/receive to friends from both sender/receiver's friendlist

    acceptor.friendList.forEach((data) => {
      //if the request's userid and data's userid matches , make them friends
      if (data.userid == req.params.id) {
        data.status = "Friends";
      }
    });
    acceptor.save();

    requestor.friendList.forEach((data) => {
      if (data.userid == req.user.id) {
        data.status = "Friends";
      }
    });
    requestor.save();

    req.flash("success", "Friend Request Accepted Successfully");
    return res.redirect("back");
  } catch (error) {
    console.log(error);
    req.flash("error", error);
    return res.redirect("back");
  }
};

module.exports.removeFriendRequest = async function (req, res) {
  try {
    // console.log(`${req.user.id} wants to remove ${req.params.id} as a friend`);

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { friendList: { userid: req.params.id } },
    });
    await User.findByIdAndUpdate(req.params.id, {
      $pull: { friendList: { userid: req.user.id } },
    });
    req.flash(
      "success",
      "Friend/Follow Request Removed/Cancelled Successfully"
    );
    return res.redirect("back");
  } catch (error) {
    req.flash("error", error);
    return res.status(500).send(error);
  }
};

module.exports.followRequest = async function (req, res) {
  try {
    // console.log(`${req.user.id} wants to follow ${req.params.id}`);

    let sender = await User.findById(req.user.id);
    let receiver = await User.findById(req.params.id);

    // Storing follower/following status , this is for organization/celebrities page
    let senderObj = {
      userid: req.params.id,
      status: "Follower",
    };
    let receiverObj = {
      userid: req.user.id,
      status: "Following",
    };

    sender.friendList.push(senderObj);
    sender.save();

    receiver.friendList.push(receiverObj);
    receiver.save();

    req.flash("success", "You have followed the page Successfully");
    return res.redirect("back");
  } catch (error) {
    req.flash("error", error);
    return res.status(500).send(error);
  }
};

// render the sign up page
module.exports.signUp = function (req, res) {
  if (req.isAuthenticated()) {
    return res.redirect("/users/profile");
  }

  return res.render("user_sign_up", {
    title: "Codeial | Sign Up",
  });
};

// render the sign in page
module.exports.signIn = function (req, res) {
  if (req.isAuthenticated()) {
    return res.redirect("/users/profile");
  }
  return res.render("user_sign_in", {
    title: "Codeial | Sign In",
  });
};

// get the sign up data and create an user
module.exports.create = function (req, res) {
  try {
    //as our form is multipart form, so we can't read it using req.params, so need to use multer req object
    User.uploadedAvatar(req, res, function (err) {
      if (err) {
        console.log("*****Multer Error: ", err);
      }

      if (req.body.password != req.body.confirm_password) {
        req.flash("error", "Passwords do not match");
        return res.redirect("back");
      }

      User.findOne({ email: req.body.email }, async function (err, user) {
        if (err) {
          req.flash("error", err);
          return;
        }

        // if (req.file) {
        //   // this is saving the path of the uploaded file into the avatar field in the user
        //   req.body.avatar = User.avatarPath + "/" + req.file.filename;
        // }

        if (req.file) {
          const res = await cloudinary.uploader.upload(req.file.path, {
            public_id: req.file.filename,
          });

          req.body.avatar = res.secure_url;
        }

        if (!user) {
          try {
            User.create(req.body, function (err, user) {
              if (err) {
                req.flash("error", err);
                return;
              }
              req.flash("success", "You have signed up, login to continue!");
              return res.redirect("/users/sign-in");
            });
          } catch (err) {
            req.flash("error", err);
            return res.redirect("back");
          }
        } else {
          req.flash("error", "Email already exists, Please SignIn to continue");
          return res.redirect("back");
        }
      });
    });
  } catch (err) {
    console.log(err);
    req.flash("error", err);
    return res.redirect("back");
  }
};

// sign in and create a session for the user
module.exports.createSession = function (req, res) {
  req.flash("success", "Logged in Successfully");
  return res.redirect("/");
};

//  For handling logout functionality
module.exports.destroySession = function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("success", "You have logged out!");
    return res.redirect("/users/sign-in");
  });
};
