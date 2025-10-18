import React, { useState, useEffect } from 'react';
import { ArrowRight, Mail, Linkedin, Search, CheckCircle, User, Lock } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/FormCard';
import { useToast } from '../components/ui/Toast';
import { useFormValidation, FormField, validationRules } from '../hooks/useFormValidation';
import { authAPI, collegesApi } from '../services/api';

interface OnboardingProps {
  onAuthenticate: (user: any, token: string) => void;
  onSwitchToLogin: () => void;
}
const Onboarding: React.FC<OnboardingProps> = ({
  onAuthenticate,
  onSwitchToLogin
}) => {
  const [step, setStep] = useState(1);
  const [collegeSearchQuery, setCollegeSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [colleges, setColleges] = useState<any[]>([]);
  const [isLoadingColleges, setIsLoadingColleges] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<any>(null);
  const { success, handleApiError } = useToast();

  const {
    fields,
    isValid,
    updateField,
    validateAllFields,
    getFieldError,
    getFormData
  } = useFormValidation(
    { email: '', username: '', name: '', password: '', collegeId: '' },
    {
      email: validationRules.email,
      username: validationRules.username,
      name: validationRules.name,
      password: validationRules.password
    }
  );

  // Load colleges from API
  const loadColleges = async (search?: string) => {
    try {
      setIsLoadingColleges(true);
      const response = await collegesApi.getColleges(1, 50, search);
      setColleges(response.colleges);
    } catch (error: any) {
      handleApiError(error, 'Failed to load colleges');
    } finally {
      setIsLoadingColleges(false);
    }
  };

  // Load colleges on component mount
  useEffect(() => {
    loadColleges();
  }, []);

  // Filter colleges based on search query
  const filteredColleges = collegeSearchQuery 
    ? colleges.filter(college => 
        college.name.toLowerCase().includes(collegeSearchQuery.toLowerCase()) ||
        college.shortName.toLowerCase().includes(collegeSearchQuery.toLowerCase())
      )
    : colleges;
  const handleRegister = async () => {
    if (!validateAllFields()) {
      return;
    }

    setIsLoading(true);

    try {
      const formData = getFormData();
      const data = await authAPI.register({
        email: formData.email,
        username: formData.username,
        name: formData.name,
        password: formData.password,
        collegeId: selectedCollege?.id || null
      });

      localStorage.setItem('token', data.token);
      success('Welcome to Codnite!', 'Your account has been created successfully.');
      onAuthenticate(data.user, data.token);
    } catch (error: any) {
      handleApiError(error, 'Registration Failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (step < 3) {
      if (step === 1) {
        // Validate step 1 fields before proceeding
        const step1Fields = ['email', 'username', 'name', 'password'];
        const hasErrors = step1Fields.some(field => getFieldError(field));
        
        if (hasErrors) {
          // Trigger validation for all fields
          validateAllFields();
          return;
        }
      }
      setStep(step + 1);
    } else {
      handleRegister();
    }
  };
  return <div className="flex flex-col items-center justify-center min-h-screen w-full bg-dark-700 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-primary-blue to-primary-purple rounded-lg h-10 w-10 flex items-center justify-center mr-3">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-blue to-primary-purple">
              Codnite
            </span>
          </div>
        </div>
        {/* Tagline */}
        <h1 className="text-center text-3xl font-bold mb-2 text-dark-100">
          United by Code
        </h1>
        <p className="text-center text-dark-300 mb-8">
          Join the community of coders, problem solvers, and innovators.
        </p>
        {/* Step indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map(s => <div key={s} className={`h-2 w-2 rounded-full transition-all ${s === step ? 'bg-primary-blue w-8' : s < step ? 'bg-primary-blue' : 'bg-dark-500'}`} />)}
          </div>
        </div>
        {/* Step content */}
        <div className="bg-dark-600 rounded-xl border border-dark-500 p-6 animate-fade-in">
          {step === 1 && <>
              <h2 className="text-xl font-medium mb-6 text-center">
                Create your account
              </h2>
              <div className="space-y-4 mb-6">
                <Button variant="outline" fullWidth leftIcon={<div className="h-5 w-5" />} onClick={handleNextStep}>
                  Continue with GitHub
                </Button>
                <Button variant="outline" fullWidth leftIcon={<Linkedin className="h-5 w-5" />} onClick={handleNextStep}>
                  Continue with LinkedIn
                </Button>
                <div className="flex items-center">
                  <div className="flex-1 h-px bg-dark-500"></div>
                  <span className="px-4 text-dark-300 text-sm">or</span>
                  <div className="flex-1 h-px bg-dark-500"></div>
                </div>
                <div className="space-y-4">
                  <FormField
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={fields.email.value}
                    error={getFieldError('email')}
                    onChange={(value) => updateField('email', value)}
                    required
                    icon={<Mail className="h-5 w-5 text-dark-400" />}
                  />
                  
                  <FormField
                    name="username"
                    label="Username"
                    type="text"
                    placeholder="Choose a username"
                    value={fields.username.value}
                    error={getFieldError('username')}
                    onChange={(value) => updateField('username', value)}
                    required
                    icon={<User className="h-5 w-5 text-dark-400" />}
                  />
                  
                  <FormField
                    name="name"
                    label="Full Name"
                    type="text"
                    placeholder="Your full name"
                    value={fields.name.value}
                    error={getFieldError('name')}
                    onChange={(value) => updateField('name', value)}
                    required
                  />
                  
                  <FormField
                    name="password"
                    label="Password"
                    type="password"
                    placeholder="Create a password"
                    value={fields.password.value}
                    error={getFieldError('password')}
                    onChange={(value) => updateField('password', value)}
                    required
                    icon={<Lock className="h-5 w-5 text-dark-400" />}
                  />
                </div>
              </div>
              
              <Button 
                variant="primary" 
                fullWidth 
                rightIcon={<ArrowRight className="h-5 w-5" />} 
                onClick={handleNextStep}
                disabled={isLoading || !isValid}
              >
                {isLoading ? 'Creating Account...' : 'Continue'}
              </Button>
              
              <div className="mt-6 text-center">
                <p className="text-dark-300 text-xs mb-2">
                  By continuing, you agree to Codnite's Terms of Service and
                  Privacy Policy.
                </p>
                <p className="text-dark-300 text-sm">
                  Already have an account?{' '}
                  <button
                    onClick={onSwitchToLogin}
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>}
          {step === 2 && <>
              <h2 className="text-xl font-medium mb-6 text-center">
                Verify your college
              </h2>
              <div className="space-y-6 mb-6">
                <div>
                  <label htmlFor="college-search" className="block text-sm font-medium text-dark-200 mb-1">
                    Search for your college
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-5 w-5 text-dark-400" />
                    </div>
                    <input 
                      type="text" 
                      id="college-search" 
                      value={collegeSearchQuery} 
                      onChange={e => {
                        setCollegeSearchQuery(e.target.value);
                        // Debounce search
                        const timeoutId = setTimeout(() => {
                          if (e.target.value.length > 2) {
                            loadColleges(e.target.value);
                          } else if (e.target.value.length === 0) {
                            loadColleges();
                          }
                        }, 300);
                        return () => clearTimeout(timeoutId);
                      }}
                      className="block w-full pl-10 pr-3 py-2.5 bg-dark-700 border border-dark-500 rounded-lg text-dark-100 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue" 
                      placeholder="Type your college name" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-dark-300">Select your college:</p>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {isLoadingColleges ? (
                      <div className="text-center py-4 text-dark-300">Loading colleges...</div>
                    ) : filteredColleges.length > 0 ? (
                      filteredColleges.map(college => (
                        <button 
                          key={college.id} 
                          onClick={() => {
                            setSelectedCollege(college);
                            setStep(3);
                          }} 
                          className="w-full flex items-center p-3 bg-dark-700 rounded-lg hover:bg-dark-500 transition-colors"
                        >
                          <img 
                            src={college.logoUrl || '/default-college-logo.svg'} 
                            alt={college.name} 
                            className="h-8 w-8 object-contain mr-3" 
                            onError={(e) => {
                              e.currentTarget.src = '/default-college-logo.svg';
                            }}
                          />
                          <div className="flex-1 text-left">
                            <span className="text-dark-100 text-sm font-medium">
                              {college.name}
                            </span>
                            <div className="text-dark-400 text-xs">
                              {college.shortName} • {college.location}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-4 text-dark-300">
                        No colleges found. Try a different search term.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="outline" fullWidth onClick={handleNextStep}>
                I'll verify later
              </Button>
            </>}
          {step === 3 && <>
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-primary-blue bg-opacity-20 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-primary-blue" />
                </div>
              </div>
              <h2 className="text-xl font-medium mb-2 text-center">
                You're all set!
              </h2>
              <p className="text-dark-300 text-center mb-6">
                Your account has been created successfully. Get ready to join
                the coding community.
              </p>
              <Button variant="primary" fullWidth onClick={handleNextStep}>
                Start exploring
              </Button>
            </>}
        </div>
      </div>
    </div>;
};
export default Onboarding;