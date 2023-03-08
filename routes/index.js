import ImportData from './DataImport.js';
import productRouter from './product.route.js';
import userRouter from './user.route.js';
import orderRouter from './order.route.js';
import bannerRouter from './banner.route.js';
import cartRouter from './cart.route.js';
import categoryRouter from './category.route.js';
import testRouter from './test.route.js';
const routes = (app) => {
    app.use('/api/v1/cart', cartRouter);
    app.use('/api/v1/banner', bannerRouter);
    app.use('/api/v1/import', ImportData);
    app.use('/api/v1/product', productRouter);
    app.use('/api/v1/user', userRouter);
    app.use('/api/v1/order', orderRouter);
    app.use('/api/v1/categories', categoryRouter);
    app.use('/api/v1/test', testRouter);
    app.get('/api/v1/config/paypal', (req, res) => {
        res.send(process.env.PAYPAL_CLIENT_ID);
    });
};
export default routes;
