
const { calculateBMI, calculateBMR, calculateMacros } = require('../../routes/profileSettings');

// Change the function parameter with actual data OMID 
describe('calculateBMR function', () => {
  test('calculates BMR correctly for male with sedentary activity level', () => {
    expect(calculateBMR(4, 150, 25, 'male', 'sedentary')).toEqual(1788);
  });

  test('calculates BMR correctly for female with moderate activity level', () => {
    expect(calculateBMR(5, 160, 25, 'female', 'lightly')).toEqual(1573);
  });

});
