// validation.js

export const validateTaskInput = (text) => {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { isValid: false, message: 'Task text is required' };
  }
  if (trimmed.length < 3) {
    return { isValid: false, message: 'Task text must be at least 3 characters' };
  }
  if (trimmed.length > 255) {
    return { isValid: false, message: 'Task text cannot exceed 255 characters' };
  }
  return { isValid: true, message: '' };
};

export const clearError = (errorElement) => {
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
};
