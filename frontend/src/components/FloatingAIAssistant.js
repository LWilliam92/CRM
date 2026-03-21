import React, { useState, useRef, useEffect } from "react";

export default function FloatingAIAssistant({ contacts }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      text: "👋 Hi! I'm your AI CRM Assistant. I can help you analyze your entire CRM and answer questions like:\n\n• Which contacts are most likely to convert?\n• What's our current churn risk?\n• How can we improve engagement?\n• Which leads need immediate attention?\n• What's our campaign performance?\n• How can we grow our contact base?\n\nI have access to all your contacts, leads, and campaign data. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions] = useState([
    "Which contacts are most likely to convert?",
    "What's our current churn risk?",
    "How can we improve engagement?",
    "Show me high-value contacts",
    "Which leads need follow-up?",
    "What's our campaign performance?",
    "How can we grow our contact base?"
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const processUserQuery = async (query) => {
    setIsTyping(true);
    
    try {
      // Simulate AI processing - in production, this would call an AI service
      const response = await generateAIResponse(query, contacts);
      
      const assistantMessage = {
        id: messages.length + 1,
        type: "assistant",
        text: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error processing query:", error);
      
      const errorMessage = {
        id: messages.length + 1,
        type: "assistant",
        text: "Sorry, I encountered an error processing your question. Please try again.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = async (query, contactData) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerQuery = query.toLowerCase();
    
    // Analyze contact data once
    const analysis = analyzeContacts(contactData);
    
    // Pattern matching for different types of questions
    if (lowerQuery.includes("convert") || lowerQuery.includes("conversion")) {
      return generateConversionResponse(analysis);
    } else if (lowerQuery.includes("churn") || lowerQuery.includes("risk")) {
      return generateChurnResponse(analysis);
    } else if (lowerQuery.includes("engagement") || lowerQuery.includes("improve")) {
      return generateEngagementResponse(analysis);
    } else if (lowerQuery.includes("high value") || lowerQuery.includes("valuable")) {
      return generateHighValueResponse(analysis);
    } else if (lowerQuery.includes("follow") || lowerQuery.includes("attention")) {
      return generateFollowUpResponse(analysis);
    } else if (lowerQuery.includes("growth") || lowerQuery.includes("acquisition")) {
      return generateGrowthResponse(analysis);
    } else if (lowerQuery.includes("category") || lowerQuery.includes("distribution")) {
      return generateCategoryResponse(analysis);
    } else if (lowerQuery.includes("recent") || lowerQuery.includes("new")) {
      return generateRecentResponse(analysis);
    } else {
      return generateGeneralResponse(analysis, query);
    }
  };

  const analyzeContacts = (contacts) => {
    if (!contacts || contacts.length === 0) {
      return {
        totalContacts: 0,
        categories: {},
        recentContacts: [],
        highValueContacts: [],
        atRiskContacts: [],
        conversionReady: [],
        engagementScore: 0
      };
    }

    const categories = {};
    const recentContacts = contacts.filter(c => {
      const daysSinceCreation = (new Date() - new Date(c.created_at)) / (1000 * 60 * 60 * 24);
      return daysSinceCreation <= 30;
    });

    contacts.forEach(contact => {
      categories[contact.category] = (categories[contact.category] || 0) + 1;
    });

    const highValueContacts = contacts.filter(c => 
      c.category === 'customer' || 
      (c.category === 'lead' && recentContacts.includes(c))
    );

    const atRiskContacts = contacts.filter(c => {
      const daysSinceCreation = (new Date() - new Date(c.created_at)) / (1000 * 60 * 60 * 24);
      return daysSinceCreation > 90 && c.category !== 'customer';
    });

    const conversionReady = contacts.filter(c => c.category === 'lead');

    const engagementScore = calculateEngagementScore(contacts);

    return {
      totalContacts: contacts.length,
      categories,
      recentContacts,
      highValueContacts,
      atRiskContacts,
      conversionReady,
      engagementScore
    };
  };

  const calculateEngagementScore = (contacts) => {
    const customerContacts = contacts.filter(c => c.category === 'customer').length;
    const leadContacts = contacts.filter(c => c.category === 'lead').length;
    const total = contacts.length;
    
    if (total === 0) return 0;
    const score = ((customerContacts * 100) + (leadContacts * 60)) / total;
    return Math.min(100, score).toFixed(1);
  };

  const generateConversionResponse = (analysis) => {
    const { conversionReady, highValueContacts, totalContacts } = analysis;
    
    if (conversionReady.length === 0) {
      return `📊 **Conversion Analysis**\n\nCurrently, you don't have any leads in your system. To improve conversion potential:\n\n• Focus on lead generation campaigns\n• Implement contact import from campaigns\n• Nurture prospects to convert them to leads\n\nYour current conversion potential is limited by the lack of leads in your pipeline.`;
    }

    const topLeads = conversionReady.slice(0, 5).map(c => 
      `• ${c.name} (${c.phone})`
    ).join('\n');

    return `📊 **Conversion Analysis**\n\nYou have ${conversionReady.length} leads ready for conversion out of ${totalContacts} total contacts.\n\n**Top Leads for Conversion:**\n${topLeads}\n\n**Conversion Strategy:**\n• Focus on these ${Math.min(5, conversionReady.length)} high-priority leads\n• Send personalized follow-up messages\n• Offer special incentives for quick conversion\n• Schedule calls or meetings within the next 7 days\n\n**Conversion Potential:** ${((conversionReady.length / totalContacts) * 100).toFixed(1)}% of your contacts are leads ready for conversion.`;
  };

  const generateChurnResponse = (analysis) => {
    const { atRiskContacts, totalContacts } = analysis;
    const churnRisk = ((atRiskContacts.length / totalContacts) * 100).toFixed(1);
    
    if (atRiskContacts.length === 0) {
      return `🛡️ **Churn Risk Analysis**\n\nGreat news! Your churn risk is currently very low. All contacts appear to be actively engaged.\n\n**Risk Level:** Low (${churnRisk}%)\n**Recommendations:**\n• Maintain current engagement strategies\n• Continue regular follow-ups\n• Monitor contact activity monthly`;
    }

    const riskContacts = atRiskContacts.slice(0, 3).map(c => 
      `• ${c.name} - Last seen ${Math.floor((new Date() - new Date(c.created_at)) / (1000 * 60 * 60 * 24))} days ago`
    ).join('\n');

    return `🛡️ **Churn Risk Analysis**\n\n⚠️ **Risk Level:** ${churnRisk > 30 ? 'High' : churnRisk > 15 ? 'Medium' : 'Low'} (${churnRisk}%)\n\n**At-Risk Contacts:**\n${riskContacts}\n\n**Immediate Actions:**\n• Send re-engagement campaigns to at-risk contacts\n• Offer special incentives or discounts\n• Schedule personal follow-ups\n• Update contact information and preferences\n\n**Prevention Strategy:**\n• Implement regular engagement monitoring\n• Set up automated follow-up sequences\n• Create loyalty programs for existing customers`;
  };

  const generateEngagementResponse = (analysis) => {
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
  };

  const generateHighValueResponse = (analysis) => {
    const { highValueContacts, categories } = analysis;
    
    if (highValueContacts.length === 0) {
      return `💎 **High-Value Contact Analysis**\n\nCurrently, you don't have any high-value contacts identified.\n\n**To Build High-Value Contacts:**\n• Focus on converting leads to customers\n• Implement customer success programs\n• Identify and nurture promising prospects\n• Create VIP customer tiers`;
    }

    const topContacts = highValueContacts.slice(0, 5).map(c => 
      `• ${c.name} (${c.category.replace('_', ' ')}) - ${c.phone}`
    ).join('\n');

    return `💎 **High-Value Contact Analysis**\n\nYou have ${highValueContacts.length} high-value contacts identified.\n\n**Top High-Value Contacts:**\n${topContacts}\n\n**High-Value Strategy:**\n• Provide premium support and services\n• Offer exclusive benefits and early access\n• Schedule regular check-ins and relationship building\n• Create referral programs with these contacts\n\n**Opportunity:** These contacts represent your most valuable relationships for growth and referrals.`;
  };

  const generateFollowUpResponse = (analysis) => {
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
  };

  const generateGrowthResponse = (analysis) => {
    const { recentContacts, totalContacts, categories } = analysis;
    const growthRate = ((recentContacts.length / totalContacts) * 100).toFixed(1);
    
    return `📈 **Growth Analysis**\n\n**Growth Metrics:**\n• Total Contacts: ${totalContacts}\n• Recent (30 days): ${recentContacts.length}\n• Growth Rate: ${growthRate}%\n\n**Contact Categories:**\n${Object.entries(categories).map(([cat, count]) => 
      `• ${cat.replace('_', ' ')}: ${count} (${((count/totalContacts)*100).toFixed(1)}%)`
    ).join('\n')}\n\n**Growth Strategy:**\n• **Lead Generation:** Focus on acquiring more leads\n• **Conversion:** Convert existing leads to customers\n• **Retention:** Keep current contacts engaged\n• **Referrals:** Encourage word-of-mouth marketing\n\n**Recommended Actions:**\n• Launch targeted acquisition campaigns\n• Implement referral programs\n• Optimize conversion funnels\n• Regular engagement to prevent churn`;
  };

  const generateCategoryResponse = (analysis) => {
    const { categories, totalContacts } = analysis;
    
    return `📊 **Category Distribution Analysis**\n\n**Current Distribution:**\n${Object.entries(categories).map(([cat, count]) => {
      const percentage = ((count/totalContacts)*100).toFixed(1);
      return `• ${cat.replace('_', ' ')}: ${count} contacts (${percentage}%)`;
    }).join('\n')}\n\n**Category Insights:**\n${categories.customer ? `✅ **Customers:** ${categories.customer} contacts - Your revenue base` : '⚠️ **No customers yet** - Focus on converting leads'}\n${categories.lead ? `🎯 **Leads:** ${categories.lead} contacts - Conversion opportunity` : '📝 **No leads yet** - Implement lead generation'}\n${categories.prospect ? `💡 **Prospects:** ${categories.prospect} contacts - Nurture to leads` : '🔍 **No prospects yet** - Build prospect pipeline'}\n\n**Optimization Strategy:**\n• Move prospects → leads → customers\n• Maintain strong customer relationships\n• Continuously feed the prospect pipeline`;
  };

  const generateRecentResponse = (analysis) => {
    const { recentContacts, totalContacts } = analysis;
    
    if (recentContacts.length === 0) {
      return `📅 **Recent Activity Analysis**\n\nNo new contacts have been added in the last 30 days.\n\n**Immediate Actions:**\n• Launch lead generation campaigns\n• Import contacts from existing databases\n• Enable contact import from campaign recipients\n• Network and attend industry events\n\n**Growth Target:** Aim for 10-20 new contacts per month for healthy growth.`;
    }

    const recentList = recentContacts.slice(0, 5).map(c => 
      `• ${c.name} (${c.category.replace('_', ' ')}) - Added ${Math.floor((new Date() - new Date(c.created_at)) / (1000 * 60 * 60 * 24))} days ago`
    ).join('\n');

    return `📅 **Recent Activity Analysis**\n\n**Recent Contacts (Last 30 Days):** ${recentContacts.length}\n\n**Latest Additions:**\n${recentList}\n\n**Recent Activity Strategy:**\n• **Welcome Sequence:** Send personalized welcome messages\n• **Quick Follow-up:** Contact new leads within 48 hours\n• **Nurture Campaigns:** Guide prospects through your funnel\n• **Track Engagement:** Monitor how recent contacts respond\n\n**Growth Rate:** ${((recentContacts.length / totalContacts) * 100).toFixed(1)}% of your contacts are new - ${recentContacts.length > 10 ? 'Excellent!' : recentContacts.length > 5 ? 'Good!' : 'Room for improvement!'}`;
  };

  const generateGeneralResponse = (analysis, query) => {
    return `🤔 **General Contact Analysis**\n\nBased on your question about "${query}", here's an overview of your contact situation:\n\n**Key Metrics:**\n• Total Contacts: ${analysis.totalContacts}\n• Engagement Score: ${analysis.engagementScore}/100\n• High-Value Contacts: ${analysis.highValueContacts.length}\n• At-Risk Contacts: ${analysis.atRiskContacts.length}\n\n**Quick Insights:**\n${analysis.conversionReady.length > 0 ? `• ${analysis.conversionReady.length} contacts ready for conversion` : '• No leads currently in pipeline'}\n${analysis.recentContacts.length > 0 ? `• ${analysis.recentContacts.length} new contacts this month` : '• No new contacts added recently'}\n\n**Recommended Actions:**\n• Focus on converting leads to customers\n• Engage with at-risk contacts\n• Continue acquiring new contacts\n• Maintain relationships with existing customers\n\n**Try asking me about:**\n• "Which contacts need follow-up?"\n• "What's our churn risk?"\n• "How can we improve engagement?"\n• "Show me high-value contacts"`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    
    await processUserQuery(inputMessage);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Bubble */}
      <div
        className="fixed bottom-6 right-6 z-50"
        onClick={toggleChat}
      >
        <div className="relative">
          {/* Notification Badge */}
          {!isOpen && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          )}
          
          {/* Bubble Button */}
          <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-110">
            <span className="text-2xl">🤖</span>
          </div>
          
          {/* Tooltip */}
          {!isOpen && (
            <div className="absolute bottom-full right-0 mb-2 bg-gray-800 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity duration-200">
              AI CRM Assistant
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl mr-2">🤖</span>
              <div>
                <h3 className="font-semibold text-sm">AI CRM Assistant</h3>
                <p className="text-xs opacity-90">Ask me anything about your CRM</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <button
                onClick={toggleChat}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-2 rounded-lg ${
                    message.type === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="whitespace-pre-line text-xs">{message.text}</div>
                  <div
                    className={`text-xs mt-1 ${
                      message.type === "user" ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-2 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t">
              <p className="text-xs text-gray-500 mb-1">Suggested questions:</p>
              <div className="flex flex-wrap gap-1">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full text-gray-700"
                  >
                    {suggestion.length > 20 ? suggestion.substring(0, 20) + '...' : suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask about your CRM..."
                className="flex-1 border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={isTyping || !inputMessage.trim()}
                className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                {isTyping ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
