// HELPER FOR EMAIL
// Helper for checking email
const isEmail = (email) => {
    // REGEX
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (email.match(regEx)) {
        return true;
    } else {
        return false;
    }
}
// Helper for empty value
const isEmpty = (string) => {
    if (string.trim() === '') {
        return true;
    }
    else return false;
}

exports.validateSignupData = (data) => {
    let errors = {};

    if (isEmpty(data.email)) {
        errors.email = 'Email Must Not Be Empty';
    } else if(!isEmail(data.email)){
        errors.email = 'Please Input a Valid Email Address'
    }

    // HELPER FOR PASSWORD
    if (isEmpty(data.password)) {
        errors.password = 'Password Must be Not Empty';
    }
    if (data.password !== data.confirmPassword) {
        errors.confirmPassword = 'Password Must be Match'
    }

    // Helper for Hendle
    if (isEmpty(data.handle)) {
        errors.handle = 'Must Not Empty';
    }

    return{
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

exports.validateLoginData = (data) => {
    // Helper for empty value
    const isEmpty = (string) => {
        if (string.trim() === '') {
            return true;
        }
        else return false;
    }

    let errors = {};

    if (isEmpty(data.email)) {
        errors.email = 'Email Not be Empty';
    }
    if (isEmpty(data.password)) {
        errors.password = 'Password Not be Empty';
    }

    return{
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}