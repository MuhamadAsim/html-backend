import express from "express";
import EmailEvent from "../models/EmailEvent.js";

const router = express.Router();

router.post("/events", async (req, res) => {
  try {
    const events = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ message: "Expected an array of events" });
    }

    let updatedCount = 0;

    for (const event of events) {
      const { email, event: eventType, timestamp, sg_event_id, sg_message_id } = event;

      if (!email || !eventType || !timestamp || !sg_message_id) continue;

      const day = new Date(timestamp * 1000).toISOString().slice(0, 10);

      await EmailEvent.findOneAndUpdate(
        { email, sg_message_id },
        {
          email,
          event: eventType,
          timestamp: new Date(timestamp * 1000),
          sg_event_id,
          sg_message_id,
          day,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      updatedCount++;
    }

    res.status(200).json({ message: "Events processed", updated: updatedCount });
  } catch (error) {
    console.error("Error processing SendGrid events:", error);
    res.status(500).json({ message: "Failed to process events" });
  }
});

export default router;
