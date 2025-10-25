import React, { useState, useEffect, useMemo } from 'react';
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
      password: validationRules.password,
      collegeId: { required: true }
    }
  );

  // Custom step-aware validation
  const isStepValid = useMemo(() => {
    if (step === 1) {
      // Step 1: Only validate email, username, name, password
      const step1Fields = ['email', 'username', 'name', 'password'];
      return step1Fields.every(fieldName => {
        const field = fields[fieldName];
        return field && field.isValid && field.value.trim() !== '';
      });
    } else if (step === 2) {
      // Step 2: Validate college selection
      return selectedCollege && selectedCollege.id;
    } else if (step === 3) {
      // Step 3: All fields must be valid including collegeId
      return Object.values(fields).every(field => field.isValid && field.value.trim() !== '');
    }
    return false;
  }, [step, fields, selectedCollege]);

  // Debug logging
  useEffect(() => {
    console.log('Form state changed', { 
      isValid, 
      isStepValid,
      step,
      fields: Object.keys(fields).map(key => ({ 
        key, 
        value: fields[key].value, 
        isValid: fields[key].isValid, 
        errors: fields[key].errors 
      })),
      selectedCollege
    });
  }, [isValid, isStepValid, step, fields, selectedCollege]);

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
        collegeId: formData.collegeId || selectedCollege?.id || null
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
    console.log('handleNextStep called', { step, isValid, isLoading });
    if (step < 3) {
      if (step === 1) {
        // Validate step 1 fields before proceeding
        const step1Fields = ['email', 'username', 'name', 'password'];
        const hasErrors = step1Fields.some(field => getFieldError(field));
        
        console.log('Step 1 validation', { step1Fields, hasErrors, errors: step1Fields.map(f => ({ field: f, error: getFieldError(f) })) });
        
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
  return <div className="flex flex-col items-center justify-center min-h-screen w-full bg-ember-bg-primary px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <img 
              src="/assets/codinte-logo-2.png" 
              alt="Codnite Logo" 
              className="h-12 w-auto"
            />
          </div>
        </div>
        {/* Tagline */}
        <h1 className="text-center text-3xl font-bold mb-2 text-ember-text-primary">
          United by Code
        </h1>
        <p className="text-center text-ember-text-secondary mb-8">
          Join the community of coders, problem solvers, and innovators.
        </p>
        {/* Step indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map(s => <div key={s} className={`h-2 w-2 rounded-full transition-all ${s === step ? 'bg-primary-600 w-8' : s < step ? 'bg-primary-600' : 'bg-ember-border'}`} />)}
          </div>
        </div>
        {/* Step content */}
        <div className="bg-ember-bg-secondary rounded-xl border border-ember-border p-6 animate-fade-in">
          {step === 1 && <>
              <h2 className="text-xl font-medium mb-6 text-center text-ember-text-primary">
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
                  <div className="flex-1 h-px bg-ember-border"></div>
                  <span className="px-4 text-ember-text-muted text-sm">or</span>
                  <div className="flex-1 h-px bg-ember-border"></div>
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
                    icon={<Mail className="h-5 w-5 text-ember-text-muted" />}
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
                    icon={<User className="h-5 w-5 text-ember-text-muted" />}
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
                    icon={<Lock className="h-5 w-5 text-ember-text-muted" />}
                  />
                </div>
              </div>
              
              <Button 
                variant="primary" 
                fullWidth 
                rightIcon={<ArrowRight className="h-5 w-5" />} 
                onClick={handleNextStep}
                disabled={isLoading || !isStepValid}
              >
                {isLoading ? 'Creating Account...' : 'Continue'}
              </Button>
              
              <div className="mt-6 text-center">
                <p className="text-ember-text-muted text-xs mb-2">
                  By continuing, you agree to Codnite's Terms of Service and
                  Privacy Policy.
                </p>
                <p className="text-ember-text-secondary text-sm">
                  Already have an account?{' '}
                  <button
                    onClick={onSwitchToLogin}
                    className="text-primary-400 hover:text-primary-300 font-medium"
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
                  <label htmlFor="college-search" className="block text-sm font-medium text-ember-text-primary mb-1">
                    Search for your college
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-5 w-5 text-ember-text-muted" />
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
                      className="block w-full pl-10 pr-3 py-2.5 bg-ember-bg-tertiary border border-ember-border rounded-lg text-ember-text-primary focus:ring-2 focus:ring-primary-600 focus:border-primary-600" 
                      placeholder="Type your college name" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-ember-text-secondary">Select your college:</p>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {isLoadingColleges ? (
                      <div className="text-center py-4 text-ember-text-secondary">Loading colleges...</div>
                    ) : filteredColleges.length > 0 ? (
                      filteredColleges.map(college => (
                        <button 
                          key={college.id} 
                          onClick={() => {
                            setSelectedCollege(college);
                            updateField('collegeId', college.id);
                            setStep(3);
                          }} 
                          className="w-full flex items-center p-3 bg-ember-bg-tertiary rounded-lg hover:bg-ember-bg-hover transition-colors"
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
                            <span className="text-ember-text-primary text-sm font-medium">
                              {college.name}
                            </span>
                            <div className="text-ember-text-muted text-xs">
                              {college.shortName} • {college.location}
                              {college.city && college.state && (
                                <span> • {college.city}, {college.state}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-4 text-ember-text-secondary">
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
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Confirm Your Details
              </h2>
              
              <div className="space-y-4 mb-6">
                <div className="bg-ember-bg-tertiary rounded-xl p-4">
                  <h3 className="text-ember-text-primary font-medium mb-2">Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-ember-text-secondary">Name:</span>
                      <span className="text-ember-text-primary">{fields.name.value}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ember-text-secondary">Email:</span>
                      <span className="text-ember-text-primary">{fields.email.value}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ember-text-secondary">Username:</span>
                      <span className="text-ember-text-primary">@{fields.username.value}</span>
                    </div>
                  </div>
                </div>
                
                {selectedCollege && (
                  <div className="bg-ember-bg-tertiary rounded-xl p-4">
                    <h3 className="text-ember-text-primary font-medium mb-2">Selected College</h3>
                    <div className="flex items-center space-x-3">
                      <img 
                        src={selectedCollege.logoUrl || '/default-college-logo.svg'} 
                        alt={selectedCollege.name} 
                        className="h-10 w-10 object-contain" 
                        onError={(e) => {
                          e.currentTarget.src = '/default-college-logo.svg';
                        }}
                      />
                      <div>
                        <div className="text-ember-text-primary font-medium">{selectedCollege.name}</div>
                        <div className="text-ember-text-secondary text-sm">
                          {selectedCollege.shortName} • {selectedCollege.location}
                          {selectedCollege.city && selectedCollege.state && (
                            <span> • {selectedCollege.city}, {selectedCollege.state}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <Button 
                variant="primary" 
                fullWidth 
                onClick={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
              
              <Button 
                variant="outline" 
                fullWidth 
                onClick={() => setStep(2)}
                className="mt-2"
              >
                Back to College Selection
              </Button>
            </>}
        </div>
      </div>
    </div>;
};
export default Onboarding;