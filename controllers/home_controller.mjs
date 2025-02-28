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
      const { name, email, password, confirmpasword, age } = req.body;

      // Kiểm tra xem email đã tồn tại chưa
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).send("Email đã được sử dụng.");
      }

      // Tạo người dùng mới
      const newUser = new User({
        name,
        email,
        password,
        confirmpasword,
        age,
      });

      await newUser.save();

      // Chuyển hướng đến trang đăng nhập sau khi đăng ký thành công
      res.redirect("/login");
    } catch (error) {
      console.error(error);
      res.status(500).send("Lỗi trong quá trình đăng ký. Vui lòng thử lại.");
    }
  }
  static async createLogin(req, res) {
    let { email, password } = req.body;

    let user = await User.findOne({ email });
    console.log(user);

    if (user) {
      let checkpass = user.password == password;
      if (checkpass) {
        req.session.user = user;

        res.redirect("/");
      } else {
        res.render("login", { title: "Home Page" });
      }
    } else {
      res.render("login", { title: "Home Page" });
    }
  }
  
}

export default HomeController;
