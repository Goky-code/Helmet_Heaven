
import * as authServices from "../services/authServices.js";
import HTTP_STATUS from "../utils/httpStatus.js";

export const login = async (req,res) => {

  try {

    const {
      email,
      password,
    } = req.body;

    const user =
      await authServices.loginUser(
        email,
        password
      );

    req.session.user = user;

    res.json({
      success: true,
    });

  } catch (error) {

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: error.message,
    });

  }

};

export const signup = async (req, res) => {
    try {
        const signupData = await authServices.createSignupSession(
            req.body
        )

        req.session.signupData = signupData;

        return res.redirect("/user/verifyOtp");
    } catch (error) {
        return res.status(400).render("user/signup", {
            message: error.message,
            firstname: req.body.firstname || "",
            lastname: req.body.lastname || "",
            email: req.body.email || ""
        });
    }
}

export const verifyOtp = async (req, res) => {
    try {
        const result = await authServices.verifySignupOtp(
            req.session.signupData,
            req.body.otp
        );

        req.session.signupData = null;

        return res.redirect("/user/login");

    } catch (error) {
        if (req.session.signupData) {
            return res.status(400).render("user/verifyOtp", {
                otpError: error.message,
                newEmail: req.session.signupData.email,
                otpExpiry: req.session.signupData.otpExpiry
            });
        }

        return res.redirect("/user/signup");
    }
}

export const resendOtp = async (req, res) => {

  try {

    req.session.signupData =
      await authServices.resendSignupOtp(
        req.session.signupData
      );

    res.redirect("/user/verifyOtp");

  } catch (error) {
    console.log(error);
    res.redirect("/user/signup");
  }
}


export const forgotPassword = async (req, res) => {

  try {

    const email =
      await authServices.forgotPassword(
        req.body.email
      );

    req.session.resetEmail = email;

    res.redirect("/auth/verifyForgotpassOtp");

  } catch (error) {

    res.render(
      "user/forgotPassword",
      {
        error: error.message,
      }
    )
  }
}

export const verifyForgotOtp = async (req,res) => {

  try {

    await authServices.verifyForgotPasswordOtp(
      req.session.resetEmail,
      req.body.otp
    );

    req.session.isOtpVerified = true;

    res.redirect("/user/resetPassword");

  } catch (error) {

    res.render(
      "user/verifyForgotpassOtp",
      {
        otpError: error.message,
      }
    );

  }

}

export const resendOtpforgot =async(req,res) => {

  try {

    await authServices.resendForgotPasswordOtp(
      req.session.resetEmail
    );

    res.render(
      "user/verifyForgotpassOtp",
      {
        message:
          "OTP resent successfully!",
      }
    );

  } catch (error) {

    console.log(error);

    res.redirect(
      "/auth/forgotPassword"
    );

  }
}

export const resetPassword = async (req, res) => {

  try {

    await authServices.resetUserPassword(
      req.session.resetEmail, req.session.isOtpVerified,
      req.body.password,req.body.confirmpassword
    )

    req.session.resetEmail = null
    req.session.isOtpVerified = null

    res.redirect("/user/login")

  } catch (error) {
    console.log(error)
    res.render("user/resetPassword", {
      message: error.message,
    })
  }
}

