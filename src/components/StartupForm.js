import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  InputAdornment,
  IconButton,
  Tooltip,
  Paper,
  Divider,
} from '@mui/material';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { analyzeStartupIdea } from '../services/openai';
import { getCompetitorsWithGemini, getStartupInsightsWithGemini } from '../services/gemini';
import useAuth from '../hooks/useAuth';
import AnalysisDashboard from './AnalysisDashboard';
import NavbarWrapper from './NavbarWrapper';

const INDUSTRIES = [
  'AI',
  'E-commerce',
  'FinTech',
  'Healthcare',
  'EdTech',
  'Other'
];

const TARGET_USERS = [
  'Businesses',
  'Consumers',
  'Enterprises',
  'Students',
  'Other'
];

const BUSINESS_MODELS = [
  'Subscription',
  'Freemium',
  'Ads',
  'One-time Purchase',
  'Other'
];

const USER_ACQUISITION = [
  'Ads',
  'Partnerships',
  'Social Media',
  'SEO',
  'Cold Outreach',
  'Other'
];

const MARKET_SIZES = [
  'Small',
  'Medium',
  'Large',
  'Global'
];

const BREAKEVEN_TIMES = [
  '3 months',
  '6 months',
  '1 year',
  '2 years',
  'More than 2 years'
];

const MARKET_TRENDS = [
  'AI Boom',
  'Remote Work',
  'Sustainability',
  'Digital Payments',
  'Cloud Computing',
  'Other'
];

const SAMPLE_DATA = {
  startupIdea: "AI-powered health monitoring wearable that predicts potential health issues before they become serious. The device uses advanced machine learning to analyze real-time health data and provides early warnings for various medical conditions.",
  industry: 'Healthcare',
  problemSolution: "Traditional health monitoring is reactive rather than proactive. Our solution uses AI to predict health issues days or weeks before symptoms appear, potentially saving lives through early intervention.",
  operationLocation: 'Global, starting with US and Europe',
  targetUsers: 'Consumers',
  hasCompetitors: 'yes',
  competitors: 'Apple Health, Fitbit, Samsung Health',
  userAcquisition: 'Partnerships',
  needFunding: 'yes',
  initialInvestment: '5000000',
  businessModel: 'Subscription',
  revenuePerUser: '29.99',
  breakEvenTime: '2 years',
  marketSize: 'Large',
  userGrowthRate: '45',
  supportingTrends: ['AI Boom', 'Digital Payments'],
  needAiStrategies: 'yes',
  needBenchmarking: 'yes',
  needPdfReport: 'yes'
};

const STEPS = [
  'Basic Info',
  'Market & Competition',
  'Financial & Growth',
  'AI & Reports',
  'Competitors'
];

