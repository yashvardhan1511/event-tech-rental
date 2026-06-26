const db = require('../config/db');
const https = require('https');

/**
 * Helper to call Gemini API for recommendations.
 */
const callGeminiAPI = async (apiKey, type, attendees, venueSize, budget, durationDays, eventName, specialRequirements, inventory) => {
  const prompt = `You are an AI recommendations assistant for an Event Tech Rental company.
We need to generate equipment recommendations for three bundles: "Essential", "Professional", and "Deluxe" for the following event details:
- Event Name: ${eventName || 'Not specified'}
- Event Type: ${type}
- Attendees: ${attendees}
- Venue Size: ${venueSize}
- Equipment Budget (INR): ${budget ? '₹' + budget : 'Not specified'}
- Duration of event: ${durationDays} days
- Special instructions or requirements: ${specialRequirements || 'None'}

We have the following active inventory items available in our warehouse (note the available quantities and daily rental rates in INR):
${inventory.map(item => `- ID: ${item.id}, Name: "${item.name}", Category: "${item.category}", Daily Rate: ₹${item.daily_rate}, Available Qty: ${item.available_quantity}, Description: "${item.description}"`).join('\n')}

Based on the event characteristics and special instructions, select equipment from the list above. Ensure you only suggest items from the inventory list with positive available quantity. Clamp quantities to the available limits. Do not suggest products not in the inventory.
The three bundles are defined as:
1. "essential": A bare minimum setup for the event. Highly cost-conscious.
2. "professional": A standard high-quality setup that fits most requirements of this size.
3. "deluxe": A premium setup with extra features, higher quantities, or high-end models.

Respond strictly in JSON format. The response must be a single JSON object with the following structure:
{
  "essential": [
    { "id": <equipment_id>, "quantity": <quantity> }
  ],
  "professional": [
    { "id": <equipment_id>, "quantity": <quantity> }
  ],
  "deluxe": [
    { "id": <equipment_id>, "quantity": <quantity> }
  ]
}

Only return the JSON. No explanations, no markdown formatting (do not wrap in \`\`\`json).`;

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(body);
            if (!json.candidates || !json.candidates[0] || !json.candidates[0].content || !json.candidates[0].content.parts || !json.candidates[0].content.parts[0]) {
              reject(new Error('Invalid response structure from Gemini API'));
              return;
            }
            let textResponse = json.candidates[0].content.parts[0].text.trim();
            if (textResponse.startsWith('```')) {
              textResponse = textResponse.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
            }
            const parsed = JSON.parse(textResponse);
            resolve(parsed);
          } catch (e) {
            reject(new Error('Failed to parse Gemini response: ' + e.message));
          }
        } else {
          reject(new Error(`Gemini API returned status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(data);
    req.end();
  });
};

/**
 * Helper to structure and validate Gemini recommendations against database limits.
 */
const formatGeminiBundle = (itemsList, tierName, discountRate, durationDays, inventory, budget) => {
  const items = [];
  let subtotal = 0;

  if (Array.isArray(itemsList)) {
    itemsList.forEach(recItem => {
      const dbItem = inventory.find(inv => inv.id === parseInt(recItem.id));
      if (dbItem && dbItem.available_quantity > 0) {
        const qty = Math.min(parseInt(recItem.quantity) || 1, dbItem.available_quantity);
        if (qty > 0) {
          const lineCost = dbItem.daily_rate * qty * durationDays;
          subtotal += lineCost;
          items.push({
            equipment_id: dbItem.id,
            name: dbItem.name,
            category: dbItem.category,
            quantity: qty,
            daily_rate: dbItem.daily_rate,
            total_price: lineCost
          });
        }
      }
    });
  }

  const discountAmount = subtotal * discountRate;
  const total = subtotal - discountAmount;
  const fitsBudget = budget ? total <= parseFloat(budget) : true;

  return {
    name: tierName,
    discountRate,
    items,
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discountAmount.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    durationDays,
    fitsBudget
  };
};

/**
 * Generates optimized equipment bundles based on event constraints.
 */
const generateRecommendations = async (type, attendees, venueSize, budget, startDate, endDate, eventName, specialRequirements) => {
  // 1. Fetch available equipment for the date range
  const query = `
    SELECT e.*,
      CAST(GREATEST(0, e.total_quantity - COALESCE(
        (SELECT SUM(be.quantity)
         FROM booking_equipment be
         JOIN bookings b ON be.booking_id = b.id
         JOIN events ev ON b.event_id = ev.id
         WHERE be.equipment_id = e.id
           AND b.status IN ('confirmed', 'in_progress', 'pending')
           AND NOT (ev.end_date < ? OR ev.start_date > ?)
        ), 0)
      ) AS SIGNED) AS available_quantity
    FROM equipment e
    WHERE e.status = 'active'
  `;
  const [equipmentList] = await db.query(query, [endDate, startDate]);
  
  // Parse specifications
  const inventory = equipmentList.map(item => ({
    ...item,
    daily_rate: parseFloat(item.daily_rate),
    available_quantity: parseInt(item.available_quantity || '0'),
    specifications: typeof item.specifications === 'string' ? JSON.parse(item.specifications) : item.specifications
  }));

  // Helper to find items by keyword in category or name
  const findItems = (category, keyword = '') => {
    return inventory.filter(item => 
      item.category.toLowerCase() === category.toLowerCase() &&
      (keyword === '' || item.name.toLowerCase().includes(keyword.toLowerCase()))
    );
  };

  // Duration in days (minimum 1 day)
  const d1 = new Date(startDate);
  const d2 = new Date(endDate);
  const durationDays = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);

  // Use Gemini API if key is present
  if (process.env.GEMINI_API_KEY) {
    try {
      const geminiRecs = await callGeminiAPI(process.env.GEMINI_API_KEY, type, attendees, venueSize, budget, durationDays, eventName, specialRequirements, inventory);
      if (geminiRecs && (geminiRecs.essential || geminiRecs.professional || geminiRecs.deluxe)) {
        const essential = formatGeminiBundle(geminiRecs.essential, 'Essential', 0.0, durationDays, inventory, budget);
        const professional = formatGeminiBundle(geminiRecs.professional, 'Professional', 0.05, durationDays, inventory, budget);
        const deluxe = formatGeminiBundle(geminiRecs.deluxe, 'Deluxe', 0.10, durationDays, inventory, budget);
        
        return {
          event: { type, attendees, venueSize, budget, startDate, endDate, durationDays, eventName, specialRequirements },
          bundles: {
            essential,
            professional,
            deluxe
          }
        };
      }
    } catch (err) {
      console.error('Failed to generate recommendations via Gemini, falling back to heuristics:', err.message);
    }
  }

  // Define requirements mapping based on event type
  const eventType = type.toLowerCase();
  
  // Tiers calculation logic
  const createBundle = (tierName, discountRate) => {
    const items = [];
    
    // Core requirements based on event type
    if (eventType === 'conference' || eventType === 'corporate') {
      // Audio
      const speakers = findItems('Audio', 'speaker') || findItems('Audio');
      const mics = findItems('Audio', 'micro') || findItems('Audio', 'mic');
      const mixers = findItems('Audio', 'mixer');
      
      // Video
      const displays = findItems('Video', 'projector') || findItems('Video', 'led') || findItems('Video', 'tv') || findItems('Video');
      
      // Computing
      const laptops = findItems('Computing', 'laptop') || findItems('Computing');

      // TIER QUANTITIES
      let speakerQty = attendees < 80 ? 2 : (attendees < 250 ? 4 : 8);
      let micQty = attendees < 80 ? 2 : (attendees < 250 ? 4 : 6);
      let laptopQty = tierName === 'Essential' ? 1 : (tierName === 'Professional' ? 2 : 3);
      let displayQty = attendees < 250 ? 1 : 2;

      // Tier adjustments
      if (tierName === 'Essential') {
        speakerQty = Math.max(1, Math.round(speakerQty * 0.5));
        micQty = Math.max(1, Math.round(micQty * 0.5));
      } else if (tierName === 'Deluxe') {
        speakerQty = speakerQty + 2;
        micQty = micQty + 2;
      }

      // Add Speakers
      if (speakers.length > 0) {
        const item = speakers[0];
        const qty = Math.min(speakerQty, item.available_quantity);
        if (qty > 0) items.push({ ...item, quantity: qty });
      }
      // Add Mics
      if (mics.length > 0) {
        const item = mics[0];
        const qty = Math.min(micQty, item.available_quantity);
        if (qty > 0) items.push({ ...item, quantity: qty });
      }
      // Add Mixer
      if (mixers.length > 0 && tierName !== 'Essential') {
        const item = mixers[0];
        const qty = Math.min(1, item.available_quantity);
        if (qty > 0) items.push({ ...item, quantity: qty });
      }
      // Add Displays
      if (displays.length > 0) {
        // For Deluxe, try to get LED Wall panels if available
        const ledWall = findItems('Video', 'led wall');
        if (tierName === 'Deluxe' && ledWall.length > 0 && attendees >= 150) {
          const qty = Math.min(15, ledWall[0].available_quantity);
          if (qty > 0) items.push({ ...ledWall[0], quantity: qty });
        } else {
          const item = displays[0];
          const qty = Math.min(displayQty, item.available_quantity);
          if (qty > 0) items.push({ ...item, quantity: qty });
        }
      }
      // Add Laptops
      if (laptops.length > 0) {
        const item = laptops[0];
        const qty = Math.min(laptopQty, item.available_quantity);
        if (qty > 0) items.push({ ...item, quantity: qty });
      }

    } else if (eventType === 'concert' || eventType === 'wedding') {
      // Audio
      const speakers = findItems('Audio', 'subwoofer') || findItems('Audio', 'speaker') || findItems('Audio');
      const lines = findItems('Audio', 'line array') || findItems('Audio', 'speaker');
      const mics = findItems('Audio', 'micro') || findItems('Audio', 'mic');
      const mixers = findItems('Audio', 'mixer');
      
      // Lighting
      const lightCans = findItems('Lighting', 'par') || findItems('Lighting');
      const movingHeads = findItems('Lighting', 'moving') || findItems('Lighting');
      
      // Stage
      const stages = findItems('Stage') || findItems('Stage', 'deck') || findItems('Stage', 'truss');

      let speakerQty = attendees < 100 ? 2 : (attendees < 300 ? 4 : 8);
      let micQty = attendees < 100 ? 2 : (attendees < 300 ? 4 : 8);
      let lightQty = attendees < 100 ? 4 : (attendees < 300 ? 8 : 16);
      let stageQty = attendees < 150 ? 2 : 6;

      if (tierName === 'Essential') {
        speakerQty = Math.max(2, Math.round(speakerQty * 0.5));
        lightQty = Math.max(2, Math.round(lightQty * 0.5));
        stageQty = Math.max(1, Math.round(stageQty * 0.5));
      } else if (tierName === 'Deluxe') {
        speakerQty = speakerQty + 4;
        lightQty = lightQty + 8;
        stageQty = stageQty + 4;
      }

      // Add Line array / main speakers
      if (attendees >= 200 && lines.length > 0) {
        const item = lines[0];
        const qty = Math.min(speakerQty, item.available_quantity);
        if (qty > 0) items.push({ ...item, quantity: qty });
      } else if (speakers.length > 0) {
        const item = speakers[0];
        const qty = Math.min(speakerQty, item.available_quantity);
        if (qty > 0) items.push({ ...item, quantity: qty });
      }
      
      // Add Subwoofers for concert/wedding standard & deluxe
      if (tierName !== 'Essential') {
        const subs = findItems('Audio', 'subwoofer');
        if (subs.length > 0) {
          const qty = Math.min(2, subs[0].available_quantity);
          if (qty > 0) items.push({ ...subs[0], quantity: qty });
        }
      }

      // Add Mics
      if (mics.length > 0) {
        const item = mics[0];
        const qty = Math.min(micQty, item.available_quantity);
        if (qty > 0) items.push({ ...item, quantity: qty });
      }
      // Add Mixer
      if (mixers.length > 0) {
        const item = mixers[0];
        const qty = Math.min(1, item.available_quantity);
        if (qty > 0) items.push({ ...item, quantity: qty });
      }
      // Add Par Lights
      if (lightCans.length > 0) {
        const item = lightCans[0];
        const qty = Math.min(lightQty, item.available_quantity);
        if (qty > 0) items.push({ ...item, quantity: qty });
      }
      // Add Moving Heads for standard / deluxe
      if (tierName !== 'Essential' && movingHeads.length > 0) {
        const item = movingHeads[0];
        const qty = Math.min(4, item.available_quantity);
        if (qty > 0) items.push({ ...item, quantity: qty });
      }
      // Add Stages
      if (stages.length > 0) {
        const item = stages[0];
        const qty = Math.min(stageQty, item.available_quantity);
        if (qty > 0) items.push({ ...item, quantity: qty });
      }

    } else {
      // Default / Exhibition Event Type
      const displays = findItems('Video', 'tv') || findItems('Video', 'display') || findItems('Video');
      const ipads = findItems('Computing', 'ipad') || findItems('Computing', 'tablet') || findItems('Computing');
      const lights = findItems('Lighting', 'spot') || findItems('Lighting');
      const speakers = findItems('Audio', 'speaker') || findItems('Audio');

      let displayQty = attendees < 100 ? 1 : 3;
      let ipadQty = attendees < 100 ? 2 : 6;
      let lightQty = attendees < 100 ? 2 : 6;

      if (tierName === 'Essential') {
        displayQty = 1;
        ipadQty = Math.max(1, Math.round(ipadQty * 0.5));
      } else if (tierName === 'Deluxe') {
        displayQty += 1;
        ipadQty += 4;
        lightQty += 4;
      }

      if (displays.length > 0) {
        const item = displays[0];
        const qty = Math.min(displayQty, item.available_quantity);
        if (qty > 0) items.push({ ...item, quantity: qty });
      }
      if (ipads.length > 0) {
        const item = ipads[0];
        const qty = Math.min(ipadQty, item.available_quantity);
        if (qty > 0) items.push({ ...item, quantity: qty });
      }
      if (lights.length > 0) {
        const item = lights[0];
        const qty = Math.min(lightQty, item.available_quantity);
        if (qty > 0) items.push({ ...item, quantity: qty });
      }
      if (speakers.length > 0 && tierName !== 'Essential') {
        const item = speakers[0];
        const qty = Math.min(1, item.available_quantity);
        if (qty > 0) items.push({ ...item, quantity: qty });
      }
    }

    // If venue is Outdoor, add generators/heavy-duty items if they exist, or scale quantities
    if (venueSize.toLowerCase() === 'outdoor') {
      // Scale audio by 1.5x if available
      items.forEach(item => {
        if (item.category === 'Audio') {
          const originalQty = item.quantity;
          const searchOriginal = inventory.find(inv => inv.id === item.id);
          const maxAvail = searchOriginal ? searchOriginal.available_quantity : item.quantity;
          item.quantity = Math.min(Math.round(originalQty * 1.5), maxAvail);
        }
      });
    }

    // Calculate subtotal, discount, and total
    let subtotal = 0;
    const itemsDetails = items.map(item => {
      const lineCost = item.daily_rate * item.quantity * durationDays;
      subtotal += lineCost;
      return {
        equipment_id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        daily_rate: item.daily_rate,
        total_price: lineCost
      };
    });

    const discountAmount = subtotal * discountRate;
    const total = subtotal - discountAmount;
    
    // Fit check
    const fitsBudget = budget ? total <= parseFloat(budget) : true;

    return {
      name: tierName,
      discountRate,
      items: itemsDetails,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(discountAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      durationDays,
      fitsBudget
    };
  };

  // Generate three bundles: Essential (0% discount), Professional (5% discount), Deluxe (10% discount)
  const essential = createBundle('Essential', 0.0);
  const professional = createBundle('Professional', 0.05);
  const deluxe = createBundle('Deluxe', 0.10);

  return {
    event: { type, attendees, venueSize, budget, startDate, endDate, durationDays },
    bundles: {
      essential,
      professional,
      deluxe
    }
  };
};

module.exports = {
  generateRecommendations
};
