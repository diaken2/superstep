import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  position: { type: String },
  role: { type: String},
  rating: { type: Number, default: 0 },
  testResults: [
    {
      testId: String,
      score: Number,
      date: Date,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);