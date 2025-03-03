  import User from "../models/user.mjs";

  class HomeController {
    static index(req, res) {
      console.log(req.query);
      res.render("index", { title: "Home Page" });
    }
    static login(req, res) {
      res.render("login", { title: "Home Page" });
    }
    static signup(req, res) {
      res.render("signup", { title: "Home Page" });
    }
    static async createSignup(req, res) {
      try {
        const { name, email, password, confirmpassword, age } = req.body;
    
        // Kiểm tra xem email đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ success: false, message: "Email đã được sử dụng." });
        }
    
        // Tạo người dùng mới
        const newUser = new User({ name, email, password, confirmpassword, age });
        await newUser.save();
    
        res.status(201).json({ success: true, message: "Đăng ký thành công." });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi trong quá trình đăng ký." });
      }
    }
    
    static async createLogin(req, res) {
      try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
    
        if (!user || user.password !== password) {
          return res.status(401).json({ success: false, message: "Sai email hoặc mật khẩu." });
        }
    
        req.session.user = user; // Nếu muốn giữ phiên đăng nhập (tuỳ chọn)
    
        res.json({ success: true, message: "Đăng nhập thành công.", user });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi trong quá trình đăng nhập." });
      }
    }
    
    
  }

  export default HomeController;