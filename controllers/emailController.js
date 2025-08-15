import Recipient from "../models/Recipient.js";
import EmailEvent from "../models/EmailEvent.js";
import sgMail from "@sendgrid/mail";
import juice from 'juice';




export const uploadRecipients = async (req, res) => {
  try {
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: "No emails provided" });
    }

    // Validate emails
    const validEmails = emails.filter(email =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );

    if (validEmails.length === 0) {
      return res.status(400).json({ message: "No valid email addresses" });
    }

    // Remove duplicates
    const uniqueEmails = [...new Set(validEmails)];

    // 🧹 Delete all previous recipients
    await Recipient.deleteMany({});

    // Insert new recipients
    const newRecipients = uniqueEmails.map(email => ({ email }));
    await Recipient.insertMany(newRecipients);

    res.status(201).json({
      message: `Replaced all recipients with ${newRecipients.length} new ones`,
      count: newRecipients.length,
    });

  } catch (error) {
    console.error("Error uploading recipients:", error);
    res.status(500).json({ message: "Server error" });
  }
};








export const getRecipientCount = async (req, res) => {
  try {
    const count = await Recipient.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};




export const getRecipients = async (req, res) => {
  try {
    const recipients = await Recipient.find({ uploadedBy: req.user._id });
    res.json(recipients);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};












export const sendEmailCampaign = async (req, res) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  function preserveSpaces(html) {
  if (!html) return html;
  const withNbsp = html.replace(/ {2,}/g, spaces => spaces.split('').map(() => '&nbsp;').join(''));
  return `<div style="white-space: pre-wrap;">${withNbsp}</div>`;
}

  try {
    let { subject, html } = req.body;

    if (!html || typeof html !== 'string') {
      return res.status(400).json({ message: 'No email content provided' });
    }

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      subject = 'Advertisement';
    }

    // ✅ Preserve spaces before inline CSS
    const safeHtml = preserveSpaces(html);

    // Fetch all recipient emails
    const recipients = await Recipient.find().select('email');
    const emails = recipients.map(r => r.email);

    if (emails.length === 0) {
      return res.status(400).json({ message: 'No recipients found' });
    }

    // Convert CSS/classes to inline styles
    const htmlWithInlineStyles = juice(safeHtml);

    let sentCount = 0;
    for (const email of emails) {
      await sgMail.send({
        to: email,
        from: {
          email: process.env.FROM_EMAIL,
          name: 'Auditatlas',
        },
        subject,
        html: htmlWithInlineStyles,
      });
      sentCount++;
    }

    res.status(200).json({
      message: 'Emails sent successfully',
      recipients: sentCount,
    });
  } catch (error) {
    console.error('Error sending email campaign:', error.response?.body || error);
    res.status(500).json({ message: 'Failed to send emails' });
  }
};












export const getEmailReport = async (req, res) => {
  try {
    // Get date from query params (frontend sends 'date', but we can also accept 'day' for backward compatibility)
    const { date, day } = req.query;
    const selectedDate = date || day;


    // Build filter object
    const filter = {};

    if (selectedDate) {
      // If date is provided, filter by the day field (which stores date strings like "2025-08-08")
      filter.day = selectedDate;
    }


    // First, let's check what dates are actually in the database
    const allDates = await EmailEvent.distinct('day');

    // Find events based on filter
    const events = await EmailEvent.find(filter)
      .select("-__v")
      .sort({ timestamp: -1 }) // Sort by timestamp descending (newest first)
      .lean();


    // Also try finding without filter to see all data
    const allEvents = await EmailEvent.find({})
      .select("day timestamp")
      .limit(5)
      .lean();

    // Initialize counts object
    const counts = {
      total: events.length,
      delivered: 0,
      opened: 0, // Note: backend might send "open" but we'll count as "opened"
      bounced: 0,
      dropped: 0,
      deferred: 0,
      processed: 0,
    };

    // Count events by type
    for (const event of events) {
      const eventType = event.event;

      // Handle different event types
      switch (eventType) {
        case 'delivered':
          counts.delivered++;
          break;
        case 'open':
          counts.opened++; // Convert "open" to "opened" for consistency
          break;
        case 'bounce':
          counts.bounced++;
          break;
        case 'dropped':
          counts.dropped++;
          break;
        case 'deferred':
          counts.deferred++;
          break;
        case 'processed':
          counts.processed++;
          break;
        default:
          // Handle any other event types that might exist
          if (counts.hasOwnProperty(eventType)) {
            counts[eventType]++;
          }
          break;
      }
    }


    res.status(200).json({
      counts,
      events,
      date: selectedDate, // Return the date that was queried
      message: selectedDate ? `Reports for ${selectedDate}` : 'All reports',
      debug: {
        selectedDate,
        filter,
        allDatesInDb: allDates,
        totalEventsFound: events.length
      }
    });

  } catch (error) {
    console.error("Error fetching email report:", error);
    res.status(500).json({
      message: "Failed to fetch email report",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};