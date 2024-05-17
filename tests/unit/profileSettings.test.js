
const { calculateBMI, calculateBMR, calculateMacros } = require('../../routes/profileSettings');





describe('calculateBMI', () => {
  test('calculates BMI correctly', () => {
    expect(calculateBMI(70, 170)).toBeCloseTo(24.22); // Sample values for weight (kg) and height (cm)
  });

  test('handles edge cases gracefully', () => {
    expect(calculateBMI(0, 170)).toBe('0.00'); // Edge case: zero weight
    expect(calculateBMI(70, 0)).toBe('Infinity'); // Edge case: zero height
  });
});
