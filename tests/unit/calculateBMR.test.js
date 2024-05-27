const { calculateBMR } = require('../../routes/profileSettings');

describe('calculateBMR function', () => {
	test('Should calculate BMR  for female case', () => {
		expect(calculateBMR(170, 72, 22, 'female', 'sedentary')).toEqual(1816);
	});

	test('Should calculate BMR for male case', () => {
		expect(calculateBMR(190, 90, 25, 'male', 'sedentary')).toEqual(2363);
	});
});
