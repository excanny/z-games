class AuthController {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async register(req, res) {
    try {
      const user = await this.userRepository.createUser(req.body);
      return res.status(201).json({
        status: "success",
        message: "User registered successfully",
        data: user,
      });
    } catch (error) {
      console.error("Registration Error:", error);

      const message = error.message.includes("exists")
        ? "Email is already in use. Please use a different email."
        : "An unexpected error occurred";

      const statusCode = error.message.includes("exists") ? 400 : 500;

      return res.status(statusCode).json({
        status: "error",
        message,
        data: null,
      });
    }
  }

  async login(req, res) {
    try {
      const { user, token } = await this.userRepository.login(req.body);
      return res.status(200).json({
        status: "success",
        message: "Login successful",
        data: { token, user },
      });
    } catch (error) {
      return res.status(401).json({
        status: "error",
        message: error.message || "Invalid email or password",
        data: null,
      });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await this.userRepository.getUserById(id);

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
          data: null,
        });
      }

      delete user.password; // Clean up sensitive info

      return res.status(200).json({
        status: "success",
        message: "User retrieved successfully",
        data: user,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "An unexpected error occurred",
        data: error.message || error,
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const { userId } = req; // Assume middleware sets req.userId after token verification

      const result = await this.userRepository.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      return res.status(200).json({
        status: "success",
        message: result.message,
        data: null,
      });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error.message || "Password change failed",
        data: null,
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, newPassword } = req.body;

      const result = await this.userRepository.resetPassword(email, newPassword);

      return res.status(200).json({
        status: "success",
        message: result.message,
        data: null,
      });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error.message || "Password reset failed",
        data: null,
      });
    }
  }
}

export default AuthController;
