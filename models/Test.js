import mongoose from "mongoose"

const testSchema = new mongoose.Schema({
  title: String,
  questions: [
    {
      question: String,
      options: [String],
      correctIndex: Number
    }
  ], materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    default: null
  }
  
});

export default mongoose.model('Test', testSchema);