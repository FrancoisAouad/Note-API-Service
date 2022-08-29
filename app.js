import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import bodyParser from 'body-parser';
import corsConfig from './config/corsConfig.js';
// import authRoutes from './routes/auth.js';
// import noteRoutes from './routes/notes.js';
// import adminRoutes from './routes/admin.js';
// import categoryRoutes from './routes/category.js';
// import './config/mongoCon.js';
// import './config/redisCon.js';
import * as dotenv from 'dotenv';
import { errorHandler, sendError } from './utils/errors/errorHandlers.js';
import fileUpload from 'express-fileupload';
dotenv.config();
import 'colors';

export class App {
    constructor(controllers) {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeControllers(controllers);
        this.initializeErrorHandling();
    }

    listen() {
        this.app.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`.cyan.bold);
        });
    }

    initializeMiddlewares() {
        if (process.env.NODE_ENV === 'development') this.app.use(morgan('dev'));

        this.app.use(cors(corsConfig));
        this.__dirname = path.resolve();
        this.app.use(express.json());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(
            fileUpload({
                createParentPath: true,
            })
        );
    }

    initializeControllers(controllers) {
        controllers.array.forEach((controller) => {
            this.app.use('/api/v1', controller.router);
        });
    }

    initializeErrorHandling() {
        this.app.use(sendError);
        this.app.use(errorHandler);
    }
}

// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1', noteRoutes);
// app.use('/api/v1', categoryRoutes);
// app.use('/api/v1/admin', adminRoutes);
