import mongoose from "mongoose";
const materialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  pdfUrl:{type:String}
});
export default mongoose.model('Materials', materialSchema);
