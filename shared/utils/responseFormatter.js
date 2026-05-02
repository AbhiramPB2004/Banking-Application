// /shared/utils/responseFormatter.js
const responseFormatter = {
    success: (data = null, message = "Success") => {
        return {
            success: true,
            message: message,
            data: data
        };
    },
    error: (message = "An error occurred", errors = []) => {
        return {
            success: false,
            message: message,
            errors: errors
        };
    }
};

module.exports = responseFormatter;