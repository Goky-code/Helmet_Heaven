const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_REGEX = /^[\p{L}][\p{L}\p{M}\s'-]*$/u;

const PASSWORD_RULES = [
    {
        test: value => value.length >= 8,
        message: "Password must contain at least 8 characters."
    },
    {
        test: value => /[A-Z]/.test(value),
        message: "Password must contain at least one uppercase letter."
    },
    {
        test: value => /[a-z]/.test(value),
        message: "Password must contain at least one lowercase letter."
    },
    {
        test: value => /[0-9]/.test(value),
        message: "Password must contain at least one number."
    },
    {
        test: value => /[^A-Za-z0-9\s]/.test(value),
        message: "Password must contain at least one special character."
    }
];

export const normalizeEmail = (email) => {
    if (typeof email !== "string") {
        return "";
    }

    return email.trim().toLowerCase();
};

export const validateName = (name, fieldName = "Name") => {
    if (typeof name !== "string" || !name.trim()) {
        throw new Error(`${fieldName} is required.`);
    }

    const value = name.trim();

    if (value.length < 2 || value.length > 30) {
        throw new Error(
            `${fieldName} must be between 2 and 30 characters.`
        );
    }

    if (!NAME_REGEX.test(value)) {
        throw new Error(
            `${fieldName} contains invalid characters.`
        );
    }

    return value;
};

export const validateEmail = (email) => {
    const value = normalizeEmail(email);

    if (!value) {
        throw new Error("Email is required.");
    }

    if (value.length > 254 || !EMAIL_REGEX.test(value)) {
        throw new Error("Please enter a valid email address.");
    }

    return value;
};

export const validatePassword = (password) => {
    if (typeof password !== "string" || !password) {
        throw new Error("Password is required.");
    }

    for (const rule of PASSWORD_RULES) {
        if (!rule.test(password)) {
            throw new Error(rule.message);
        }
    }

    return password;
};

export const validateConfirmPassword = (
    password,
    confirmPassword
) => {
    if (
        typeof confirmPassword !== "string" ||
        !confirmPassword
    ) {
        throw new Error("Please confirm your password.");
    }

    if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
    }
};

export const validateOtp = (otp) => {
    if (
        typeof otp !== "string" ||
        !/^\d{6}$/.test(otp.trim())
    ) {
        throw new Error("OTP must contain exactly 6 digits.");
    }

    return otp.trim();
};