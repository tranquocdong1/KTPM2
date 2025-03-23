// Trong file router Node.js, thêm một API endpoint mới trả về JSON
// Giữ nguyên route hiện tại để render trang web

import express from 'express';
import Cart from '../models/cart.mjs'; 
import Product from '../models/product.mjs'; 

const router = express.Router();

// Route này để hiển thị trang web (giữ nguyên)
router.get('/cart', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).send('Vui lòng đăng nhập để xem giỏ hàng');
    }

    const cart = await Cart.findOne({ userId }).populate('items.productId');

    let subtotal = 0;
    if (cart && cart.items) {
      cart.items = cart.items.filter(item => item.productId);
      cart.items.forEach(item => {
        if (item.productId && item.productId.price) {
          subtotal += item.productId.price * item.quantity;
        }
      });
    }

    res.render('cart', { cart: cart || { items: [] }, subtotal: subtotal.toFixed(2) });
  } catch (error) {
    console.error(error);
    res.status(500).send('Lỗi khi tải giỏ hàng');
  }
});

// Thêm route mới để trả về JSON cho ứng dụng mobile
router.get('/api/cart', async (req, res) => {
  console.log('Headers:', req.headers);
  console.log('X-User-Id:', req.headers['x-user-id']);
  console.log('Session userId:', req.session.userId);
  try {
    const userId = req.headers['x-user-id'] || req.session.userId; // Hỗ trợ cả web và mobile
    if (!userId) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập để xem giỏ hàng' });
    }

    const cart = await Cart.findOne({ userId }).populate('items.productId');

    let subtotal = 0;
    let items = [];

    if (cart && cart.items) {
      items = cart.items
        .filter(item => item.productId)
        .map(item => {
          if (item.productId && item.productId.price) {
            const itemSubtotal = item.productId.price * item.quantity;
            subtotal += itemSubtotal;

            return {
              productId: item.productId._id,
              name: item.productId.name,
              price: item.productId.price,
              quantity: item.quantity,
              image: item.productId.image,
              subtotal: itemSubtotal,
            };
          }
          return null;
        })
        .filter(item => item !== null);
    }

    res.json({
      items,
      subtotal: subtotal.toFixed(2),
      count: items.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi khi tải giỏ hàng' });
  }
});

// Các route khác giữ nguyên
let cart = { items: [] };

router.post('/add-to-cart', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.headers['x-user-id'] || req.session.userId; // Hỗ trợ cả web và mobile

    if (!userId) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng' });
    }
    if (!productId || !quantity) {
      return res.status(400).json({ message: 'Thiếu productId hoặc quantity' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      // Nếu user chưa có giỏ hàng, tạo mới
      cart = new Cart({
        userId,
        items: [{ productId: product._id, quantity: parseInt(quantity) }],
      });
    } else {
      // Nếu đã có giỏ hàng, kiểm tra sản phẩm trong giỏ
      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
      if (itemIndex >= 0) {
        cart.items[itemIndex].quantity += parseInt(quantity);
      } else {
        cart.items.push({ productId: product._id, quantity: parseInt(quantity) });
      }
    }

    await cart.save();
    return res.status(200).json({ message: 'Sản phẩm đã được thêm vào giỏ hàng' });
  } catch (error) {
    console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/remove-from-cart', async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập để xóa sản phẩm' });
    }

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId } } },
      { new: true }
    ).populate('items.productId');

    if (!cart) {
      return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
    }

    let subtotal = 0;
    cart.items.forEach(item => {
      if (item.productId && item.productId.price) {
        subtotal += item.productId.price * item.quantity;
      }
    });

    res.json({ message: 'Sản phẩm đã được xóa', subtotal: subtotal.toFixed(2) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng' });
  }
});

router.post('/api/remove-from-cart', async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.headers['x-user-id'] || req.session.userId; // Hỗ trợ cả web và mobile

    if (!userId) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập để xóa sản phẩm' });
    }

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId } } },
      { new: true }
    ).populate('items.productId');

    let subtotal = 0;
    let items = [];

    if (cart && cart.items) {
      items = cart.items
        .filter(item => item.productId)
        .map(item => {
          if (item.productId && item.productId.price) {
            const itemSubtotal = item.productId.price * item.quantity;
            subtotal += itemSubtotal;

            return {
              _id: item.productId._id,
              name: item.productId.name,
              price: item.productId.price,
              quantity: item.quantity,
              image: item.productId.image,
              subtotal: itemSubtotal,
            };
          }
          return null;
        })
        .filter(item => item !== null);
    }

    res.json({
      message: 'Sản phẩm đã được xóa',
      items,
      subtotal: subtotal.toFixed(2),
      count: items.length,
      success: true,
    });
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm:', error);
    res.status(500).json({
      message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng',
      items: [],
      subtotal: '0.00',
      count: 0,
      success: false,
    });
  }
});

export default router;