export function validateCardNumber(number: string): boolean {
  const digits = number.replace(/\D/g, "");
  const length = digits.length;
  if (length < 13 || length > 19) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}
