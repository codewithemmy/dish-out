const Sellar = require("../models/Sellar");
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  UnauthenticatedError,
  NotFoundError,
} = require("../errors");
const crypto = require("crypto");
const createHash = require("../utils/createHash");
const { mailTransport } = require("../utils/sendEmail");

//register sellar
const register = async (req, res) => {
  const { store, floor, firstName, surname, email, phonenumber, password } =
    req.body;

  const emailAlreadyExists = await Sellar.findOne({ email });
  if (emailAlreadyExists) {
    throw new BadRequestError("Email already exists");
  }

  crypto.randomBytes(2);

  const verificationToken = crypto.randomBytes(2).toString("hex");
  const hastToken = createHash(verificationToken);
  const sellar = await Sellar.create({
    store,
    floor,
    firstName,
    surname,
    email,
    phonenumber,
    password,
    verificationToken: hastToken,
  });

  //send Mail
  mailTransport.sendMail({
    from: '"Dish-Out" <dishout@gmail.com>', // sender address
    to: email, // list of receivers
    subject: "VERIFY YOUR EMAIL ACCOUNT", // Subject line
    html: `Hello, ${firstName}, kindly verify your account with this token:<h4>${verificationToken}</h4>`, // html body
  });

  res.status(StatusCodes.CREATED).json({
    msg: "Success! Please check your email to verify account",
    sellar,
  });
};

//verify user
const verifyEmail = async (req, res) => {
  const { id } = req.params;
  const { verificationToken } = req.body;
  const sellar = await Sellar.findOne({ _id: id });

  if (!verificationToken) {
    throw new NotFoundError("kindly input verification token");
  }

  if (!sellar) {
    throw new NotFoundError("Sellar not found");
  }

  const hastToken = createHash(verificationToken);

  if (sellar.verificationToken !== hastToken) {
    throw new BadRequestError("Verification Failed");
  }

  (sellar.isVerified = true), (sellar.verified = Date.now());
  sellar.verificationToken = "";

  await sellar.save();

  //send Mail
  mailTransport.sendMail({
    from: '"Dish-Out" <dishout@gmail.com>', // sender address
    to: sellar.email, // list of receivers
    subject: "MAIL IS VERIFIED", // Subject line
    html: `<h4> Hello, ${sellar.firstName}</h4> <h2>Congrats</h2> you are now verified,you can login now`, // html body
  });

  res.status(StatusCodes.OK).json({ msg: "Email Verified" });
};

//user login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError(`Please provide username or password`);
  }
  const sellar = await Sellar.findOne({ email });

  if (!sellar) {
    throw new BadRequestError(`Invalid username or password`);
  }

  const isPasswordCorrect = await sellar.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new BadRequestError(`Invalid username/password`);
  }

  if (!sellar.isVerified) {
    throw new UnauthenticatedError("Please verify your email");
  }

  let token = sellar.createJWT({
    userId: sellar._id,
    firstName: sellar.firstName,
    surname: sellar.surname,
    email: sellar.email,
  });

  // const oneDay = 1000 * 60 * 60 * 24;

  // res.cookie("token", token, {
  //   httpOnly: true,
  //   expires: new Date(Date.now() + oneDay),
  // });

  res
    .status(StatusCodes.OK)
    .json({ msg: "Login Successful", userId: sellar._id, token: token });
};

//user logout
// const logout = async (req, res) => {
//   res.cookie("token", "logout", {
//     httpOnly: true,
//     expires: new Date(Date.now() + 1000),
//   });
//   res.status(StatusCodes.OK).json({ msg: "user logged out!" });
// };

//forget password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new BadRequestError("Please provide valid email");
  }

  const sellar = await Sellar.findOne({ email });

  if (sellar) {
    const passwordToken = crypto.randomBytes(2).toString("hex");

    // send email
    mailTransport.sendMail({
      from: '"Dish-Out" <dishout@gmail.com>', // sender address
      to: email,
      subject: "Reset you account",
      html: `Hi, kindly reset your password with this token: <h4>${passwordToken}</h4>`,
    });

    const tenMinutes = 1000 * 60 * 10;
    const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

    sellar.passwordToken = createHash(passwordToken);
    sellar.passwordTokenExpirationDate = passwordTokenExpirationDate;
    await sellar.save();
  }

  res.status(StatusCodes.OK).json({
    msg: "Please check your email to reset password",
  });
};

//reset password
const resetPassword = async (req, res) => {
  const { token, email, newPassword } = req.body;
  if (!token || !email || !newPassword) {
    throw new BadRequestError("Please provide all values");
  }
  const sellar = await Sellar.findOne({ email });

  if (sellar) {
    const currentDate = new Date();

    if (
      sellar.passwordToken === createHash(token) &&
      sellar.passwordTokenExpirationDate > currentDate
    ) {
      sellar.password = newPassword;
      sellar.passwordToken = null;
      sellar.passwordTokenExpirationDate = null;
      await sellar.save();
    }
  }
  res.status(StatusCodes.OK).json({ msg: "your password is sucessfully reset" });
};

//export modules
module.exports = {
  register,
  login,
  // logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
