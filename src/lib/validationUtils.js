// src/utils/validationUtils.js
export function formatPhoneNumber(value) {
    const phoneNumber = value.replace(/\D/g, '');
    
    if (phoneNumber.length >= 10) {
      return `(${phoneNumber.slice(0,3)}) ${phoneNumber.slice(3,6)}-${phoneNumber.slice(6,10)}`;
    } else if (phoneNumber.length >= 6) {
      return `(${phoneNumber.slice(0,3)}) ${phoneNumber.slice(3,6)}-${phoneNumber.slice(6)}`;
    } else if (phoneNumber.length >= 3) {
      return `(${phoneNumber.slice(0,3)}) ${phoneNumber.slice(3)}`;
    }
    return phoneNumber;
  }
  
  export function validatePhoneNumber(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10;
  }
  
  export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }