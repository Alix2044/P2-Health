const { cosineSimilarity } = require('../../routes/profileSettings');

describe('cosineSimilarity function', () => {
	test('should return an empty array when input arrays are EMPTY', () => {
		const result = cosineSimilarity([], []);
		expect(result).toEqual([]);
	});

	test('should calculate cosine similarity correctly for given inputs', () => {
		const magnitudes = [ 2, 3 ];
		const dotProducts = [ 1, 2 ];

		const result = cosineSimilarity(magnitudes, dotProducts);
		expect(result).toEqual([ { index: 0, score: (1 / 2 + 1) / 2 }, { index: 1, score: (2 / 3 + 1) / 2 } ]);
	});

	test("shouldn't include negative cosine similarities numbers", () => {
		const magnitudes = [ 2, 3 ];
		const dotProducts = [ -3, 2 ];

		const result = cosineSimilarity(magnitudes, dotProducts);
		expect(result).toEqual([ { index: 1, score: (2 / 3 + 1) / 2 } ]);
	});

	test('should handle division by zero', () => {
		const magnitudes = [ 0, 3 ];
		const dotProducts = [ 1, 2 ];
		const result = cosineSimilarity(magnitudes, dotProducts);
		expect(result).toEqual([ { index: 1, score: 0.8333333333333333 } ]);
	});
});
