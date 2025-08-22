import React, { useState } from 'react';
import { ArrowRight, Mail, Linkedin, Search, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
interface OnboardingProps {
  onAuthenticate: () => void;
}
const Onboarding: React.FC<OnboardingProps> = ({
  onAuthenticate
}) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [collegeSearchQuery, setCollegeSearchQuery] = useState('');
  const colleges = [{
    id: 1,
    name: 'Massachusetts Institute of Technology',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/1200px-MIT_logo.svg.png'
  }, {
    id: 2,
    name: 'Stanford University',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Stanford_Cardinal_logo.svg/1200px-Stanford_Cardinal_logo.svg.png'
  }, {
    id: 3,
    name: 'Harvard University',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Harvard_Crimson_logo.svg/1200px-Harvard_Crimson_logo.svg.png'
  }, {
    id: 4,
    name: 'California Institute of Technology',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Caltech_Beavers_logo.svg/1200px-Caltech_Beavers_logo.svg.png'
  }, {
    id: 5,
    name: 'Princeton University',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Princeton_Tigers_logo.svg/1200px-Princeton_Tigers_logo.svg.png'
  }];
  const filteredColleges = collegeSearchQuery ? colleges.filter(college => college.name.toLowerCase().includes(collegeSearchQuery.toLowerCase())) : colleges;
  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onAuthenticate();
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
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-dark-200 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Mail className="h-5 w-5 text-dark-400" />
                    </div>
                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 bg-dark-700 border border-dark-500 rounded-lg text-dark-100 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue" placeholder="you@example.com" />
                  </div>
                </div>
              </div>
              <Button variant="primary" fullWidth rightIcon={<ArrowRight className="h-5 w-5" />} onClick={handleNextStep}>
                Continue
              </Button>
              <p className="text-dark-300 text-xs text-center mt-6">
                By continuing, you agree to Codnite's Terms of Service and
                Privacy Policy.
              </p>
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
                    <input type="text" id="college-search" value={collegeSearchQuery} onChange={e => setCollegeSearchQuery(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 bg-dark-700 border border-dark-500 rounded-lg text-dark-100 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue" placeholder="Type your college name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-dark-300">Select your college:</p>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredColleges.map(college => <button key={college.id} onClick={handleNextStep} className="w-full flex items-center p-3 bg-dark-700 rounded-lg hover:bg-dark-500 transition-colors">
                        <img src={college.logo} alt={college.name} className="h-8 w-8 object-contain mr-3" />
                        <span className="text-dark-100 text-sm">
                          {college.name}
                        </span>
                      </button>)}
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