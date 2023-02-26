import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import YAML from 'yamljs';
import swaggerUiExpress from 'swagger-ui-express';
import connectDatabase from './config/db.config.js';
import ImportData from './routes/DataImport.js';
import productRouter from './routes/product.route.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import userRouter from './routes/user.route.js';
import orderRouter from './routes/order.route.js';
import bannerRouter from './routes/banner.route.js';
import cartRouter from './routes/cart.route.js';
import categoryRouter from './routes/category.route.js';
import testRouter from './routes/test.route.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();
connectDatabase();
const app = express();
app.use(express.static('public'));
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// swagger;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerPath = path.join(__dirname, 'config', 'swagger.config.yaml');
const swaggerDocument = YAML.load(swaggerPath);
// const swaggerDocument = YAML.load('./config/swagger.config.yaml');
app.use(
    '/fashionshopswagger',
    swaggerUiExpress.serve,
    swaggerUiExpress.setup(swaggerDocument, {
        swaggerOptions: {
            docExpansion: 'none',
        },
    }),
);
app.use('/fashionshopswagger', express.static(path.join(__dirname, 'node_modules/swagger-ui-dist')));
app.use('/fashionshopswagger', express.static(path.join(__dirname, 'node_modules/swagger-ui-dist/css')));
app.use('/fashionshopswagger', express.static(path.join(__dirname, 'node_modules/swagger-ui-dist/js')));

// API
app.use('/api/cart', cartRouter);
app.use('/api/banner', bannerRouter);
app.use('/api/import', ImportData);
app.use('/api/product', productRouter);
app.use('/api/user', userRouter);
app.use('/api/order', orderRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/test', testRouter);
app.get('/api/config/paypal', (req, res) => {
    res.send(process.env.PAYPAL_CLIENT_ID);
});

// ERROR HANDLER
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 1000;

app.listen(PORT, console.log(`Server run in port ${PORT}`));
