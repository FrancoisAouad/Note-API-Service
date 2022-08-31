import express from 'express';
import adminService from './admin.service.js';
const AdminService = new adminService();
class Controller {
    constructor() {
        this.path = '/admin';
        this.router = express.Router();
        this.initializeRoutes();
    }

    async getListOfUsers(req, res, next) {
        try {
            const result = await AdminService.getListOfUsers(req.body.name);
            res.status(200).json({ success: true, data: result });
        } catch (e) {
            next(e);
        }
    }
    //WORKING-----------------------
    async getNotesByCategory(req, res, next) {
        try {
            const result = await AdminService.getNotesByCategory();
            res.status(200).json({ success: true, data: result });
        } catch (e) {
            next(e);
        }
    }
    async getNotesCreated(req, res, next) {
        try {
            const result = await AdminService.getNotesCreated();
            res.status(200).json({ data: result });
        } catch (e) {
            next(e);
        }
    }
    async getNotesByTags(req, res, next) {
        try {
            const result = await AdminService.getNotesByTags(req.query);
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
export default Controller;
