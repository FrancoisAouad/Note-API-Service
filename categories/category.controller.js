import express from 'express';
import { verifyAccessToken } from '../lib/auth/jwtVerify.js';
import categoryService from './category.service.js';
import { isEmailVerified } from '../middleware/secure/isUserVerified.js';
import { isCategoryPermitted } from '../middleware/secure/isPermitted.js';

const CategoryService = new categoryService();

export class Controller {
    constructor() {
        this.path = '/category';
        this.router = express.Router();
        this.initializeRoutes();
    }

    async deleteCategory(req, res, next) {
        try {
            const result = await CategoryService.deleteCategory(
                req.params,
                req.header.authorization
            );
            res.status(200).json({
                success: true,
                messsage: 'Deleted Category!',
                data: result,
            });
        } catch (e) {
            next(e);
        }
    }
    async addCategory(req, res, next) {
        try {
            const result = await CategoryService.addCategory(
                req.header.authorization,
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
            const result = await CategoryService.getCategory(
                req.header.authorization
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
            const result = await CategoryService.editCategory(
                req.params,
                req.body
            );
            res.status(200).json({
                success: true,
                messsage: 'Edited Category!',
                data: result,
            });
        } catch (e) {
            next(e);
        }
    }

    initializeRoutes() {
        this.router.post(
            `/${this.path}`,
            verifyAccessToken,
            isEmailVerified,
            this.addCategory
        );
        this.router.get(
            `/${this.path}`,
            verifyAccessToken,
            isEmailVerified,
            this.getCategories
        );
        this.router.put(
            `/${this.path}/:categoryId`,
            verifyAccessToken,
            isEmailVerified,
            isCategoryPermitted,
            this.editCategory
        );
        this.router.delete(
            `/${this.path}/:categoryId`,
            verifyAccessToken,
            isEmailVerified,
            isCategoryPermitted,
            this.deleteCategory
        );
    }
}
