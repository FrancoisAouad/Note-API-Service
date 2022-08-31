import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import bodyParser from 'body-parser';
import corsConfig from './config/corsConfig.js';
import * as dotenv from 'dotenv';
import { errorHandler, sendError } from './utils/errors/errorHandlers.js';
import fileUpload from 'express-fileupload';
dotenv.config();
import 'colors';

class App {
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
        controllers.forEach((controller) => {
            this.app.use('/api/v1', controller.router);
        });
    }

    initializeErrorHandling() {
        this.app.use(sendError);
        this.app.use(errorHandler);
    }
}
export default App;
