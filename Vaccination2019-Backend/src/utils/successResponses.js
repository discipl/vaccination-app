class SuccessResponse {
    constructor() {
        this.httpStatusCode = 200;
        this.code = 'OK';
        this.message = null;
        return this;
    }

    setCode(code) {
        this.code = code;
        return this;
    }

    setMessage(message) {
        this.message = message;
        return this;
    }

    setStatus(status) {
        this.httpStatusCode = status;
        return this;
    }

    static ok() {
        return new SuccessResponse();
    }

    /*
    static nodeCreated(message) {
        return new SuccessResponse()
            .setCode('NODE_CREATED')
            .setMessage(message)
            .setStatus(201);
    }

    static nodeRemoved(message) {
        return new SuccessResponse()
            .setCode('NODE_REMOVED')
            .setMessage(message);
    }
    */
}

module.exports = SuccessResponse;
