import React, { useState, useCallback } from 'react';
import { getFieldError, hasErrors } from '../utils/validation';
import '../styles/FormInput.css';

/**
 * Reusable form input component with validation
 * Features:
 * - Real-time validation
 * - Error display
 * - Loading states
 * - Accessibility support
 */
export const FormInput = ({
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  disabled = false,
  required = false,
  maxLength,
  pattern,
  options = [], // For select/radio
  rows, // For textarea
  className = '',
}) => {
  const [touched, setTouched] = useState(false);
  const showError = touched && error;

  const handleBlur = useCallback((e) => {
    setTouched(true);
    onBlur?.(e);
  }, [onBlur]);

  const handleChange = (e) => {
    onChange(e);
    if (touched) {
      onBlur?.(e);
    }
  };

  const inputProps = {
    id: name,
    name,
    value,
    onChange: handleChange,
    onBlur: handleBlur,
    disabled,
    required,
    maxLength,
    pattern,
    'aria-label': label,
    'aria-describedby': showError ? `${name}-error` : undefined,
    className: `form-input ${showError ? 'error' : ''} ${className}`,
  };

  return (
    <div className={`form-group ${showError ? 'has-error' : ''}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          {...inputProps}
          placeholder={placeholder}
          rows={rows || 4}
        />
      ) : type === 'select' ? (
        <select {...inputProps}>
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value || opt} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
      ) : type === 'radio' ? (
        <div className="radio-group">
          {options.map((opt) => (
            <label key={opt.value || opt} className="radio-label">
              <input
                type="radio"
                {...inputProps}
                value={opt.value || opt}
                checked={value === (opt.value || opt)}
              />
              <span>{opt.label || opt}</span>
            </label>
          ))}
        </div>
      ) : type === 'checkbox' ? (
        <label className="checkbox-label">
          <input
            type="checkbox"
            {...inputProps}
            checked={value === true}
            onChange={(e) => onChange({ ...e, target: { ...e.target, value: e.target.checked } })}
          />
          <span>{label}</span>
        </label>
      ) : (
        <input
          {...inputProps}
          type={type}
          placeholder={placeholder}
        />
      )}

      {showError && (
        <span id={`${name}-error`} className="error-message">
          {error}
        </span>
      )}
    </div>
  );
};

/**
 * Form component with validation support
 */
export const Form = ({
  onSubmit,
  errors,
  loading = false,
  children,
  className = '',
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasErrors(errors)) {
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`form-wrapper ${className}`} noValidate>
      {children}

      <button
        type="submit"
        disabled={loading || hasErrors(errors)}
        className="btn-submit"
      >
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};

/**
 * Custom hook for form handling with validation
 */
export const useForm = (initialValues, schema, onSubmit) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateField = useCallback((name, value) => {
    const { validationSchemas, validateFormData } = require('../utils/validation');
    
    // Re-validate entire form
    const result = validateFormData(schema, { ...formData, [name]: value });
    
    if (result.valid) {
      setErrors({});
    } else {
      setErrors(result.errors);
    }
  }, [formData, schema]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Validate on change
    validateField(name, newValue);
  }, [validateField]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  }, [formData, onSubmit]);

  const handleReset = useCallback(() => {
    setFormData(initialValues);
    setErrors({});
  }, [initialValues]);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    loading,
    handleChange,
    handleSubmit,
    handleReset,
    validateField,
  };
};

export default FormInput;
