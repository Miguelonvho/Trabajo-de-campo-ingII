export const getCardType = (cardNumber: string): string => {
  const num = cardNumber.replace(/\s/g, '');
  if (num.startsWith('4')) return 'Visa';
  if (num.startsWith('5')) return 'Mastercard';
  if (num.startsWith('3')) return 'Amex';
  return 'Generic';
};

export const validateCheckoutForm = (
  cardNumber: string,
  cardName: string,
  expiry: string,
  cvv: string
): string | null => {
  const rawCardNumber = cardNumber.replace(/\s/g, '');
  const cardType = getCardType(rawCardNumber);
  const isAmex = cardType === 'Amex';

  // 1. Tarjeta (Longitud y Algoritmo de Luhn)
  if (rawCardNumber.length < 15 || rawCardNumber.length > 16) {
    return 'El número de tarjeta debe tener 15 o 16 dígitos';
  }

  let sum = 0;
  let shouldDouble = false;
  for (let i = rawCardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(rawCardNumber.charAt(i), 10);
    if (shouldDouble) {
      if ((digit *= 2) > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  if (sum % 10 !== 0) {
    return 'El número de tarjeta es inválido (verificá que esté bien tipeado)';
  }

  // 2. Nombre del Titular
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!cardName.trim() || !nameRegex.test(cardName)) {
    return 'El nombre del titular solo puede contener letras y espacios';
  }

  // 3. Vencimiento Lógico (MM/AA)
  if (expiry.length < 5) {
    return 'Por favor, ingresá una fecha de expiración válida (MM/AA)';
  }
  const [monthStr, yearStr] = expiry.split('/');
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);

  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;

  if (month < 1 || month > 12) {
    return 'El mes de expiración debe estar entre 01 y 12';
  }
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return 'La tarjeta ingresada se encuentra vencida';
  }

  // 4. Código de Seguridad (CVV)
  const expectedCvvLength = isAmex ? 4 : 3;
  if (cvv.length !== expectedCvvLength) {
    return `El código de seguridad para ${isAmex ? 'Amex' : 'esta red'} debe tener ${expectedCvvLength} dígitos`;
  }

  return null; // No errors
};
