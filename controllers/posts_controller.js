const Post = require("../models/post");
const Comment = require("../models/comment");
const fs = require("fs");
const path = require("path");
const Like = require("../models/like");
const cloudinary = require("../config/cloudinary");

// controller for handling post creations
module.exports.create = function (req, res) {
  try {
    Post.uploadedPost(req, res, async function (err) {
      if (err) {
        console.log("*****Multer Error: ", err);
      }

      try {
        let post = {
          content: req.body.content,
          user: req.user._id,
        };

        if (req.file) {
          // this is saving the path of the uploaded file into the avatar field in the user

          // post.postpic =  Post.postPath + '/' + req.file.filename ;
          const res = await cloudinary.uploader.upload(req.file.path, {
            public_id: req.file.filename,
          });

          post.postpic = res.secure_url;
          let newPost = await Post.create(post);
        }

        req.flash("success", "Post published!");
        return res.redirect("/");
      } catch (error) {
        req.flash("error", error.message);
        return res.redirect("/");
      }
    });
  } catch (err) {
    req.flash("error", err);
    return res.redirect("back");
  }
};

//  Handle Deleteing a post
module.exports.destroy = async function (req, res) {
  try {
    let post = await Post.findById(req.params.id);

    if (post.user == req.user.id) {
      //  delete the associated likes for the post and all its comments' likes too
      await Like.deleteMany({ likeable: post, onModel: "Post" });
      await Like.deleteMany({ _id: { $in: post.comments } });

      post.remove();

      // deleting post's comments
      await Comment.deleteMany({ post: req.params.id });

      req.flash("success", "Post and associated comments deleted!");

      return res.redirect("back");
    } else {
      req.flash("error", "You cannot delete this post!");
      return res.redirect("back");
    }
  } catch (err) {
    console.log(err);
    req.flash("error", err);
    return res.redirect("back");
  }
};
