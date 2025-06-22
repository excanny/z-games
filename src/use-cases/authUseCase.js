const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

class AuthUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async registerUser({ name, email, password }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        return await this.userRepository.createUser({ name, email, password: hashedPassword });
    }

    async login({ email, password }) {
        const user = await this.userRepository.getUserByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new Error("Invalid credentials");
        }
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        return { user, token };
    }

    async getUserById(id) {
        return await this.userRepository.getUserById(id);
    }
}

module.exports = AuthUseCase;
