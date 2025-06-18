import mongoose from "mongoose"

const testSchema = new mongoose.Schema({
  title: String,
  questions: [
    {
      question: String,
      options: [String],
      correctIndex: Number
    }
  ]
});

export default mongoose.model('Test', testSchema);