const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); //built-in module

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Your Name"],
    maxLength: [30, "Name cannot exceed 30 characters"],
    minLength: [4, "Name should have more than 4 characters"],
  },
  email: {
    type: String,
    required: [true, "Please Enter Your Email"],
    unique: true,
    validate: [validator.isEmail, "Please Enter a valid Email"],
  },
  password: {
    type: String,
    required: [true, "Please Enter Your Password"],
    minLength: [8, "Password should be greater than 8 characters"],
    select: false,  // means agar admin user k data dekhta h db m toh usko sab dekhe pr user k password na dekhe.
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  role: {
    type: String,
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

userSchema.pre("save", async function (next) { //now this become an event in which vefore saving this data
  if (!this.isModified("password")) {   //means if password is not chnged then no need to hash it again
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);  //this 10 is power -how strong
});

// JWT TOKEN
//JWT TOKEN ----- this token will be stored in cokkie: isse hume pta lag jayega ki aacha ye user h vo routes ko access kr skta h aur jiska role admin hai.
//login kk baad jo power milti h , vo mil jayegi.
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Compare Password

userSchema.methods.comparePassword = async function (password) {  //this will return true or false
  return await bcrypt.compare(password, this.password);
  //here this.password will return the stored hashed value of the user password.
    //here  password is password entering by the user.

};

// Generating Password Reset Token
userSchema.methods.getResetPasswordToken = function () {
  // Generating Token
  const resetToken = crypto.randomBytes(20).toString("hex"); //randombyte - generate random bytesss in form of buffer,
  //tostring(hex) - covert buffer into understandle string .

  
  // Hashing and adding resetPasswordToken to userSchema
  this.resetPasswordToken = crypto
    .createHash("sha256") //sha256 - is an algo. and diegst(hex)- convert into string.
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;  //milisecond

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
