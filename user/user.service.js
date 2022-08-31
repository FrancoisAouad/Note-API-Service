import crypto from 'crypto';
import User from './user.model.js';
import nodemailer from '../utils/nodemailer.js';
import client from '../lib/db/redisCon.js';
import {
    verifyRefreshToken,
    verifyResetPasswordToken,
} from '../lib/jwt/jwtVerify.js';
import {
    loginSchema,
    signupSchema,
    resetPassSchema,
} from './user.validation.js';
import {
    setAccessToken,
    setRefreshToken,
    setResetPasswordToken,
} from '../lib/jwt/jwtConfig.js';
import bcrypt from 'bcrypt';
import globalService from '../utils/globalService.js';
const GlobalService = new globalService();
class Service {
    constructor() {}

    async register(body, header) {
        //validate user input
        const result = await signupSchema.validateAsync(body);
        //genarate encrypted email token to be used for account activation
        const newToken = crypto.randomBytes(64).toString('hex');
        //check if email already exists in database
        const exists = await User.findOne({ email: result.email });
        if (exists)
            throw new Error(`${result.email} has already been registered`);

        const user = new User(result);

        //add token to db
        user.emailToken = newToken;
        const savedUser = await user.save();
        //generate access and refresh token by saving calling the methods and saving in variables
        const accessToken = setAccessToken(savedUser.id);
        const refreshToken = await setRefreshToken(savedUser.id);

        //ACTIVATION EMAIL TEMPLATE
        nodemailer({
            from: process.env.NODEMAILER_USER,
            to: result.email,
            subject: 'Email Verification',
            html: `<h2> Welcome, ${result.name}!</h2>
      <br/>
          <p>Thank you for registering, you are almost done. Please read the below message to continue.</p>
          <br/>
         <p>In order to confirm your email, kindly click the verification link below.</p>
          <br/>
        <a href="http://${header.host}/api/v1/auth/verify?token=${user.emailToken}">Click here to verify</a>`,
        });
        //send jwt tokens to client
        return { accessToken, refreshToken };
    }
    async login(body) {
        //validate input
        const result = await loginSchema.validateAsync(body);
        //check if email exists
        const user = await User.findOne({ email: result.email });
        if (!user) throw new Error('NotFound');
        //calls the isvalidpassword method in user model which compares the hashed password and inputed pass
        const isMatch = await user.isValidPassword(result.password);

        if (isMatch === false) throw new Error('Unauthorized');
        //generate access and refresh token by saving calling the methods and saving in variables
        const accessToken = setAccessToken(user.id);
        // console.log(accessToken);
        const refreshToken = await setRefreshToken(user.id);
        // console.log(refreshToken);

        return { accessToken, refreshToken };
    }
    async refreshToken(body) {
        if (!body) throw new Error('BadRequest');

        const userId = await verifyRefreshToken(body);

        const accessToken = setAccessToken(userId);

        const refToken = await setRefreshToken(userId);

        return { accessToken: accessToken, refreshToken: refToken };
    }
    async logout(body) {
        //check refresh token
        const { refreshToken } = body;
        //return error if not found
        if (!refreshToken) throw new Error('BadRequest');
        //verify the refresh token if found
        const userId = await verifyRefreshToken(refreshToken);

        //delete refresh token to logout
        client.DEL(userId, (error, val) => {
            if (error) throw new Error('InternalServerError');
        });
        // return true;
    }
    async forgotPassword(header) {
        //get logged in user
        // const authHeader = req.headers['authorization'];
        const id = GlobalService.getUser(header);
        //check if user exists
        const user = await User.findOne({ _id: id });
        //return error if user not found
        if (!user) throw new Error('unauthorized');

        //if founnd create new token for password url
        const passwordToken = await setResetPasswordToken(user.id);
        //send email to user with reset url
        nodemailer({
            from: process.env.NODEMAILER_USER,
            to: user.email,
            subject: 'Reset Password',
            html: `<h2> Dear, ${user.name}.</h2>
        <br/>
            <p>Your reset password link is available below.</p>
            <br/>
            <a href="http://${req.headers.host}/api/v1/auth/resetPassword/${passwordToken}">Reset</a>`,
        });

        //send message that email was sent
        return user;
    }
    async resetPassword(params, body, header) {
        const { token } = params;
        //validate new pass
        const result = await resetPassSchema.validateAsync(body);
        //get user id
        // const authHeader = req.headers['authorization'];
        const id = GlobalService.getUser(header);
        //check if user found
        const user = await User.findOne({ _id: id });
        if (!user) throw new Error('user not found..');
        //verify that the password token is valid
        await verifyResetPasswordToken(token);
        //salt and hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(result.password, salt);
        user.password = hashedPassword;
        //update password in database
        return await user.save();
    }
    async verifyEmail(query) {
        //check mongodb for token for this specific user
        const token = query.token;
        const user = await User.findOne({ emailToken: token });

        if (!user) throw new Error('unauthorized');
        //replace these values to show that a user is verified
        user.emailToken = 'null';
        user.isVerified = true;

        return await user.save();
    }
}
export default Service;
