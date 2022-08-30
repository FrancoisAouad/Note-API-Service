import * as dotenv from 'dotenv';
dotenv.config();
import adminController from './admin/admin.controller.js';
import categoryController from './categories/category.controller.js';
import notesController from './notes/notes.controller.js';
import userController from './user/user.controller.js';
import App from './app.js';
import './lib/db/mongoCon.js';
import './lib/db/redisCon.js';

const app = new App([
    new adminController(),
    new categoryController(),
    new notesController(),
    new userController(),
]);

app.listen();
