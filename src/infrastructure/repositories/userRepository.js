import UserModel from '../models/User.js';

class UserRepository {
  async createUser(userData) {
    const user = new UserModel(userData);
    return await user.save();
  }

  async getUserByEmail(email) {
    return await UserModel.findOne({ email });
  }

  async getUserById(id) {
    return await UserModel.findById(id);
  }
}

export default UserRepository;
