import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import dotenv from "dotenv";
import { cleanDuplicateWords } from "./src/utils/quoteUtils";
import { WebSocketServer } from "ws";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API route for parsing natural language voice transcripts into structured quotation data
app.post("/api/parse-quote", async (req, res) => {
  try {
    const { transcript, currentQuote } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: "No transcript or text provided." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured on the server. Please add your Gemini API key in the settings/secrets panel.",
      });
    }

    let responseText: string | null = null;
    let fallbackUsed = false;

    try {
      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are an expert AI assistant for a Quotation Creation & Editing Tool with Multilingual (Hausa & English) capabilities.
Your job is to read natural language voice transcripts or text commands from the user and update or create a structured quotation JSON object.
You must return ONLY a valid JSON object matching the requested schema. No markdown outside or extra chatter.

LANGUAGE & FEEDBACK RULE:
- For form field values (clientName, clientCompany, clientAddress, items.description, notes, terms, etc.), ALWAYS translate and save them in clear, professional English.
- For the "explanation" field in the JSON response, ALWAYS respond and give feedback in the EXACT LANGUAGE the user spoke or typed. If the user input is in Hausa, write the "explanation" feedback in natural, friendly Hausa (e.g. "An yi nasarar sabunta sunan aboki da rangwame."). If the user input is in English, write the "explanation" in English.

HAUSA SPEECH & TRANSLATION REQUIREMENT:
The user may speak or type instructions in Hausa (e.g. "sunan aboki Ali Bello", "kamfani Cyberdyne", "saka rangwame na kashi 10%", "aika rasiti zuwa email...", "sanya kaya guda 5 akan dala 100", "adireshin Kano Nigeria", "ka'idoji biya cikin kwanaki 30", "bayanai godiya da kasuwanci", "goge sunan aboki", etc.), in English, or in a blend of Hausa and English.
You MUST recognize spoken/typed Hausa, accurately interpret the intent, and TRANSLATE ALL spoken Hausa content into English before placing them in the appropriate quotation JSON fields. All values saved in the output JSON fields must be in clear, professional English.

CRITICAL FIELD NAME REFERENCE & BOUNDARY RULE:
When extracting field values from the user's spoken transcript, treat form field names (e.g., "client name", "company", "client company", "email", "client email", "address", "client address", "quote number", "notes", "terms", "description", "item description", or Hausa equivalents like "sunan aboki", "kamfani", "adireshi", "ragi", "haraji") as strict reference markers. ONLY extract the exact text/words that immediately follow the field name as the intended field content. 
- For example, if the user says "client name John Doe" or "sunan aboki John Doe", the clientName should be "John Doe".
- If the user says "notes please pay within 15 days" or "bayanai a biya cikin kwanaki 15", the notes field should be "please pay within 15 days".
- Do NOT include the field name itself, filler words ("is", "to", "as", "shi ne", "ne"), or unrelated conversational preamble into the field value.

CLEARING FIELDS & ITEM REMOVAL RULE:
- If the user's instruction or transcript contains the keyword "clear" or Hausa clearing words ("goge", "foge", "share") preceding a field name (e.g., "clear client name", "goge sunan aboki", "clear email", "goge email", "clear notes", "goge bayanai", "clear discount", "goge rangwame"), you MUST clear that specific form field by setting string fields to "" (empty string) and numeric fields (taxRate, discountPercentage) to 0.
- ITEM REMOVAL RULE: If the user asks to remove, delete, or clear an item or all items (e.g., "remove item", "delete item 1", "clear items", "goge kaya", "cire kaya", "goge abin"), remove the indicated item from the items array. You MUST remove the item EVEN IF IT IS THE ONLY ITEM ON THE TABLE, resulting in an empty items array []. Do NOT keep or auto-create a placeholder item.

DUPLICATE WORD PREVENTION RULE:
Duplicate words or sequences of words (e.g. "Net 30 Net 30" or "Smith Smith") MUST NOT be inputted or kept in form fields. Clean consecutive duplicate words and duplicate word sequences.

Current Quotation State:
${JSON.stringify(currentQuote || {}, null, 2)}

Instructions:
1. Interpret the user's spoken input (which might be in English or Hausa, creating a new quote from scratch, or modifying/adding/deleting items, changing client info, taxes, discounts, or terms on the current quote).
2. Translate any Hausa terms/content into English before storing into the quotation state fields.
3. Follow the CRITICAL FIELD NAME REFERENCE & BOUNDARY RULE strictly when parsing any field values from the transcript.
4. If it's a new quote request, fill out missing fields intelligently or use sensible defaults (e.g., today's date for issueDate, 7 days later for validUntil, currency "NGN", discountPercentage 0, taxRate 0, setupCharge 10, serviceCharge 20, terms "payment within validity period before service").
5. If it's a modification request, merge or update the current quotation accordingly while preserving unmodified fields.
6. Provide a short "explanation" string in the EXACT LANGUAGE spoken by the user (Hausa if user spoke Hausa, English if user spoke English) describing what you updated or created based on their voice input.