const StartupForm = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [competitors, setCompetitors] = useState([]); 
  const [insights, setInsights] = useState(null);
  const { user } = useAuth();

  const renderBasicInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Startup Idea"
          multiline
          rows={4}
          value={formData.startupIdea || ''}
          onChange={(e) => handleFormChange('startupIdea', e.target.value)}
          error={!!errors.startupIdea}
          helperText={errors.startupIdea}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth error={!!errors.industry}>
          <InputLabel>Industry</InputLabel>
          <Select
            value={formData.industry || ''}
            onChange={(e) => handleFormChange('industry', e.target.value)}
            label="Industry"
          >
            {INDUSTRIES.map((industry) => (
              <MenuItem key={industry} value={industry}>{industry}</MenuItem>
            ))}
          </Select>
          {errors.industry && <FormHelperText>{errors.industry}</FormHelperText>}
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Problem & Solution"
          multiline
          rows={4}
          value={formData.problemSolution || ''}
          onChange={(e) => handleFormChange('problemSolution', e.target.value)}
          error={!!errors.problemSolution}
          helperText={errors.problemSolution}
        />
      </Grid>
    </Grid>
  );

  const renderMarketCompetition = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Operation Location"
          value={formData.operationLocation || ''}
          onChange={(e) => handleFormChange('operationLocation', e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Target Users</InputLabel>
          <Select
            value={formData.targetUsers || ''}
            onChange={(e) => handleFormChange('targetUsers', e.target.value)}
            label="Target Users"
          >
            {TARGET_USERS.map((user) => (
              <MenuItem key={user} value={user}>{user}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.hasCompetitors === 'yes'}
              onChange={(e) => handleFormChange('hasCompetitors', e.target.checked ? 'yes' : 'no')}
            />
          }
          label="Do you have competitors?"
        />
      </Grid>
      {formData.hasCompetitors === 'yes' && (
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Main Competitors"
            multiline
            rows={2}
            value={formData.competitors || ''}
            onChange={(e) => handleFormChange('competitors', e.target.value)}
            helperText="Separate competitors with commas"
          />
        </Grid>
      )}
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>User Acquisition Strategy</InputLabel>
          <Select
            value={formData.userAcquisition || ''}
            onChange={(e) => handleFormChange('userAcquisition', e.target.value)}
            label="User Acquisition Strategy"
          >
            {USER_ACQUISITION.map((strategy) => (
              <MenuItem key={strategy} value={strategy}>{strategy}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderFinancialGrowth = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.needFunding === 'yes'}
              onChange={(e) => handleFormChange('needFunding', e.target.checked ? 'yes' : 'no')}
            />
          }
          label="Do you need funding?"
        />
      </Grid>
      {formData.needFunding === 'yes' && (
        <Grid item xs={12}>
          <TextField
            fullWidth
            type="number"
            label="Initial Investment Needed ($)"
            value={formData.initialInvestment || ''}
            onChange={(e) => handleFormChange('initialInvestment', e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
        </Grid>
      )}
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Business Model</InputLabel>
          <Select
            value={formData.businessModel || ''}
            onChange={(e) => handleFormChange('businessModel', e.target.value)}
            label="Business Model"
          >
            {BUSINESS_MODELS.map((model) => (
              <MenuItem key={model} value={model}>{model}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          type="number"
          label="Revenue per User ($)"
          value={formData.revenuePerUser || ''}
          onChange={(e) => handleFormChange('revenuePerUser', e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Break-even Time</InputLabel>
          <Select
            value={formData.breakEvenTime || ''}
            onChange={(e) => handleFormChange('breakEvenTime', e.target.value)}
            label="Break-even Time"
          >
            {BREAKEVEN_TIMES.map((time) => (
              <MenuItem key={time} value={time}>{time}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderAIReports = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Market Size</InputLabel>
          <Select
            value={formData.marketSize || ''}
            onChange={(e) => handleFormChange('marketSize', e.target.value)}
            label="Market Size"
          >
            {MARKET_SIZES.map((size) => (
              <MenuItem key={size} value={size}>{size}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          type="number"
          label="Expected User Growth Rate (%)"
          value={formData.userGrowthRate || ''}
          onChange={(e) => handleFormChange('userGrowthRate', e.target.value)}
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>,
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Supporting Market Trends</InputLabel>
          <Select
            multiple
            value={formData.supportingTrends || []}
            onChange={(e) => handleFormChange('supportingTrends', e.target.value)}
            label="Supporting Market Trends"
          >
            {MARKET_TRENDS.map((trend) => (
              <MenuItem key={trend} value={trend}>{trend}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderMarketCompetition();
      case 2:
        return renderFinancialGrowth();
      case 3:
        return renderAIReports();
      default:
        return null;
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleNext = () => {
    if (activeStep === STEPS.length - 2) {
      handleSubmit();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const saveToFirebase = async (marketData) => {
    try {
      const docRef = await addDoc(collection(db, 'marketAnalysis'), {
        userId: user.uid,
        timestamp: serverTimestamp(),
        marketData: {
          ...marketData,
          swot: marketData.swot || {
            strengths: [],
            weaknesses: [],
            opportunities: [],
            threats: []
          }
        }
      });
      return docRef.id;
    } catch (err) {
      console.error('Error saving to Firebase:', err);
      throw err;
    }
  };

  const handleSubmit = async () => {
    try {
      setLoadingStage('Fetching competitors...');
      const competitorsList = await getCompetitorsWithGemini(formData);
      
      if (!competitorsList || competitorsList.length === 0) {
        throw new Error('Failed to fetch competitors');
      }

      setCompetitors(competitorsList);
      
      setLoadingStage('Generating insights...');
      const insightsList = await getStartupInsightsWithGemini(formData);
      
      if (!insightsList) {
        throw new Error('Failed to generate insights');
      }

      setInsights(insightsList);

      // Transform market data for charts
      const marketData = {
        demographics: insightsList.demographics,
        marketSize: [
          { year: '2020', value: parseFloat(insightsList.marketAnalysis?.current_growth_rate || 0) * 0.6 },
          { year: '2021', value: parseFloat(insightsList.marketAnalysis?.current_growth_rate || 0) * 0.8 },
          { year: '2022', value: parseFloat(insightsList.marketAnalysis?.current_growth_rate || 0) * 0.9 },
          { year: '2023', value: parseFloat(insightsList.marketAnalysis?.current_growth_rate || 0) },
          { year: '2024', value: parseFloat(insightsList.marketAnalysis?.current_growth_rate || 0) * 1.2 },
          { year: '2025', value: parseFloat(insightsList.marketAnalysis?.current_growth_rate || 0) * 1.4 }
        ],
        competitors: competitorsList.map(comp => ({
          name: comp.name,
          marketShare: comp.marketShare || 0,
          targetMarket: comp.targetAudience,
          strategies: comp.marketingStrategies
        })),
        swot: insightsList.swot // Add SWOT data here
      };

      setLoadingStage('Saving analysis...');
      
      // Save to Firebase first
      const analysisId = await saveToFirebase(marketData);
      
      // Store the analysis ID along with the market data
      const dataToStore = {
        ...marketData,
        analysisId
      };
      
      // Store in localStorage for immediate use
      localStorage.setItem('marketAnalysisData', JSON.stringify(dataToStore));

      setLoadingStage('');
      setActiveStep(activeStep + 1);
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze startup idea. Please try again.');
      setLoadingStage('');
    }
  };

  const renderInsightsCard = (title, data, icon) => {
    if (!data) return null;

    const renderContent = (content) => {
      if (typeof content === 'string') {
        return <p className="text-gray-600">{content}</p>;
      }
      
      if (Array.isArray(content)) {
        return (
          <ul className="list-disc pl-5">
            {content.map((item, index) => (
              <li key={index} className="text-gray-600 mb-2">{item}</li>
            ))}
          </ul>
        );
      }

      if (typeof content === 'object') {
        return Object.entries(content).map(([subTitle, subContent], index) => (
          <div key={index} className="mb-4">
            <h4 className="text-lg font-semibold mb-2">{subTitle}</h4>
            {renderContent(subContent)}
          </div>
        ));
      }

      return null;
    };

    return (
      <Paper 
        sx={{ 
          p: 3, 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.paper',
          boxShadow: 3
        }}
      >
        <Typography variant="h6" color="primary" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" color="text.secondary">
            Summary
          </Typography>
          <Typography variant="body1">
            {renderContent(data)}
          </Typography>
        </Box>
      </Paper>
    );
  };

  const renderStartupInsights = () => {
    if (!insights) return null;

    return (
      <div className="container mx-auto p-6">
        {/* <h1 className="text-3xl font-bold text-center mb-8">Startup Insights Analysis</h1> */}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/market-charts')}
            size="large"
          >
            View Market Analysis Charts
          </Button>
        </Box>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Risks & Solutions card hidden
          {renderInsightsCard("Risks & Solutions", {
            "Key Risks": insights.risksAndSolutions?.key_risks || [],
            "Solutions": insights.risksAndSolutions?.solutions || []
          }, "🛡️")}
          */}
          {/* Market Analysis card hidden
          {renderInsightsCard("Market Analysis", {
            "Current Growth Rate": insights.marketAnalysis?.current_growth_rate,
            "Market Trends": insights.marketAnalysis?.key_market_trends || [],
            "Projected Growth": insights.marketAnalysis?.projected_growth
          }, "📈")}
          */}
          
          {/* Audience & Marketing card hidden
          {renderInsightsCard("Audience & Marketing", {
            "Target Audience": insights.audienceAndMarketing?.target_audience,
            "Marketing Strategy": insights.audienceAndMarketing?.marketing_strategies || [],
            "Investor Appeal": insights.audienceAndMarketing?.investor_appeal_points || []
          }, "🎯")}
          */}
          
          {/* Revenue Streams card hidden
          {renderInsightsCard("Revenue Streams", {
            "Primary Revenue": insights.revenueStreams?.primary_revenue_sources || [],
            "Passive Income": insights.revenueStreams?.passive_income_opportunities || [],
            "Capital Raising": insights.revenueStreams?.capital_raising_strategies || []
          }, "💰")}
          */}
          
          {/* Suggested Names card hidden
          {renderInsightsCard("Suggested Names", 
            insights.startupNames?.suggested_modern_names || [], 
            "✨")}
          */}
        </div>
      </div>
    );
  };

  const renderCompetitorsStep = () => {
    if (loadingStage) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            {loadingStage}
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    return (
      <>
        <Box sx={{ py: 4 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Top Competitors Analysis
          </Typography>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {competitors.map((competitor, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'background.paper',
                    boxShadow: 3
                  }}
                >
                  <Typography variant="h6" color="primary" gutterBottom>
                    {competitor.name}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Market Share
                    </Typography>
                    <Typography variant="body1">
                      {competitor.marketShare}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Target Audience
                    </Typography>
                    <Typography variant="body1">
                      {competitor.targetAudience}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Marketing Strategies
                    </Typography>
                    <Typography variant="body1">
                      {competitor.marketingStrategies}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
        {renderStartupInsights()}
      </>
    );
  };

  const renderAnalysisStep = () => {
    if (loadingStage) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            {loadingStage}
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!analysis) {
      return null;
    }

    return (
      <Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }} elevation={2}>
              <Typography variant="h6" color="primary" gutterBottom>
                Market Overview
              </Typography>
              <Typography variant="body1">
                {analysis.marketInsights.summary}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }} elevation={2}>
              <Typography variant="h6" color="primary" gutterBottom>
                Competitive Analysis
              </Typography>
              <Typography variant="body1">
                {analysis.competitorInsights.summary}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }} elevation={2}>
              <Typography variant="h6" color="primary" gutterBottom>
                Funding Strategy
              </Typography>
              <Typography variant="body1">
                {analysis.fundingInsights.summary}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }} elevation={2}>
              <Typography variant="h6" color="primary" gutterBottom>
                Growth Strategy
              </Typography>
              <Typography variant="body1">
                {analysis.userGrowthInsights.summary}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Detailed Analysis & Projections
          </Typography>
          <AnalysisDashboard analysisData={analysis} />
        </Box>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => {
              setActiveStep(0);
              setAnalysis(null);
            }}
          >
            Start New Analysis
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              console.log('Save/Export analysis');
            }}
          >
            Save Analysis
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <NavbarWrapper />
      <div className="container mx-auto p-6" style={{ marginTop: '16px' }}>
        <h1 className="text-3xl font-bold text-center mb-8">Startup Idea Analyzer</h1>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === STEPS.length ? (
          renderAnalysisStep()
        ) : activeStep === STEPS.length - 1 ? (
          renderCompetitorsStep()
        ) : (
          <form onSubmit={(e) => {
            e.preventDefault();
            handleNext();
          }}>
            {getStepContent(activeStep)}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </Button>
              <Box>
                {activeStep === 0 && (
                  <Button
                    onClick={() => setFormData(SAMPLE_DATA)}
                    sx={{ mr: 1 }}
                  >
                    Fill Sample Data
                  </Button>
                )}
                <Button
                  variant="contained"
                  type="submit"
                  disabled={!!loadingStage}
                >
                  {activeStep === STEPS.length - 2 ? 'Analyze' : 'Next'}
                </Button>
              </Box>
            </Box>
          </form>
        )}
      </div>
    </>
  );
};

export default StartupForm;
