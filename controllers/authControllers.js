const authService = require("../services/auth.service");

exports.signup = async (req, res) => {
  try {
    const data = await authService.signup(req.body);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};