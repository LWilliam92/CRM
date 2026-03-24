const router = require("express").Router();
const db = require("../config/db");

// AI Contact Analysis Endpoint
router.post("/analyze-contacts", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Get all contacts for analysis
    const contactsQuery = "SELECT * FROM contacts ORDER BY created_at DESC";
    db.query(contactsQuery, (err, contacts) => {
      if (err) {
        console.error("Error fetching contacts for AI analysis:", err);
        return res.status(500).json({ message: "Error fetching contacts" });
      }

      if (contacts.rows.length === 0) {
        return res.json({
          insights: null,
          recommendations: [],
          message: "No contacts available for analysis"
        });
      }

      // Perform AI analysis
      const analysis = performContactAnalysis(contacts.rows);
      
      res.json({
        insights: analysis.insights,
        recommendations: analysis.recommendations,
        analyzedAt: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error("AI analysis error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// AI Contact Scoring Endpoint
router.post("/score-contacts", async (req, res) => {
  try {
    const { contactIds } = req.body;
    
    if (!contactIds || !Array.isArray(contactIds)) {
      return res.status(400).json({ message: "Invalid contact IDs" });
    }

    const placeholders = contactIds.map((_, index) => `$${index + 1}`).join(',');
    const query = `SELECT * FROM contacts WHERE id IN (${placeholders})`;
    
    db.query(query, contactIds, (err, result) => {
      if (err) {
        console.error("Error fetching contacts for scoring:", err);
        return res.status(500).json({ message: "Error fetching contacts" });
      }

      const contacts = result.rows;

      if (contacts.length === 0) {
        return res.json({
          scoredContacts: [],
          message: "No contacts found for scoring"
        });
      }

      const scoredContacts = contacts.map(contact => ({
        ...contact,
        aiScore: calculateContactScore(contact),
        riskLevel: calculateRiskLevel(contact),
        potentialValue: calculatePotentialValue(contact)
      }));

      res.json({
        scoredContacts,
        analyzedAt: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error("Contact scoring error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// AI Prediction Endpoint
router.post("/predict-conversions", async (req, res) => {
  try {
    const query = "SELECT * FROM contacts WHERE category IN ('lead', 'prospect') ORDER BY created_at DESC";
    
    db.query(query, ['lead', 'prospect'], (err, contacts) => {
      if (err) {
        console.error("Error fetching contacts for prediction:", err);
        return res.status(500).json({ message: "Error fetching contacts" });
      }

      if (contacts.rows.length === 0) {
        return res.json({
          predictions: [],
          totalAnalyzed: 0,
          message: "No contacts available for prediction"
        });
      }

      const predictions = contacts.rows.map(contact => ({
        contactId: contact.id,
        contactName: contact.name,
        conversionProbability: calculateConversionProbability(contact),
        timeToConversion: estimateTimeToConversion(contact),
        recommendedAction: getRecommendedAction(contact)
      }));

      // Sort by conversion probability
      predictions.sort((a, b) => b.conversionProbability - a.conversionProbability);

      res.json({
        predictions: predictions.slice(0, 20), // Top 20 predictions
        totalAnalyzed: contacts.length,
        analyzedAt: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error("Conversion prediction error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Helper Functions
function performContactAnalysis(contacts) {
  const totalContacts = contacts.length;
  const categories = {};
  const recentContacts = contacts.filter(c => {
    const createdDate = new Date(c.created_at);
    const daysSinceCreation = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
    return daysSinceCreation <= 30;
  });

  // Analyze categories
  contacts.forEach(contact => {
    categories[contact.category] = (categories[contact.category] || 0) + 1;
  });

  // Generate insights
  const insights = {
    totalContacts,
    recentGrowth: recentContacts.length,
    growthRate: ((recentContacts.length / totalContacts) * 100).toFixed(1),
    topCategory: Object.keys(categories).reduce((a, b) => 
      categories[a] > categories[b] ? a : b
    ),
    categoryDistribution: categories,
    engagementScore: calculateEngagementScore(contacts),
    churnRisk: calculateChurnRisk(contacts),
    conversionPotential: calculateConversionPotential(contacts),
    averageContactAge: calculateAverageContactAge(contacts),
    highValueContacts: identifyHighValueContacts(contacts).length
  };

  // Generate recommendations
  const recommendations = generateRecommendations(insights, contacts);

  return { insights, recommendations };
}

function calculateEngagementScore(contacts) {
  const customerContacts = contacts.filter(c => c.category === 'customer').length;
  const leadContacts = contacts.filter(c => c.category === 'lead').length;
  const total = contacts.length;
  
  if (total === 0) return 0;
  const score = ((customerContacts * 100) + (leadContacts * 60)) / total;
  return Math.min(100, score).toFixed(1);
}

function calculateChurnRisk(contacts) {
  const oldContacts = contacts.filter(c => {
    const createdDate = new Date(c.created_at);
    const daysSinceCreation = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
    return daysSinceCreation > 90;
  });
  
  const riskScore = oldContacts.length > 0 ? 
    ((oldContacts.length / contacts.length) * 100).toFixed(1) : 0;
  return Math.min(100, riskScore);
}

function calculateConversionPotential(contacts) {
  const leads = contacts.filter(c => c.category === 'lead').length;
  const prospects = contacts.filter(c => c.category === 'prospect').length;
  const total = contacts.length;
  
  if (total === 0) return 0;
  const potential = ((leads * 70) + (prospects * 40)) / total;
  return Math.min(100, potential).toFixed(1);
}

function calculateAverageContactAge(contacts) {
  if (contacts.length === 0) return 0;
  
  const totalAge = contacts.reduce((sum, contact) => {
    const createdDate = new Date(contact.created_at);
    const daysSinceCreation = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
    return sum + daysSinceCreation;
  }, 0);
  
  return Math.round(totalAge / contacts.length);
}

function identifyHighValueContacts(contacts) {
  // Simulate high-value contact identification
  return contacts.filter(contact => {
    const daysSinceCreation = (new Date() - new Date(contact.created_at)) / (1000 * 60 * 60 * 24);
    return contact.category === 'customer' || 
           (contact.category === 'lead' && daysSinceCreation < 30);
  });
}

function generateRecommendations(insights, contacts) {
  const recommendations = [];

  // Growth recommendations
  if (parseFloat(insights.growthRate) < 10) {
    recommendations.push({
      type: "growth",
      priority: "high",
      title: "Low Contact Growth",
      description: "Contact growth rate is below 10%. Consider implementing lead generation campaigns.",
      action: "Review marketing strategies and lead acquisition channels",
      potentialImpact: "high"
    });
  }

  // Category recommendations
  if (insights.topCategory === 'lead' && insights.categoryDistribution.lead > insights.categoryDistribution.customer) {
    recommendations.push({
      type: "conversion",
      priority: "medium",
      title: "Lead Conversion Opportunity",
      description: `You have ${insights.categoryDistribution.lead} leads ready for conversion.`,
      action: "Focus on nurturing leads and conversion campaigns",
      potentialImpact: "medium"
    });
  }

  // Engagement recommendations
  if (parseFloat(insights.engagementScore) < 50) {
    recommendations.push({
      type: "engagement",
      priority: "high",
      title: "Low Engagement Score",
      description: "Contact engagement is below optimal levels.",
      action: "Implement personalized communication strategies",
      potentialImpact: "high"
    });
  }

  // Churn risk recommendations
  if (parseFloat(insights.churnRisk) > 30) {
    recommendations.push({
      type: "retention",
      priority: "high",
      title: "High Churn Risk Detected",
      description: "Significant portion of contacts may be at risk of disengagement.",
      action: "Launch re-engagement campaigns for inactive contacts",
      potentialImpact: "high"
    });
  }

  // Conversion potential recommendations
  if (parseFloat(insights.conversionPotential) > 70) {
    recommendations.push({
      type: "opportunity",
      priority: "medium",
      title: "High Conversion Potential",
      description: "Strong opportunity for converting leads to customers.",
      action: "Accelerate conversion-focused campaigns",
      potentialImpact: "medium"
    });
  }

  return recommendations;
}

function calculateContactScore(contact) {
  let score = 50; // Base score
  
  // Category scoring
  if (contact.category === 'customer') score += 30;
  else if (contact.category === 'lead') score += 20;
  else if (contact.category === 'prospect') score += 10;
  
  // Recency scoring
  const daysSinceCreation = (new Date() - new Date(contact.created_at)) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation < 30) score += 20;
  else if (daysSinceCreation < 90) score += 10;
  
  return Math.min(100, score);
}

function calculateRiskLevel(contact) {
  const daysSinceCreation = (new Date() - new Date(contact.created_at)) / (1000 * 60 * 60 * 24);
  
  if (contact.category === 'customer' && daysSinceCreation > 180) return 'high';
  if (daysSinceCreation > 90) return 'medium';
  return 'low';
}

function calculatePotentialValue(contact) {
  if (contact.category === 'customer') return 'high';
  if (contact.category === 'lead') return 'medium';
  return 'low';
}

function calculateConversionProbability(contact) {
  let probability = 0.3; // Base 30%
  
  if (contact.category === 'lead') probability += 0.4;
  if (contact.category === 'prospect') probability += 0.2;
  
  const daysSinceCreation = (new Date() - new Date(contact.created_at)) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation < 30) probability += 0.2;
  else if (daysSinceCreation < 90) probability += 0.1;
  
  return Math.min(0.95, probability);
}

function estimateTimeToConversion(contact) {
  const daysSinceCreation = (new Date() - new Date(contact.created_at)) / (1000 * 60 * 60 * 24);
  
  if (contact.category === 'lead') {
    if (daysSinceCreation < 30) return '7-14 days';
    if (daysSinceCreation < 90) return '14-30 days';
    return '30-60 days';
  }
  
  if (contact.category === 'prospect') {
    return '30-90 days';
  }
  
  return '90+ days';
}

function getRecommendedAction(contact) {
  if (contact.category === 'lead') {
    return 'Immediate follow-up with personalized offer';
  }
  
  if (contact.category === 'prospect') {
    return 'Nurture with educational content';
  }
  
  if (contact.category === 'customer') {
    return 'Upsell/cross-sell opportunities';
  }
  
  return 'General engagement campaign';
}

// AI Chat Assistant Endpoint
router.post("/chat", async (req, res) => {
  try {
    const { message, contacts } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Get contacts if not provided
    let contactData = contacts;
    if (!contactData) {
      const contactsQuery = "SELECT * FROM contacts ORDER BY created_at DESC";
      const contactsResult = await new Promise((resolve, reject) => {
        db.query(contactsQuery, (err, result) => {
          if (err) reject(err);
          else resolve(result.rows);
        });
      });
      contactData = contactsResult;
    }

    // Process the message and generate response
    const response = await processChatMessage(message, contactData);
    
    res.json({
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Chat processing error:", error);
    res.status(500).json({ message: "Error processing chat message" });
  }
});

// Helper function for chat processing
async function processChatMessage(message, contactData) {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const lowerMessage = message.toLowerCase();
  const analysis = performContactAnalysis(contactData);
  
  // Pattern matching for different types of questions
  if (lowerMessage.includes("convert") || lowerMessage.includes("conversion")) {
    return generateConversionResponse(analysis);
  } else if (lowerMessage.includes("churn") || lowerMessage.includes("risk")) {
    return generateChurnResponse(analysis);
  } else if (lowerMessage.includes("engagement") || lowerMessage.includes("improve")) {
    return generateEngagementResponse(analysis);
  } else if (lowerMessage.includes("high value") || lowerMessage.includes("valuable")) {
    return generateHighValueResponse(analysis);
  } else if (lowerMessage.includes("follow") || lowerMessage.includes("attention")) {
    return generateFollowUpResponse(analysis);
  } else if (lowerMessage.includes("growth") || lowerMessage.includes("acquisition")) {
    return generateGrowthResponse(analysis);
  } else if (lowerMessage.includes("category") || lowerMessage.includes("distribution")) {
    return generateCategoryResponse(analysis);
  } else if (lowerMessage.includes("recent") || lowerMessage.includes("new")) {
    return generateRecentResponse(analysis);
  } else {
    return generateGeneralResponse(analysis, message);
  }
}

// Response generation functions (same as frontend but for backend)
function generateConversionResponse(analysis) {
  const { conversionReady, highValueContacts, totalContacts } = analysis;
  
  if (conversionReady.length === 0) {
    return `📊 **Conversion Analysis**\n\nCurrently, you don't have any leads in your system. To improve conversion potential:\n\n• Focus on lead generation campaigns\n• Implement contact import from campaigns\n• Nurture prospects to convert them to leads\n\nYour current conversion potential is limited by the lack of leads in your pipeline.`;
  }

  const topLeads = conversionReady.slice(0, 5).map(c => 
    `• ${c.name} (${c.phone})`
  ).join('\n');

  return `📊 **Conversion Analysis**\n\nYou have ${conversionReady.length} leads ready for conversion out of ${totalContacts} total contacts.\n\n**Top Leads for Conversion:**\n${topLeads}\n\n**Conversion Strategy:**\n• Focus on these ${Math.min(5, conversionReady.length)} high-priority leads\n• Send personalized follow-up messages\n• Offer special incentives for quick conversion\n• Schedule calls or meetings within the next 7 days\n\n**Conversion Potential:** ${((conversionReady.length / totalContacts) * 100).toFixed(1)}% of your contacts are leads ready for conversion.`;
}

function generateChurnResponse(analysis) {
  const { atRiskContacts, totalContacts } = analysis;
  const churnRisk = ((atRiskContacts.length / totalContacts) * 100).toFixed(1);
  
  if (atRiskContacts.length === 0) {
    return `🛡️ **Churn Risk Analysis**\n\nGreat news! Your churn risk is currently very low. All contacts appear to be actively engaged.\n\n**Risk Level:** Low (${churnRisk}%)\n**Recommendations:**\n• Maintain current engagement strategies\n• Continue regular follow-ups\n• Monitor contact activity monthly`;
  }

  const riskContacts = atRiskContacts.slice(0, 3).map(c => 
    `• ${c.name} - Last seen ${Math.floor((new Date() - new Date(c.created_at)) / (1000 * 60 * 60 * 24))} days ago`
  ).join('\n');

  return `🛡️ **Churn Risk Analysis**\n\n⚠️ **Risk Level:** ${churnRisk > 30 ? 'High' : churnRisk > 15 ? 'Medium' : 'Low'} (${churnRisk}%)\n\n**At-Risk Contacts:**\n${riskContacts}\n\n**Immediate Actions:**\n• Send re-engagement campaigns to at-risk contacts\n• Offer special incentives or discounts\n• Schedule personal follow-ups\n• Update contact information and preferences\n\n**Prevention Strategy:**\n• Implement regular engagement monitoring\n• Set up automated follow-up sequences\n• Create loyalty programs for existing customers`;
}

function generateEngagementResponse(analysis) {
  const { engagementScore, categories, totalContacts } = analysis;
  
  let recommendations = "";
  if (parseFloat(engagementScore) < 50) {
    recommendations = "\n**Urgent Actions Needed:**\n• Launch personalized email campaigns\n• Implement SMS follow-up sequences\n• Schedule regular check-ins\n• Create valuable content for contacts";
  } else if (parseFloat(engagementScore) < 70) {
    recommendations = "\n**Improvement Opportunities:**\n• A/B test messaging strategies\n• Segment contacts for targeted campaigns\n• Implement feedback collection";
  } else {
    recommendations = "\n**Maintain Excellence:**\n• Continue current engagement strategies\n• Explore new communication channels\n• Scale successful approaches";
  }

  return `💡 **Engagement Analysis**\n\n**Current Engagement Score:** ${engagementScore}/100\n\n**Contact Distribution:**\n${Object.entries(categories).map(([cat, count]) => 
      `• ${cat.replace('_', ' ')}: ${count} contacts`
    ).join('\n')}\n\n**Engagement Strategy:**${recommendations}\n\n**Quick Wins:**\n• Focus on your most engaged contact segments\n• Personalize communication based on contact categories\n• Implement regular touchpoints (weekly/bi-weekly)`;
}

function generateHighValueResponse(analysis) {
  const { highValueContacts, categories } = analysis;
  
  if (highValueContacts.length === 0) {
    return `💎 **High-Value Contact Analysis**\n\nCurrently, you don't have any high-value contacts identified.\n\n**To Build High-Value Contacts:**\n• Focus on converting leads to customers\n• Implement customer success programs\n• Identify and nurture promising prospects\n• Create VIP customer tiers`;
  }

  const topContacts = highValueContacts.slice(0, 5).map(c => 
    `• ${c.name} (${c.category.replace('_', ' ')}) - ${c.phone}`
  ).join('\n');

  return `💎 **High-Value Contact Analysis**\n\nYou have ${highValueContacts.length} high-value contacts identified.\n\n**Top High-Value Contacts:**\n${topContacts}\n\n**High-Value Strategy:**\n• Provide premium support and services\n• Offer exclusive benefits and early access\n• Schedule regular check-ins and relationship building\n• Create referral programs with these contacts\n\n**Opportunity:** These contacts represent your most valuable relationships for growth and referrals.`;
}

function generateFollowUpResponse(analysis) {
  const { conversionReady, atRiskContacts, recentContacts } = analysis;
  
  let followUpList = [];
  
  if (conversionReady.length > 0) {
    followUpList.push(`**Priority 1 - Conversion Ready (${conversionReady.length} contacts):**\n${conversionReady.slice(0, 3).map(c => `• ${c.name} - Ready for conversion`).join('\n')}`);
  }
  
  if (recentContacts.length > 0) {
    followUpList.push(`**Priority 2 - Recent Contacts (${recentContacts.length} contacts):**\n${recentContacts.slice(0, 3).map(c => `• ${c.name} - Added recently`).join('\n')}`);
  }
  
  if (atRiskContacts.length > 0) {
    followUpList.push(`**Priority 3 - At Risk (${atRiskContacts.length} contacts):**\n${atRiskContacts.slice(0, 3).map(c => `• ${c.name} - Needs re-engagement`).join('\n')}`);
  }

  return `📋 **Follow-Up Priority List**\n\n${followUpList.join('\n\n')}\n\n**Follow-Up Schedule:**\n• **Today:** Contact Priority 1 leads\n• **This Week:** Reach out to Priority 2 contacts\n• **Next Week:** Re-engage Priority 3 contacts\n\n**Follow-Up Templates:**\n• For leads: "I noticed you're interested in our services. Would you like to schedule a quick call?"\n• For recent contacts: "Welcome! How can we help you achieve your goals?"\n• For at-risk: "We haven't connected in a while. Is there anything we can help you with?"`;
}

function generateGrowthResponse(analysis) {
  const { recentContacts, totalContacts, categories } = analysis;
  const growthRate = ((recentContacts.length / totalContacts) * 100).toFixed(1);
  
  return `📈 **Growth Analysis**\n\n**Growth Metrics:**\n• Total Contacts: ${totalContacts}\n• Recent (30 days): ${recentContacts.length}\n• Growth Rate: ${growthRate}%\n\n**Contact Categories:**\n${Object.entries(categories).map(([cat, count]) => 
      `• ${cat.replace('_', ' ')}: ${count} (${((count/totalContacts)*100).toFixed(1)}%)`
    ).join('\n')}\n\n**Growth Strategy:**\n• **Lead Generation:** Focus on acquiring more leads\n• **Conversion:** Convert existing leads to customers\n• **Retention:** Keep current contacts engaged\n• **Referrals:** Encourage word-of-mouth marketing\n\n**Recommended Actions:**\n• Launch targeted acquisition campaigns\n• Implement referral programs\n• Optimize conversion funnels\n• Regular engagement to prevent churn`;
}

function generateCategoryResponse(analysis) {
  const { categories, totalContacts } = analysis;
  
  return `📊 **Category Distribution Analysis**\n\n**Current Distribution:**\n${Object.entries(categories).map(([cat, count]) => {
      const percentage = ((count/totalContacts)*100).toFixed(1);
      return `• ${cat.replace('_', ' ')}: ${count} contacts (${percentage}%)`;
    }).join('\n')}\n\n**Category Insights:**\n${categories.customer ? `✅ **Customers:** ${categories.customer} contacts - Your revenue base` : '⚠️ **No customers yet** - Focus on converting leads'}\n${categories.lead ? `🎯 **Leads:** ${categories.lead} contacts - Conversion opportunity` : '📝 **No leads yet** - Implement lead generation'}\n${categories.prospect ? `💡 **Prospects:** ${categories.prospect} contacts - Nurture to leads` : '🔍 **No prospects yet** - Build prospect pipeline'}\n\n**Optimization Strategy:**\n• Move prospects → leads → customers\n• Maintain strong customer relationships\n• Continuously feed the prospect pipeline`;
}

function generateRecentResponse(analysis) {
  const { recentContacts, totalContacts } = analysis;
  
  if (recentContacts.length === 0) {
    return `📅 **Recent Activity Analysis**\n\nNo new contacts have been added in the last 30 days.\n\n**Immediate Actions:**\n• Launch lead generation campaigns\n• Import contacts from existing databases\n• Enable contact import from campaign recipients\n• Network and attend industry events\n\n**Growth Target:** Aim for 10-20 new contacts per month for healthy growth.`;
  }

  const recentList = recentContacts.slice(0, 5).map(c => 
    `• ${c.name} (${c.category.replace('_', ' ')}) - Added ${Math.floor((new Date() - new Date(c.created_at)) / (1000 * 60 * 60 * 24))} days ago`
  ).join('\n');

  return `📅 **Recent Activity Analysis**\n\n**Recent Contacts (Last 30 Days):** ${recentContacts.length}\n\n**Latest Additions:**\n${recentList}\n\n**Recent Activity Strategy:**\n• **Welcome Sequence:** Send personalized welcome messages\n• **Quick Follow-up:** Contact new leads within 48 hours\n• **Nurture Campaigns:** Guide prospects through your funnel\n• **Track Engagement:** Monitor how recent contacts respond\n\n**Growth Rate:** ${((recentContacts.length / totalContacts) * 100).toFixed(1)}% of your contacts are new - ${recentContacts.length > 10 ? 'Excellent!' : recentContacts.length > 5 ? 'Good!' : 'Room for improvement!'}`;
}

function generateGeneralResponse(analysis, query) {
  return `🤔 **General Contact Analysis**\n\nBased on your question about "${query}", here's an overview of your contact situation:\n\n**Key Metrics:**\n• Total Contacts: ${analysis.totalContacts}\n• Engagement Score: ${analysis.engagementScore}/100\n• High-Value Contacts: ${analysis.highValueContacts.length}\n• At-Risk Contacts: ${analysis.atRiskContacts.length}\n\n**Quick Insights:**\n${analysis.conversionReady.length > 0 ? `• ${analysis.conversionReady.length} contacts ready for conversion` : '• No leads currently in pipeline'}\n${analysis.recentContacts.length > 0 ? `• ${analysis.recentContacts.length} new contacts this month` : '• No new contacts added recently'}\n\n**Recommended Actions:**\n• Focus on converting leads to customers\n• Engage with at-risk contacts\n• Continue acquiring new contacts\n• Maintain relationships with existing customers\n\n**Try asking me about:**\n• "Which contacts need follow-up?"\n• "What's our churn risk?"\n• "How can we improve engagement?"\n• "Show me high-value contacts"`;
}

module.exports = router;
