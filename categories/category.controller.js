import express from 'express';
import { verifyAccessToken } from '../lib/jwt/jwtVerify.js';
import categoryService from './category.service.js';
import { isEmailVerified } from '../middleware/isUserVerified.js';
import { isCategoryPermitted } from '../middleware/isPermitted.js';

const CategoryService = new categoryService();

class Controller {
    constructor() {
        this.path = '/category';
        this.router = express.Router();
        this.initializeRoutes();
    }

    async deleteCategory(req, res, next) {
        try {
            await CategoryService.deleteCategory(
                req.params,
                req.headers.authorization
            );
            res.status(200).json({
                success: true,
                messsage: 'Deleted Category!',
            });
        } catch (e) {
            next(e);
        }
    }
    async addCategory(req, res, next) {
        try {
            const result = await CategoryService.addCategory(
                req.headers.authorization,
                req.body
            );
            res.status(201).json({
                success: true,
                messsage: 'Added Category!',
                data: result,
            });
        } catch (e) {
            next(e);
        }
    }
    async getCategories(req, res, next) {
        try {
            const result = await CategoryService.getCategories(
                req.headers.authorization
            );
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (e) {
            next(e);
        }
    }
    async editCategory(req, res, next) {
        try {
            await CategoryService.editCategory(req.params, req.body);
            res.status(200).json({
                success: true,
                messsage: 'Edited Category!',
            });
        } catch (e) {
            next(e);
        }
    }

    initializeRoutes() {
        this.router.post(
            `${this.path}`,
            verifyAccessToken,
            isEmailVerified,
            this.addCategory
        );
        this.router.get(
            `${this.path}`,
            verifyAccessToken,
            isEmailVerified,
            this.getCategories
        );
        this.router.put(
            `${this.path}/:categoryId`,
            verifyAccessToken,
            isEmailVerified,
            isCategoryPermitted,
            this.editCategory
        );
        this.router.delete(
            `${this.path}/:categoryId`,
            verifyAccessToken,
            isEmailVerified,
            isCategoryPermitted,
            this.deleteCategory
        );
    }
}
export default Controller;