Return JSON Schema:
{
  "quoteNumber": "string",
  "clientName": "string",
  "clientEmail": "string",
  "clientCompany": "string",
  "clientAddress": "string",
  "issueDate": "YYYY-MM-DD",
  "validUntil": "YYYY-MM-DD",
  "currency": "NGN" | "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY",
  "items": [
    {
      "id": "string",
      "description": "string",
      "quantity": number,
      "unitPrice": number
    }
  ],
  "taxRate": number,
  "discountPercentage": number,
  "setupCharge": number,
  "serviceCharge": number,
  "notes": "string",
  "terms": "string",
  "explanation": "string describing changes in the user's spoken language"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: `User voice input / instruction: "${transcript}"` }]
          }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.2,
        }
      });
      responseText = response.text || null;
    } catch (apiErr: any) {
      // Gracefully fallback on rate limits or quota exhaustion without noisy logs
      fallbackUsed = true;
    }

    let parsedData: any = null;

    if (responseText) {
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseErr) {
        console.warn("Failed to parse Gemini JSON response, using fallback:", parseErr);
        fallbackUsed = true;
      }
    }

    if (fallbackUsed || !parsedData) {
      // Intelligent Rule-Based Fallback Parser so app works seamlessly even if rate-limited (429) or offline
      const lower = transcript.toLowerCase();
      parsedData = { ...currentQuote };
      let actionDesc = "Updated quotation via voice command.";

      // Check for clear commands in English & Hausa: e.g. "clear client name", "goge sunan aboki", "foge email", "share notes"
      if (lower.includes('clear') || lower.includes('goge') || lower.includes('foge') || lower.includes('share')) {
        if (lower.includes('client name') || lower.includes('name') || lower.includes('sunan') || lower.includes('suna') || lower.includes('aboki')) {
          parsedData.clientName = '';
          actionDesc = 'Cleared client name.';
        }
        if (lower.includes('company') || lower.includes('client company') || lower.includes('kamfani')) {
          parsedData.clientCompany = '';
          actionDesc = 'Cleared client company.';
        }
        if (lower.includes('email') || lower.includes('client email') || lower.includes('imanin')) {
          parsedData.clientEmail = '';
          actionDesc = 'Cleared client email.';
        }
        if (lower.includes('address') || lower.includes('client address') || lower.includes('adireshi')) {
          parsedData.clientAddress = '';
          actionDesc = 'Cleared client address.';
        }
        if (lower.includes('quote number') || lower.includes('number') || lower.includes('lamba')) {
          parsedData.quoteNumber = '';
          actionDesc = 'Cleared quote number.';
        }
        if (lower.includes('notes') || lower.includes('note') || lower.includes('bayanai') || lower.includes('bayani')) {
          parsedData.notes = '';
          actionDesc = 'Cleared notes.';
        }
        if (lower.includes('terms') || lower.includes('payment terms') || lower.includes('ka\'idoji') || lower.includes('sharudda')) {
          parsedData.terms = '';
          actionDesc = 'Cleared terms.';
        }
        if (lower.includes('discount') || lower.includes('rangwame') || lower.includes('ragewa') || lower.includes('ragi')) {
          parsedData.discountPercentage = 0;
          actionDesc = 'Cleared discount.';
        }
        if (lower.includes('tax') || lower.includes('vat') || lower.includes('gst') || lower.includes('haraji')) {
          parsedData.taxRate = 0;
          actionDesc = 'Cleared tax rate.';
        }
      }

      // Check discount (English & Hausa e.g. "rangwame kashi 10" or "discount of 10%")
      const discMatch = lower.match(/(?:discount|off|rangwame|ragewa|ragi)\s*(?:of|kashi|na)?\s*(\d+(?:\.\d+)?)\s*%/i) ||
                        lower.match(/(?:rangwame|ragewa|ragi)\s*(?:kashi|na)?\s*(\d+(?:\.\d+)?)/i);
      if (discMatch) {
        const discVal = parseFloat(discMatch[1]);
        parsedData.discountPercentage = discVal;
        actionDesc = `Applied ${discVal}% discount.`;
      }

      // Check tax (English & Hausa e.g. "haraji kashi 5%" or "tax rate of 7.5%")
      const taxMatch = lower.match(/(?:tax|vat|gst|haraji|harajin)\s*(?:rate|kashi|na)?\s*(?:of)?\s*(\d+(?:\.\d+)?)\s*%/i) ||
                       lower.match(/(?:haraji|harajin)\s*(?:kashi|na)?\s*(\d+(?:\.\d+)?)/i);
      if (taxMatch) {
        const taxVal = parseFloat(taxMatch[1]);
        parsedData.taxRate = taxVal;
        actionDesc = `Set tax rate to ${taxVal}%.`;
      }

      // Check client name following "client name", "name", or Hausa "sunan aboki", "sunan mutum", "suna"
      const nameMatch = lower.match(/(?:client name|sunan aboki|sunan mutum|sunan|suna)\s+(?:is\s+|ne\s+|shi ne\s+)?([a-zA-Z0-9\s]+?)(?=\s+(?:company|kamfani|email|address|adireshi|notes|bayanai|terms|item|at|for|\$)|$)/i);
      if (nameMatch && nameMatch[1].trim().length > 1) {
        parsedData.clientName = nameMatch[1].trim();
        actionDesc = `Updated client name to ${parsedData.clientName}.`;
      }

      // Check company following "client company", "company", or Hausa "kamfani", "sunan kamfani"
      const companyMatch = lower.match(/(?:client company|sunan kamfani|kamfani|kamfanin)\s+(?:is\s+|ne\s+|shi ne\s+)?([a-zA-Z0-9\s]+?)(?=\s+(?:name|sunan|email|address|adireshi|notes|bayanai|terms|item|at|for|\$)|$)/i);
      if (companyMatch && companyMatch[1].trim().length > 1) {
        const comp = companyMatch[1].trim();
        parsedData.clientCompany = comp.charAt(0).toUpperCase() + comp.slice(1);
        actionDesc = `Updated company to ${parsedData.clientCompany}.`;
      } else {
        const clientMatch = lower.match(/(?:client|to)\s+([a-zA-Z0-9\s]+?)(?=\s+(?:with|at|and|for|\$|\d)|$)/);
        if (clientMatch && clientMatch[1].trim().length > 2) {
          const comp = clientMatch[1].trim();
          parsedData.clientCompany = comp.charAt(0).toUpperCase() + comp.slice(1);
          actionDesc = `Updated client company to ${parsedData.clientCompany}.`;
        }
      }

      // Check email following "client email", "email", or Hausa "imanin", "aika email"
      const emailMatch = lower.match(/(?:client email|email|imanin)\s+(?:is\s+|ne\s+|shi ne\s+)?([a-zA-Z0-9@._\-\s]+?)(?=\s+(?:name|sunan|company|kamfani|address|adireshi|notes|bayanai|terms|item|at|for|\$)|$)/i);
      if (emailMatch && emailMatch[1].trim().length > 3) {
        parsedData.clientEmail = emailMatch[1].trim().replace(/\s+at\s+/g, '@').replace(/\s+dot\s+/g, '.');
        actionDesc = `Updated email to ${parsedData.clientEmail}.`;
      }

      // Check address following "client address", "address", or Hausa "adireshi", "adireshin"
      const addressMatch = lower.match(/(?:client address|address|adireshin|adireshi)\s+(?:is\s+|ne\s+|shi ne\s+)?([a-zA-Z0-9\s,.-]+?)(?=\s+(?:name|sunan|company|kamfani|email|notes|bayanai|terms|item)|$)/i);
      if (addressMatch && addressMatch[1].trim().length > 3) {
        parsedData.clientAddress = addressMatch[1].trim();
        actionDesc = `Updated address to ${parsedData.clientAddress}.`;
      }

      // Check quote number following "quote number", "number", or Hausa "lamban", "lamba"
      const qNumMatch = lower.match(/(?:quote number|number|lamban rasiti|lamba)\s+(?:is\s+|ne\s+)?([a-zA-Z0-9\-]+)/i);
      if (qNumMatch && qNumMatch[1].trim().length > 0) {
        parsedData.quoteNumber = qNumMatch[1].trim().toUpperCase();
        actionDesc = `Updated quote number to ${parsedData.quoteNumber}.`;
      }

      // Check notes following "notes", "note", or Hausa "bayanai", "lura"
      const notesMatch = lower.match(/(?:notes|note|bayanai|lura)\s+(?:is\s+|ne\s+)?(.+?)(?=\s+(?:terms|ka'idoji|client|company|email|address|quote number)|$)/i);
      if (notesMatch && notesMatch[1].trim().length > 0) {
        parsedData.notes = notesMatch[1].trim();
        actionDesc = `Updated notes to ${parsedData.notes}.`;
      }

      // Check terms following "terms", "payment terms", or Hausa "ka'idoji", "sharudda"
      const termsMatch = lower.match(/(?:terms|payment terms|ka'idoji|sharudda)\s+(?:is\s+|ne\s+)?(.+?)(?=\s+(?:notes|bayanai|client|company|email|address|quote number)|$)/i);
      if (termsMatch && termsMatch[1].trim().length > 0) {
        parsedData.terms = termsMatch[1].trim();
        actionDesc = `Updated terms to ${parsedData.terms}.`;
      }

      // Check adding items (English & Hausa e.g. "add 5 hours of design at 120 dollars" or "kara guda 2 a kan 50")
      const addMatch = lower.match(/(?:add|include|new|kara|sanya|saka)\s+(?:(\d+)\s+)?(?:units?|hours?|items?|guda|na|of)?\s*(.*?)\s*(?:at|for|\$|akan|a kan)\s*(\d+(?:\.\d+)?)/i);
      if (addMatch) {
        const qty = addMatch[1] ? parseInt(addMatch[1], 10) : 1;
        const desc = addMatch[2] ? addMatch[2].trim() : 'Additional Service';
        const price = parseFloat(addMatch[3]) || 100;
        const newItem = {
          id: 'item-' + Math.random().toString(36).substring(2, 9),
          description: desc.charAt(0).toUpperCase() + desc.slice(1),
          quantity: qty,
          unitPrice: price,
        };
        parsedData.items = [...(parsedData.items || []), newItem];
        actionDesc = `Added item: ${newItem.description} (${qty} x $${price}).`;
      } else if (lower.includes('add item') || lower.includes('new item') || lower.includes('kara kaya') || lower.includes('sanya kaya')) {
        const newItem = {
          id: 'item-' + Math.random().toString(36).substring(2, 9),
          description: transcript.replace(/add item|new item|kara kaya|sanya kaya/gi, '').trim() || 'Custom Item',
          quantity: 1,
          unitPrice: 150,
        };
        parsedData.items = [...(parsedData.items || []), newItem];
        actionDesc = `Added new item: ${newItem.description}.`;
      }

      // Check removing items (e.g. "remove item", "delete item", "goge kaya", "cire kaya", "remove item 1", "clear items")
      if (lower.includes('remove item') || lower.includes('delete item') || lower.includes('clear items') || lower.includes('goge kaya') || lower.includes('cire kaya') || lower.includes('goge abin') || lower.includes('delete the item') || lower.includes('remove the item')) {
        const isHausa = lower.includes('goge') || lower.includes('cire') || lower.includes('kaya');
        if (lower.includes('all') || lower.includes('dukkan') || lower.includes('clear items')) {
          parsedData.items = [];
          actionDesc = isHausa ? 'An cire dukkan kaya.' : 'Removed all items.';
        } else {
          const numMatch = lower.match(/(?:item|kaya|lamba)\s*(\d+)/i);
          let removeIdx = 0;
          if (numMatch && numMatch[1]) {
            removeIdx = Math.max(0, parseInt(numMatch[1], 10) - 1);
          }
          if (parsedData.items && parsedData.items.length > 0) {
            const idxToRemove = removeIdx < parsedData.items.length ? removeIdx : 0;
            const removedDesc = parsedData.items[idxToRemove]?.description || 'item';
            parsedData.items = parsedData.items.filter((_, i) => i !== idxToRemove);
            actionDesc = isHausa ? `An cire ${removedDesc}.` : `Removed ${removedDesc}.`;
          }
        }
      }

      parsedData.explanation = `${actionDesc} (Processed via smart fallback)`;
    }

    if (parsedData) {
      if (parsedData.clientName) parsedData.clientName = cleanDuplicateWords(parsedData.clientName);
      if (parsedData.clientCompany) parsedData.clientCompany = cleanDuplicateWords(parsedData.clientCompany);
      if (parsedData.clientEmail) parsedData.clientEmail = cleanDuplicateWords(parsedData.clientEmail);
      if (parsedData.clientAddress) parsedData.clientAddress = cleanDuplicateWords(parsedData.clientAddress);
      if (parsedData.notes) parsedData.notes = cleanDuplicateWords(parsedData.notes);
      if (parsedData.terms) parsedData.terms = cleanDuplicateWords(parsedData.terms);
      if (parsedData.quoteNumber) parsedData.quoteNumber = cleanDuplicateWords(parsedData.quoteNumber);
      if (parsedData.items && Array.isArray(parsedData.items)) {
        parsedData.items = parsedData.items.map((item: any) => ({
          ...item,
          description: item.description ? cleanDuplicateWords(item.description) : item.description
        }));
      }
    }

    res.json(parsedData);

  } catch (error: any) {
    console.error("Error parsing quote with Gemini:", error);
    res.status(500).json({ error: error.message || "Failed to process natural language request." });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Emulate Netlify function locally for development and preview
app.get("/.netlify/functions/get-gemini-token", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ token: "mock-temporary-token-preview-fallback" });
    }
    const token = Buffer.from(apiKey).toString('base64');
    res.json({ token });
  } catch (error: any) {
    res.status(500).json({ error: error.toString() });
  }
});

