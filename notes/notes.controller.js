import express from 'express';
import { isNotePermitted } from '../middleware/isPermitted.js';
import { verifyAccessToken } from '../lib/jwt/jwtVerify.js';
import { isEmailVerified } from '../middleware/isUserVerified.js';
import noteServices from './notes.service.js';
const NotesServices = new noteServices();

export class Controller {
    constructor() {
        this.path = '/notes';
        this.router = express.Router();
        this.initializeRoutes();
    }

    async createNote(req, res, next) {
        try {
            const result = await NotesServices.createNote(
                req.body,
                req.files,
                req.headers.authorization
            );

            res.status(201).json({
                success: true,
                messages: 'added new note!',
                data: result,
            });
        } catch (e) {
            next(e);
        }
    }
    async getNoteById(req, res, next) {
        try {
            const result = await NotesServices.getNoteById(
                req.params,
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
    async editNote(req, res, next) {
        try {
            const result = await NotesServices.editNote(
                req.headers.authorization,
                req.body,
                req.params
            );
            res.status(200).json({
                success: true,
                message: 'Note updated',
                data: result,
            });
        } catch (e) {
            next(e);
        }
    }
    async deleteNote(req, res, next) {
        try {
            const result = await NotesServices.deleteNote(req.params);

            res.status(200).json({
                success: true,
                data: result,
                message: 'note deleted!',
            });
        } catch (e) {
            next(e);
        }
    }
    async getNotes(req, res, next) {
        try {
            const result = await NotesServices.getNotes(
                req.headers.authorization,
                req.body,
                req.query
            );
            res.status(200).json({ success: true, data: result });
        } catch (e) {
            next(e);
        }
    }

    initializeRoutes() {
        this.router.post(
            `/${this.path}`,
            verifyAccessToken,
            isEmailVerified,
            this.createNote
        );
        this.router.get(
            `/${this.path}/:noteId`,
            verifyAccessToken,
            isEmailVerified,
            this.getNoteById
        );
        this.router.get(
            `/${this.path}`,
            verifyAccessToken,
            isEmailVerified,
            this.getNotes
        );
        this.router.patch(
            `/${this.path}/:noteId`,
            verifyAccessToken,
            isEmailVerified,
            isNotePermitted,
            this.editNote
        );
        this.router.delete(
            `/${this.path}/:noteId`,
            verifyAccessToken,
            isEmailVerified,
            isNotePermitted,
            this.deleteNote
        );
    }
}
