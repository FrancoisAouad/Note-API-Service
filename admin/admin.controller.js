import express from 'express';
import AdminService from './admin.service';
const adminService = new AdminService();
export class Controller {
    constructor() {
        this.path = '/admin';
        this.router = express.Router();
        this.initializeRoutes();
    }

    async getListOfUsers(req, res, next) {
        try {
            const result = await adminService.getListOfUsers(req.body);
            res.status(200).json({ data: result });
        } catch (e) {
            next(e);
        }
    }
    async getNotesByCategory(req, res, next) {
        try {
            const result = await adminService.getListOfUsers();
            res.status(200).json({ data: result });
        } catch (e) {
            next(e);
        }
    }
    async getNotesCreated(req, res, next) {
        try {
            const result = await adminService.getNotesCreated();
            res.status(200).json({ data: result });
        } catch (e) {
            next(e);
        }
    }
    async getNotesByTags(req, res, next) {
        try {
            const result = await adminService.getNotesByTags(req.query);
            res.status(200).json({ data: result });
        } catch (e) {
            next(e);
        }
    }

    initializeRoutes() {
        this.router.get(`${this.path}/listofusers`, this.getListOfUsers);
        this.router.get(
            `${this.path}/notesbycategory`,
            this.getNotesByCategory
        );
        this.router.get(`${this.path}/listnotescreated`, this.getNotesCreated);
        this.router.get(`${this.path}/notesbytags`, this.getNotesByTags);
    }
}
