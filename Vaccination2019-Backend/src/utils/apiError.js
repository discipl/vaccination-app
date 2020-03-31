const { startCase } = require('lodash');
const BaseError = require('./error');
const Locale = require('./locale');
const logger = require('./logger');

class APIError extends BaseError {
    constructor(httpStatusCode) {
        super();
        this.httpStatusCode = httpStatusCode;
        logger.error(`Error with httpCode: ${httpStatusCode}`);
        return this;
    }

    setFields(param, type, fieldName) {
        let message;
        if (fieldName) {
            message = `${fieldName} is invalid`;
        } else {
            message = type ? `${fieldName || param} is ${type.toLowerCase()}` : `${param} is invalid`;
        }
        this.fields = [];
        this.fields.push({
            param,
            type,
            message,
        });
        logger.error(`Error with fields: ${JSON.stringify(this.fields)}`);
        return this;
    }

    // Bad request
    static invalidArgumentsError(params, fieldName) {
        return new APIError(400)
            .setCode('INVALID_ARGUMENTS')
            .setMessage(
                `${Locale.appLocalize.translate('Argument')} ${fieldName || params} ${Locale.appLocalize.translate('is not valid')}`
            )
            .setFields(params, 'INVALID', fieldName);
    }

    static actionIsNotAvailable() {
        return new APIError(400)
            .setCode('ACTIONS_IS_NOT_AVAILABLE')
            .setMessage(
                Locale.appLocalize.translate('Actions is not available')
            );
    }

    // Not authorized and forbidden
    static tokenInvalidError() {
        return new APIError(401)
            .setCode('TOKEN_INVALID')
            .setMessage(
                Locale.appLocalize.translate('Your session has been expired')
            );
    }

    static credentialsInvalidError() {
        return new APIError(400)
            .setCode('CREDENTIALS_INVALID')
            .setMessage(
                Locale.appLocalize.translate('Login or password are incorrect')
            );
    }

    static forbidden() {
        return new APIError(403)
            .setCode('FORBIDDEN')
            .setMessage(
                Locale.appLocalize.translate('Forbidden')
            );
    }

    // Not found
    static objectNotFoundError(entity) {
        const object = startCase(entity) || 'Object';
        const localizedObject = Locale.appLocalize.translate(object);
        return new APIError(404)
            .setCode('OBJECT_NOT_FOUND')
            .setMessage(`${localizedObject} ${Locale.appLocalize.translate('not found')}`);
    }

    // Conflicts
    static userAlreadyExists() {
        return new APIError(409)
            .setCode('USER_ALREADY_EXISTS')
            .setMessage(
                Locale.appLocalize.translate('User already exists')
            );
    }

    static noVaccines() {
        return new APIError(409)
            .setCode('NO_AVAILABLE_VACCINES')
            .setMessage(
                Locale.appLocalize.translate('Vaccines for this event are exhausted')
            );
    }

    static objectAlreadyExists(param) {
        return new APIError(409)
            .setCode('OBJECT_ALREADY_EXISTS')
            .setMessage(
                Locale.appLocalize.translate(`${param} already exists`)
            );
    }

    static vaccineAlreadyExists() {
        return new APIError(409)
            .setCode('VACCINE_ALREADY_EXISTS')
            .setMessage(
                Locale.appLocalize.translate('Vaccine already exists')
            );
    }

    static appointmentAlreadyExists() {
        return new APIError(409)
            .setCode('APPOINTMENT_ALREADY_EXISTS')
            .setMessage(
                Locale.appLocalize.translate('Appointment already exists')
            );
    }

    static loginIsOccupied() {
        return new APIError(409)
            .setCode('LOGIN_IS_OCCUPIED')
            .setMessage(
                Locale.appLocalize.translate('Login is occupied')
            );
    }

    static incorrectToken() {
        return new APIError(409)
            .setCode('USER_IS_NOT_CONFIRMED')
            .setMessage(
                Locale.appLocalize.translate('User is not confirmed')
            );
    }

    static hcProviderDoesntHasRightsForVaccination(hcProvider) {
        const error = new APIError(409)
            .setCode('HEALTHCARE_PROVIDER_DOESNT_HAS_RIGHTS_FOR_VACCINATION')
            .setMessage(
                Locale.appLocalize.translate('Healthcare provider does not has rights for vaccination')
            );
        if (hcProvider) {
            error.healthcareProvider = {
                firstName: hcProvider.firstName,
                lastName: hcProvider.lastName,
            };
        }
        return error;
    }

    // Internal server errors
    static internalServerError(message) {
        logger.error(`Error with message: ${message}`);
        return new APIError(500).setCode('INTERNAL_SERVER_ERROR');
    }

    static errorResponseHandler(error, res) {
        logger.error('errorResponseHandler: %s', error.message);
        if (error.stack) logger.error('error stack %s', error.stack);
        let result;
        if (!error.httpStatusCode) result = this.internalServerError(error.message);
        else result = error;
        res.status(result.httpStatusCode).send(result);
    }
}

module.exports = APIError;