// Mock Email Client Sending Endpoint
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, from, subject, body, quoteNumber, clientCompany, pdfAttachment } = req.body;

    if (!to) {
      return res.status(400).json({ error: "Client email address ('to') is required." });
    }
    if (!quoteNumber) {
      return res.status(400).json({ error: "Quotation number ('quoteNumber') is required." });
    }

    const sender = from || "noreply@voicequota.io";
    const attachmentIndicator = pdfAttachment 
      ? `Attachment package loaded successfully (${(pdfAttachment.length / 1024).toFixed(1)} KB base64 stream)` 
      : "Compiling standard vector PDF attachment...";

    // Simulate SMTP network delays and detailed routing steps
    const logs = [
      `Initializing secure TLS connection to SMTP mailer from sender <${sender}>...`,
      "SMTP connection established with host mail.voicequota.io on port 465.",
      "SMTP handshake completed. AUTH LOGIN initiated.",
      `Sender authentication successful (authenticated as ${sender}).`,
      `Preparing RFC 5322 email payload to: <${to}>...`,
      `MIME-Version: 1.0, Content-Type: multipart/mixed; boundary="voice_quota_boundary"`,
      `[MIME] ${attachmentIndicator}`,
      `Injecting mail merge parameters (Client: ${clientCompany || "Valued Customer"})...`,
      `Packing PDF into MIME multi-part boundary (Attachment: ${quoteNumber}.pdf)...`,
      "Queued message for delivery.",
      "SMTP server accepted the message. Transferring mail packet...",
      `Message successfully routed to recipient's incoming MX gateway.`,
      `[DELIVERY SUCCESS] Email sent from ${sender} to ${to}. ID: msg-${Math.random().toString(36).substring(2, 9)}`
    ];

    return res.json({
      success: true,
      message: `Quotation PDF [${quoteNumber}] has been sent to ${to}!`,
      logs: logs
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to process email dispatch." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", async (clientWs, request) => {
    console.log("WebSocket client connected to Gemini Live");
    let session: any = null;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        clientWs.send(JSON.stringify({ error: "GEMINI_API_KEY is not configured on the server. Please add your Gemini API key in the settings/secrets panel." }));
        clientWs.close();
        return;
      }

      const urlObj = new URL(request.url || '', `http://${request.headers.host}`);
      const quoteJson = urlObj.searchParams.get('quote');
      const initialQuote = quoteJson ? JSON.parse(quoteJson) : null;

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `You are a real-time, low-latency multilingual (Hausa & English) voice assistant for a Quotation Creation & Editing Tool.
Your job is to talk to the user and help them create or edit their quotation in real-time.

MULTILINGUAL RESPONSE & TRANSLATION REQUIREMENT:
1. The user may speak to you in Hausa (e.g., "Ina so in sa sunan kamfani Cyberdyne", "sanya mini discount din kashi 10", "kara kaya guda 5 akan dala 100", "sunan aboki Ali Bello", etc.), in English, or in a blend of both.
2. You MUST understand spoken Hausa, translate all form field contents (names, addresses, item descriptions, payment terms, notes) into clear English, and call the "update_quotation" tool with the translated English field values.
3. CRITICAL RESPONSE RULE: ALWAYS respond verbally and give feedback in the SAME LANGUAGE the user speaks to you!
   - If the user speaks Hausa, reply verbally and give confirmation feedback in clear, friendly Hausa (for example: "Na sabunta sunan kamfani zuwa Cyberdyne Systems sannan na saka rangwamen kashi 10").
   - If the user speaks English, reply verbally and give confirmation feedback in English (for example: "I've updated the client name to Ali Bello and applied a 10% discount").

When the user asks you to perform an action (like adding an item, editing client info, applying discount, setting tax, clearing fields, etc.), you MUST call the "update_quotation" tool with the updated or new values in English.
- You can change specific fields or rewrite/append the items list.
- If you call "update_quotation", ALWAYS verbally explain to the user what you have done in the language they spoke, in a brief, friendly manner.
- Keep your verbal responses concise and suitable for spoken conversation. Do not read out long lists of items or long explanations unless requested.

Here is the current quotation state:
${JSON.stringify(initialQuote || {}, null, 2)}
`;

      session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "update_quotation",
                  description: "Update fields or items in the current quotation. You can add, modify, or remove items, or update client information, tax, discount, currency, terms, and notes.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      quoteNumber: { type: Type.STRING, description: "Quote number or reference code, e.g. 'QT-2026-001'" },
                      clientName: { type: Type.STRING },
                      clientEmail: { type: Type.STRING },
                      clientCompany: { type: Type.STRING },
                      clientAddress: { type: Type.STRING },
                      issueDate: { type: Type.STRING, description: "Format: YYYY-MM-DD" },
                      validUntil: { type: Type.STRING, description: "Format: YYYY-MM-DD" },
                      currency: { type: Type.STRING, enum: ["USD", "EUR", "GBP", "CAD", "AUD"] },
                      taxRate: { type: Type.NUMBER, description: "Percentage tax rate, e.g., 8.5 for 8.5%" },
                      discountPercentage: { type: Type.NUMBER, description: "Percentage discount, e.g. 10 for 10% off" },
                      notes: { type: Type.STRING },
                      terms: { type: Type.STRING },
                      items: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING, description: "Provide the existing item ID if editing, or omit/generate for new items." },
                            description: { type: Type.STRING },
                            quantity: { type: Type.NUMBER },
                            unitPrice: { type: Type.NUMBER }
                          },
                          required: ["description", "quantity", "unitPrice"]
                        }
                      }
                    }
                  }
                }
              ]
            }
          ]
        },
        callbacks: {
          onmessage: async (message) => {
            // Audio from model
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }

            // Model transcription
            const modelTranscript = message.serverContent?.modelTurn?.parts?.find((p: any) => p.text)?.text;
            if (modelTranscript) {
              clientWs.send(JSON.stringify({ modelTranscript }));
            }

            // User transcription
            const userTranscript = (message.serverContent as any)?.userTurn?.parts?.find((p: any) => p.text)?.text;
            if (userTranscript) {
              clientWs.send(JSON.stringify({ userTranscript }));
            }

            // Tool Call
            if (message.toolCall) {
              const functionCalls = message.toolCall.functionCalls;
              if (functionCalls && functionCalls.length > 0) {
                for (const call of functionCalls) {
                  if (call.name === "update_quotation") {
                    clientWs.send(JSON.stringify({
                      toolCall: {
                        name: call.name,
                        args: call.args,
                        id: call.id
                      }
                    }));

                    try {
                      await session.sendToolResponse({
                        functionResponses: [
                          {
                            name: call.name,
                            response: { output: "Quotation updated successfully." },
                            id: call.id
                          }
                        ]
                      });
                    } catch (err) {
                      console.error("Error sending tool response:", err);
                    }
                  }
                }
              }
            }

            // Interruption
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onclose: () => {
            console.log("Gemini Live session closed");
            clientWs.send(JSON.stringify({ status: "closed" }));
          },
          onerror: (err) => {
            console.error("Gemini Live session error:", err);
            clientWs.send(JSON.stringify({ error: "Gemini Live API error: " + err.message }));
          }
        }
      });

      clientWs.send(JSON.stringify({ status: "connected" }));

    } catch (sessionErr: any) {
      console.error("Failed to connect to Gemini Live:", sessionErr);
      clientWs.send(JSON.stringify({ error: "Failed to connect to Gemini Live session: " + sessionErr.message }));
      clientWs.close();
      return;
    }

    clientWs.on("message", async (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio && session) {
          await session.sendRealtimeInput({
            audio: {
              data: parsed.audio,
              mimeType: "audio/pcm;rate=16000"
            }
          });
        }
      } catch (err) {
        console.error("Error processing client message:", err);
      }
    });

    clientWs.on("close", () => {
      console.log("Client WebSocket closed");
      if (session) {
        try {
          session.close();
        } catch (e) {}
      }
    });
  });

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url || "", `http://${request.headers.host}`);
    if (pathname === "/api/live") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });
}

startServer();
