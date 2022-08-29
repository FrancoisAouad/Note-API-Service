import * as dotenv from 'dotenv';
dotenv.config();
import adminController from './admin/admin.controller.js';
import categoryController from './categories/category.controller.js';
import notesController from './notes/notes.controller/';
import userController from './categories/category.controller.js';
import App from './categories/category.controller.js';
import './config/mongoCon.js';
import './config/redisCon.js';

const app = new App([
    new adminController(),
    new categoryController(),
    new notesController(),
    new userController(),
]);

app.listen();
