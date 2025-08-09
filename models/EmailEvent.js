import mongoose from "mongoose";

const emailEventSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    event: { type: String, required: true }, 
    sg_message_id: { type: String, required: true },
    sg_event_id: { type: String },
    timestamp: { type: Date, required: true },
    day: { type: String },
  },
  { timestamps: true }
);

// Unique index for upserting
emailEventSchema.index({ email: 1, sg_message_id: 1 }, { unique: true });

export default mongoose.model("EmailEvent", emailEventSchema);
