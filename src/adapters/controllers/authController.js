class AuthController {
    constructor(authUseCase) {
        this.authUseCase = authUseCase;
    }

    async register(req, res) {
      try {
          const user = await this.authUseCase.registerUser(req.body);
          return res.status(201).json({
              status: "success",
              message: "User registered successfully",
              data: user,
          });
      } catch (error) {
          console.error("Registration Error:", error); // Log the error for debugging
  
          if (error.code === 11000) {
              return res.status(400).json({
                  status: "error",
                  message: "Email is already in use. Please use a different email.",
                  data: null,
              });
          }
          return res.status(500).json({
              status: "error",
              message: "An unexpected error occurred",
              data: error.message || error, // Ensure error details are sent in response
          });
      }
  }
  
      
    async login(req, res) {
        try {
          const { user, token } = await this.authUseCase.login(req.body);
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
            const user = await this.authUseCase.getUserById(id);

            if (!user) {
                return res.status(404).json({
                    status: "error",
                    message: "User not found",
                    data: null,
                });
            }

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
}

module.exports = AuthController;
