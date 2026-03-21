import React, { useState, useEffect } from "react";
import axios from "axios";

export default function AIAnalytics({ contacts }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (contacts && contacts.length > 0) {
      analyzeContactPatterns();
    } else {
      setLoading(false);
    }
  }, [contacts]);

  const analyzeContactPatterns = async () => {
    setLoading(true);
    try {
      // Simulate AI analysis - in production, this would call an AI service
      const analysis = await performAIAnalysis(contacts);
      setInsights(analysis.insights);
      setRecommendations(analysis.recommendations);
    } catch (error) {
      console.error("Error analyzing contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const performAIAnalysis = (contactData) => {
    // Simulated AI analysis logic
    const totalContacts = contactData.length;
    const categories = {};
    const recentContacts = contactData.filter(c => {
      const createdDate = new Date(c.created_at);
      const daysSinceCreation = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
      return daysSinceCreation <= 30;
    });

    // Analyze categories
    contactData.forEach(contact => {
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
      engagementScore: calculateEngagementScore(contactData),
      churnRisk: calculateChurnRisk(contactData),
      conversionPotential: calculateConversionPotential(contactData)
    };

    // Generate recommendations
    const recommendations = generateRecommendations(insights, contactData);

    return { insights, recommendations };
  };

  const calculateEngagementScore = (contacts) => {
    // Simulate engagement calculation based on contact patterns
    const customerContacts = contacts.filter(c => c.category === 'customer').length;
    const leadContacts = contacts.filter(c => c.category === 'lead').length;
    const total = contacts.length;
    
    if (total === 0) return 0;
    const score = ((customerContacts * 100) + (leadContacts * 60)) / total;
    return Math.min(100, score).toFixed(1);
  };

  const calculateChurnRisk = (contacts) => {
    // Simulate churn risk analysis
    const oldContacts = contacts.filter(c => {
      const daysSinceCreation = (new Date() - new Date(c.created_at)) / (1000 * 60 * 60 * 24);
      return daysSinceCreation > 90;
    });
    
    const riskScore = oldContacts.length > 0 ? 
      ((oldContacts.length / contacts.length) * 100).toFixed(1) : 0;
    return Math.min(100, riskScore);
  };

  const calculateConversionPotential = (contacts) => {
    // Simulate conversion potential analysis
    const leads = contacts.filter(c => c.category === 'lead').length;
    const prospects = contacts.filter(c => c.category === 'prospect').length;
    const total = contacts.length;
    
    if (total === 0) return 0;
    const potential = ((leads * 70) + (prospects * 40)) / total;
    return Math.min(100, potential).toFixed(1);
  };

  const identifyHighValueContacts = (contacts) => {
    // Simulate high-value contact identification
    return contacts.filter(contact => {
      const daysSinceCreation = (new Date() - new Date(contact.created_at)) / (1000 * 60 * 60 * 24);
      return contact.category === 'customer' || 
             (contact.category === 'lead' && daysSinceCreation < 30);
    });
  };

  const generateRecommendations = (insights, contacts) => {
    const recommendations = [];

    // Growth recommendations
    if (parseFloat(insights.growthRate) < 10) {
      recommendations.push({
        type: "growth",
        priority: "high",
        title: "Low Contact Growth",
        description: "Contact growth rate is below 10%. Consider implementing lead generation campaigns.",
        action: "Review marketing strategies and lead acquisition channels"
      });
    }

    // Category recommendations
    if (insights.topCategory === 'lead' && insights.categoryDistribution.lead > insights.categoryDistribution.customer) {
      recommendations.push({
        type: "conversion",
        priority: "medium",
        title: "Lead Conversion Opportunity",
        description: `You have ${insights.categoryDistribution.lead} leads ready for conversion.`,
        action: "Focus on nurturing leads and conversion campaigns"
      });
    }

    // Engagement recommendations
    if (parseFloat(insights.engagementScore) < 50) {
      recommendations.push({
        type: "engagement",
        priority: "high",
        title: "Low Engagement Score",
        description: "Contact engagement is below optimal levels.",
        action: "Implement personalized communication strategies"
      });
    }

    // Churn risk recommendations
    if (parseFloat(insights.churnRisk) > 30) {
      recommendations.push({
        type: "retention",
        priority: "high",
        title: "High Churn Risk Detected",
        description: "Significant portion of contacts may be at risk of disengagement.",
        action: "Launch re-engagement campaigns for inactive contacts"
      });
    }

    // Conversion potential recommendations
    if (parseFloat(insights.conversionPotential) > 70) {
      recommendations.push({
        type: "opportunity",
        priority: "medium",
        title: "High Conversion Potential",
        description: "Strong opportunity for converting leads to customers.",
        action: "Accelerate conversion-focused campaigns"
      });
    }

    return recommendations;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "low": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getScoreColor = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 80) return "text-green-600";
    if (numScore >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <div className="text-blue-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
          <span className="ml-2 text-gray-600">Analyzing contact patterns...</span>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🤖</div>
          <p>No contact data available for AI analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="text-2xl mr-2">🤖</span>
            AI Contact Analytics
          </h3>
          <button
            onClick={analyzeContactPatterns}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          >
            Refresh Analysis
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Engagement Score</div>
            <div className={`text-xl font-bold ${getScoreColor(insights.engagementScore)}`}>
              {insights.engagementScore}%
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Churn Risk</div>
            <div className={`text-xl font-bold ${getScoreColor(100 - insights.churnRisk)}`}>
              {insights.churnRisk}%
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Conversion Potential</div>
            <div className={`text-xl font-bold ${getScoreColor(insights.conversionPotential)}`}>
              {insights.conversionPotential}%
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Growth Rate</div>
            <div className={`text-xl font-bold ${getScoreColor(insights.growthRate)}`}>
              {insights.growthRate}%
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Contact Distribution</h4>
          <div className="space-y-2">
            {Object.entries(insights.categoryDistribution).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">
                  {category.replace('_', ' ')}
                </span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(count / insights.totalContacts) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl mr-2">💡</span>
            AI Recommendations
          </h4>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-gray-900">{rec.title}</h5>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <p className="text-sm text-blue-600 font-medium">
                      Suggested Action: {rec.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
