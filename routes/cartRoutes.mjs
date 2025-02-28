import express from 'express';
import Cart from '../models/cart.mjs'; 
import Product from '../models/product.mjs'; 

const router = express.Router();


router.get('/cart', async (req, res) => {
  try {
    const userId = req.session.userId; 
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    
    let subtotal = 0;
    if (cart && cart.items) {
      cart.items.forEach(item => {
        subtotal += item.productId.price * item.quantity;
      });
    }

    res.render('cart', { cart, subtotal: subtotal.toFixed(2) });
  } catch (error) {
    console.error(error);
    res.status(500).send('Lỗi khi tải giỏ hàng');
  }
});

let cart = { items: [] };

router.post('/add-to-cart', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity) {
      return res.status(400).json({ message: 'Missing productId or quantity' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne();
    if (!cart) {
      cart = new Cart({
        items: [{ productId: product._id, quantity }],
      });
      await cart.save();
      return res.status(200).json({ message: 'Product added to cart successfully' });
    } else {
      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
      if (itemIndex >= 0) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ productId: product._id, quantity });
      }
      await cart.save();
      return res.status(200).json({ message: 'Product added to cart successfully' });
    }
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/remove-from-cart', async (req, res) => {
  const { productId } = req.body; 

  try {
    const userId = req.session.userId; 

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId: productId } } }, 
      { new: true } 
    );

    if (!cart) {
      return res.status(404).send({ message: "Giỏ hàng không tồn tại." });
    }

    let subtotal = 0;
    cart.items.forEach(item => {
      subtotal += item.productId.price * item.quantity;
    });

    res.json({ message: 'Sản phẩm đã được xóa', subtotal: subtotal.toFixed(2) });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng.' });
  }
});

export default router;
