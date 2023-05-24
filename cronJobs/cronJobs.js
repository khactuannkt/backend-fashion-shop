import schedule, { scheduleJob } from 'node-schedule';
import Token from '../models/token.model.js';
import Product from '../models/product.model.js';
import Variant from '../models/variant.model.js';
import DiscountCode from '../models/discountCode.model.js';
import User from '../models/user.model.js';
import Cart from '../models/cart.model.js';
export const deleteExpiredTokens = schedule.scheduleJob(`*/60 * * * *`, async () => {
    console.log('delete expired tokens .....................................................');
    await Token.deleteMany({
        expiresIn: { $lte: new Date() },
    });
});
// const deleteProduct = schedule.scheduleJob(`*/1440 * * * *`, async () => {
//     console.log('delete product .....................................................');
//     let expired = new Date();
//     expired.setDate(expired.getDate() - 30);
//     const findProducts = await Product.find({
//         deleted: true,
//         updatedAt: { $lte: expired },
//     });
//     if (findProducts.length > 0) {
//         findProducts.map(async (product) => {
//             await Variant.deleteMany({
//                 product: product._id,
//             });
//             await product.remove();
//         });
//     }
// });
// const removeExpiredDiscountCodeFromUser = schedule.scheduleJob(`*/1 * * * *`, async () => {
//     console.log('delete discountCode .....................................................');

//     const findDiscountCodes = await DiscountCode.distinct('_id', {
//         endDate: { $lte: new Date() },
//     });
//     console.log(findDiscountCodes);
//     // findDiscountCodes.map(async (discountCode) => {
//     // const deletedDiscountCodeInUser = await User.updateMany({discountCode: }, { $set: { deleted: true } });
//     // });
//     await User.updateMany(
//         { discountCode: { $in: findDiscountCodes } },
//         { $pull: { discountCode: { $in: findDiscountCodes } } },
//     );
// });
const deleteProductInCart = schedule.scheduleJob(`*1440 * * * *`, async () => {
    console.log('delete product in cart user.....................................................');
    let expired = new Date();
    expired.setDate(expired.getDate() + 7);
    const findProducts = await Product.find({
        deleted: true,
        updatedAt: { $lte: expired },
    });
    if (findProducts.length > 0) {
        findProducts.map(async (product) => {
            await Cart.updateMany(
                { cartItems: { $elemMatch: { variant: { $in: product.variants } } } },
                { $pull: { cartItems: { variant: { $in: product.variants } } } },
            );
        });
    }
});
