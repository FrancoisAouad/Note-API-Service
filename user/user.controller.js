import { verifyAccessToken } from '../lib/jwt/jwtVerify.js';
import { isEmailVerified } from '../middleware/isUserVerified.js';
import express from 'express';
import userService from './user.service.js';

const UserService = new userService();
class Controller {
    constructor() {
        this.path = '/auth';
        this.router = express.Router();
        this.initializeRoutes();
    }

    async register(req, res, next) {
        try {
            const result = await UserService.register(req.body, req.headers);
            res.status(201).json({ data: result });
        } catch (e) {
            if (e.isJoi === true) e.status = 422;
            next(e);
        }
    }
    async login(req, res, next) {
        try {
            const result = await UserService.login(req.body);
            res.status(200).json({ data: result });
        } catch (e) {
            if (e.isJoi === true) e.status = 422;
            next(e);
        }
    }
    async refreshToken(req, res, next) {
        try {
            console.log(req.body.refreshToken);
            const result = await UserService.refreshToken(
                req.body.refreshToken
            );
            res.status(200).json({ data: result });
        } catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            await UserService.logout(req.body);
            res.status(204).json({ success: true });
        } catch (e) {
            next(e);
        }
    }
    async forgotPassword(req, res, next) {
        try {
            const result = await UserService.forgotPassword(
                req.headers.authorization
            );

            res.status(200).json({
                sucess: true,
                message: `resetpass email sent to ${result.email}`,
                data: result,
            });
        } catch (e) {
            next(e);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const result = await UserService.resetPassword(
                req.params,
                req.body,
                req.headers.authorization
            );
            res.status(200).json({
                success: true,
                message: 'password successfully reset.',
                data: result,
            });
        } catch (e) {
            if (e.isJoi === true) e.status = 422;
            next(e);
        }
    }
    async verifyEmail(req, res, next) {
        try {
            await UserService.verifyEmail(req.headers.authorization);
            res.status(200).json({
                success: true,
            });
        } catch (e) {
            next(e);
        }
    }

    initializeRoutes() {
        this.router.post(`${this.path}/login`, this.login);
        this.router.post(`${this.path}/register`, this.register);
        this.router.post(
            `${this.path}/refreshtoken`,
            verifyAccessToken,
            this.refreshToken
        );
        this.router.post(
            `${this.path}/forgotpassword`,
            verifyAccessToken,
            isEmailVerified,
            this.forgotPassword
        );
        this.router.delete(
            `${this.path}/logout`,
            verifyAccessToken,
            isEmailVerified,
            this.logout
        );
        this.router.get(`${this.path}/verifyemail`, this.verifyEmail);
        this.router.patch(
            `${this.path}/resetpassword/:token`,
            this.resetPassword
        );
    }
}
export default Controller;
