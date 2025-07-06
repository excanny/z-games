import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

const UserModel = mongoose.model('User', UserSchema);

export default UserModel;
