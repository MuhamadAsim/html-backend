import express from "express";
import protect from "../middleware/authMiddleware.js";
import { uploadRecipients, getRecipients,getRecipientCount,sendEmailCampaign,getEmailReport, sendSingleEmail
 } from "../controllers/emailController.js";

const router = express.Router();

router.post("/recipients", protect, uploadRecipients);
router.get("/recipients/count", protect, getRecipientCount);
router.get("/recipients", protect, getRecipients);
router.post("/send", protect, sendEmailCampaign); 
router.post("/send-single", protect, sendSingleEmail); 
router.get("/reports", protect, getEmailReport); 

export default router;
