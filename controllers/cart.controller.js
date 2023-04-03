import Cart from '../models/cart.model.js';
import Variant from '../models/variant.model.js';
import { validationResult } from 'express-validator';

const getCart = async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id }).populate({
        path: 'cartItems.variant',
        populate: { path: 'product' },
    });
    if (!cart) {
        res.status(404);
        throw new Error('Giỏ hàng không tồn tại');
    }
    res.status(200).json({ message: 'Success', data: { cartItems: [...cart.cartItems] } });
};

/* const addToCart = async (req, res) => {
    const { productId, quantity, _id } = req.body;
    const product = await Product.findById(productId);
    const cartExist = await Cart.findOne({ user: _id });
    if (cartExist) {
        //update
        const productExit = cartExist?.cartItems?.find((value) => value.product == productId);
        if (productExit) {
            const newArray = cartExist?.cartItems;
            for (let i = 0; i <= newArray.length - 1; i++) {
                if (newArray[i].product == productId && typeof quantity != 'boolean') {
                    newArray[i].quantity = quantity;
                }
                if (newArray[i].product == productId && typeof quantity == 'boolean') {
                    newArray[i].isBuy = !newArray[i]?.isBuy;
                }
            }
            cartExist.cartItems = newArray;
            await cartExist.save();

            res.status(201).json('success');
            return;
        }
        const cartadd = {
            product: productId,
            // name: product.name,
            // image: product.image,
            // price: product.price,
            quantity: quantity,
            // countInStock: product.countInStock,
        };
        cartExist.cartItems.push(cartadd);
        await cartExist.save();
        const cartCurrent = cartExist.cartItems;
        res.status(201).json(cartCurrent);
        return;
    } else {
        const newCart = new Cart({
            user: _id,
            cartItems: [
                {
                    product: productId,
                    // name: product.name,
                    // image: product.image,
                    // price: product.price,
                    quantity,
                    // countInStock: product.countInStock,
                },
            ],
        });
        const createCart = await newCart.save();
        res.status(201).json(createCart.cartItems);

        return;
    }
}; */

// const removeItemFromCart = async (req, res) => {
//     const { user, pr } = req.body;
//     // const user = req.query.us
//     // const pr = req.params.pr
//     const cartExist = await Cart.findOne({ user: user });

//     if (cartExist) {
//         //update
//         const newArray = cartExist.cartItems;
//         const productExit = newArray.find((value) => value.product == pr);
//         if (!productExit) {
//             res.status(404);
//             throw new Error('Product not found');
//         }
//         cartExist.cartItems = newArray.filter((value) => value.product != pr);
//         await cartExist.save();
//         res.status(201).json('Success');
//     } else {
//         res.status(404);
//         throw new Error(`user:${user} , pr: ${pr}`);
//     }
// };

// const clearCart = async (req, res) => {
//     const cart = await Cart.findOne({ user: req.user._id });
//     if (cart) {
//         await Cart.updateMany({ user: req.user._id }, { $pull: { cartItems: { isBuy: true } } });
//         // await cart.save();
//         res.json({ message: 'Cart clear' });
//     } else {
//         res.status(404);
//         throw new Error('Can not clear this cart');
//     }
// };

const addToCart = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const { variantId } = req.body;
    const quantity = parseInt(req.body.quantity);
    if (!quantity) {
        res.status(404);
        throw new Error('Số lượng không hợp lệ');
    }
    const findCart = Cart.findOne({ user: req.user._id });
    const findVariant = Variant.findById(variantId);
    const [cart, variant] = await Promise.all([findCart, findVariant]);
    if (!cart) {
        res.status(404);
        throw new Error('Giỏ hàng không tồn tại');
    }
    if (!variant) {
        res.status(400);
        throw new Error('Sản phẩm không tồn tại');
    }
    if (quantity <= 0) {
        res.status(400);
        throw new Error('Số lượng phải lớn hơn 0');
    }
    let isQuantityValid = true;
    let currentQuantity = 0;
    const addedItemIndex = cart.cartItems.findIndex((item) => item.variant.toString() == variant._id.toString());
    if (addedItemIndex !== -1) {
        currentQuantity = cart.cartItems[addedItemIndex].quantity;
        // cart.cartItems[addedItemIndex].quantity += quantity;
        // if (cart.cartItems[addedItemIndex].quantity > variant.quantity) {
        //     res.status(400);
        //     throw new Error('You have exceeded the maximum quantity available for this item');
        // }
    }
    isQuantityValid = quantity + currentQuantity <= variant.quantity;
    if (!isQuantityValid) {
        res.status(400);
        throw new Error('Số lượng mặt hàng thêm vào giỏ đã vượt số lượng mặt hàng có trong kho');
    }
    if (addedItemIndex !== -1) {
        cart.cartItems[addedItemIndex].quantity = quantity + currentQuantity;
    } else {
        const cartItem = {
            variant: variant._id,
            quantity: quantity,
            attributes: [...variant.attributes],
        };
        cart.cartItems.push(cartItem);
    }

    await cart.save();
    res.status(200).json({ message: 'Sản phẩm đã được thêm vào giỏ', data: { cartItems: [...cart.cartItems] } });
};

const updateCartItem = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const { variantId } = req.body;
    const quantity = parseInt(req.body.quantity);
    if (!quantity) {
        res.status(404);
        throw new Error('Số lượng không hợp lệ');
    }
    const findCart = Cart.findOne({ user: req.user._id });
    const findVariant = Variant.findById(variantId);
    const [cart, variant] = await Promise.all([findCart, findVariant]);
    if (!cart) {
        res.status(404);
        throw new Error('Giỏ hàng không tồn tại');
    }
    if (!variant) {
        res.status(400);
        throw new Error('Sản phẩm không tồn tại');
    }
    if (quantity > variant.quantity) {
        res.status(400);
        throw new Error('Số lượng mặt hàng thêm vào giỏ đã vượt số lượng mặt hàng có trong kho');
    }
    const updatedItemIndex = cart.cartItems.findIndex((item) => item.variant.toString() == variantId.toString());
    if (updatedItemIndex == -1) {
        res.status(400);
        throw new Error('Sản phẩm không nằm trong giỏ hàng của bạn');
    }
    cart.cartItems[updatedItemIndex].quantity = quantity;
    let message = '';
    if (cart.cartItems[updatedItemIndex].quantity <= 0) {
        cart.cartItems.splice(updatedItemIndex, 1);
        message = 'Sản phẩm đã được xóa khỏi giỏ hàng';
    } else {
        await cart.save();
        res.status(200);
        message = 'Cập nhật sản phẩm trong giỏ hàng thành công';
    }
    await cart.save();
    res.status(200).json({ message });
};

const removeCartItems = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const variantIds = req.body.variantIds;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        res.status(404);
        throw new Error('Giỏ hàng không tồn tại');
    }

    await Cart.updateMany({ _id: cart._id }, { $pull: { cartItems: { variant: { $in: variantIds } } } });
    res.status(200).json({ success: true, message: 'Sản phẩm đã được xóa khỏi giỏ hàng' });
};

const cartController = { getCart, addToCart, updateCartItem, removeCartItems };
export default cartController;
