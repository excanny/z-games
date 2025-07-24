import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class AuthUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  registerUser = async ({ name, email, password }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return await this.userRepository.createUser({ name, email, password: hashedPassword });
  };

  login = async ({ email, password }) => {
    const user = await this.userRepository.getUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return { user, token };
  };

  getUserById = async (id) => {
    return await this.userRepository.getUserById(id);
  };
}

export default AuthUseCase;
