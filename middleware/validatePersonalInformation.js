
const { check } = require('express-validator');

const validatePersonalInformation = [
    check('gender'.toLowerCase()).isIn(['male', 'female']).withMessage('Invalid gender specified.'),
    check('age').isNumeric().withMessage('Invalid age provided.'),
    check('weight').isFloat().withMessage('Invalid weight provided.'),
    check('height').isNumeric().withMessage('Invalid height provided.'),
    check('activityLevel').not().isEmpty().withMessage('Activity level must be specified.')
];

module.exports = validatePersonalInformation;