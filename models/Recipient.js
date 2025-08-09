import mongoose from "mongoose";

const recipientSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
  },
  { timestamps: true }
);

export default mongoose.model("Recipient", recipientSchema);
