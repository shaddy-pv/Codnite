import React, { useState, useCallback, useEffect } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
  async?: (value: string) => Promise<string | null>;
  debounceMs?: number;
}

export interface ValidationErrors {
  [key: string]: string[];
}

export interface FormField {
  name: string;
  value: string;
  rules: ValidationRule;
  touched: boolean;
  errors: string[];
  isValidating: boolean;
  isValid: boolean;
}

export const useFormValidation = (
  initialValues: Record<string, string>, 
  validationRules: Record<string, ValidationRule>,
  options: {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    validateOnMount?: boolean;
  } = {}
) => {
  const { validateOnChange = true, validateOnBlur = true, validateOnMount = false } = options;
  
  const [fields, setFields] = useState<Record<string, FormField>>(() => {
    const initialFields: Record<string, FormField> = {};
    Object.keys(initialValues).forEach(key => {
      const value = initialValues[key];
      const rules = validationRules[key] || {};
      const hasValue = value && value.trim() !== '';
      const isRequired = rules.required || false;
      
      initialFields[key] = {
        name: key,
        value: value,
        rules: rules,
        touched: false,
        errors: [],
        isValidating: false,
        isValid: !isRequired || hasValue // Valid if not required or has value
      };
    });
    return initialFields;
  });

  const [isValid, setIsValid] = useState(() => {
    // Calculate initial validity based on initial values
    return Object.keys(initialValues).every(key => {
      const value = initialValues[key];
      const rules = validationRules[key] || {};
      const hasValue = value && value.trim() !== '';
      const isRequired = rules.required || false;
      return !isRequired || hasValue;
    });
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Debounce timers for async validation
  const debounceTimers = React.useRef<Record<string, NodeJS.Timeout>>({});

  const validateField = useCallback(async (fieldName: string, value: string): Promise<string[]> => {
    const rules = fields[fieldName]?.rules || {};
    const errors: string[] = [];

    // Required validation
    if (rules.required && (!value || value.trim() === '')) {
      errors.push(`${fieldName} is required`);
    }

    // Skip other validations if field is empty and not required
    if (!value || value.trim() === '') {
      return errors;
    }

    // Min length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
    }

    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${fieldName} must be no more than ${rules.maxLength} characters`);
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${fieldName} format is invalid`);
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }

    // Async validation
    if (rules.async) {
      try {
        const asyncError = await rules.async(value);
        if (asyncError) {
          errors.push(asyncError);
        }
      } catch (error) {
        errors.push('Validation failed. Please try again.');
      }
    }

    return errors;
  }, [fields]);

  const updateField = useCallback(async (fieldName: string, value: string, options: { 
    validate?: boolean; 
    touched?: boolean;
    debounce?: boolean;
  } = {}) => {
    const { validate = true, touched = true, debounce = true } = options;
    
    // Clear existing debounce timer
    if (debounceTimers.current[fieldName]) {
      clearTimeout(debounceTimers.current[fieldName]);
    }

    // Update field value immediately
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        touched: touched || prev[fieldName].touched,
        isValidating: validate && debounce
      }
    }));

    if (!validate) return;

    const validateFieldValue = async () => {
      const errors = await validateField(fieldName, value);
      
      setFields(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          errors,
          isValidating: false,
          isValid: errors.length === 0
        }
      }));
    };

    if (debounce && fields[fieldName]?.rules.debounceMs) {
      debounceTimers.current[fieldName] = setTimeout(validateFieldValue, fields[fieldName].rules.debounceMs);
    } else {
      await validateFieldValue();
    }
  }, [validateField, fields]);

  const validateAllFields = useCallback(async (): Promise<boolean> => {
    let allValid = true;
    const updatedFields = { ...fields };

    for (const fieldName of Object.keys(fields)) {
      const field = fields[fieldName];
      const errors = await validateField(fieldName, field.value);
      
      updatedFields[fieldName] = {
        ...field,
        errors,
        touched: true,
        isValidating: false,
        isValid: errors.length === 0
      };

      if (errors.length > 0) {
        allValid = false;
      }
    }

    setFields(updatedFields);
    setIsValid(allValid);
    return allValid;
  }, [fields, validateField]);

  const getFieldError = useCallback((fieldName: string): string => {
    const field = fields[fieldName];
    return field?.touched && field?.errors.length > 0 ? field.errors[0] : '';
  }, [fields]);

  const getAllErrors = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {};
    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      if (field.touched && field.errors.length > 0) {
        errors[fieldName] = field.errors;
      }
    });
    return errors;
  }, [fields]);

  const resetForm = useCallback(() => {
    const resetFields: Record<string, FormField> = {};
    Object.keys(initialValues).forEach(key => {
      resetFields[key] = {
        name: key,
        value: initialValues[key],
        rules: validationRules[key] || {},
        touched: false,
        errors: [],
        isValidating: false,
        isValid: true
      };
    });
    setFields(resetFields);
    setIsValid(false);
    setIsSubmitting(false);
    setSubmitError(null);
  }, [initialValues, validationRules]);

  const getFormData = useCallback((): Record<string, string> => {
    const formData: Record<string, string> = {};
    Object.keys(fields).forEach(key => {
      formData[key] = fields[key].value;
    });
    return formData;
  }, [fields]);

  const submitForm = useCallback(async (
    onSubmit: (data: Record<string, string>) => Promise<void>
  ) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const isValidForm = await validateAllFields();
      if (!isValidForm) {
        setIsSubmitting(false);
        return;
      }

      const formData = getFormData();
      await onSubmit(formData);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [validateAllFields, getFormData]);

  // Update isValid whenever fields change
  useEffect(() => {
    const allFieldsValid = Object.values(fields).every(field => field.isValid && field.value.trim() !== '');
    setIsValid(allFieldsValid);
  }, [fields]);

  // Validate on mount if requested
  useEffect(() => {
    if (validateOnMount) {
      validateAllFields();
    }
  }, [validateOnMount, validateAllFields]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  return {
    fields,
    isValid,
    isSubmitting,
    submitError,
    updateField,
    validateAllFields,
    getFieldError,
    getAllErrors,
    resetForm,
    getFormData,
    submitForm,
    setSubmitError
  };
};

// Common validation rules
export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
      return null;
    }
  },
  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      if (value && value.length < 8) {
        return 'Password must be at least 8 characters long';
      }
      if (value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      }
      return null;
    }
  },
  username: {
    required: true,
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_]+$/,
    custom: (value: string) => {
      if (value && !/^[a-zA-Z0-9_]+$/.test(value)) {
        return 'Username can only contain letters, numbers, and underscores';
      }
      return null;
    }
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    custom: (value: string) => {
      if (value && value.trim().length < 2) {
        return 'Name must be at least 2 characters long';
      }
      return null;
    }
  }
};

// Form Field Component with built-in validation display
interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  error: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  value,
  error,
  onChange,
  required = false,
  className = '',
  icon
}) => {
  const baseInputClass = `block w-full px-3 py-2.5 bg-dark-700 border rounded-lg text-dark-100 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-colors ${
    error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-dark-500'
  }`;

  const inputClass = icon ? `${baseInputClass} pl-10` : baseInputClass;

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-dark-200">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
      </div>
      
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-400 flex items-center">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};
