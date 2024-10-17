const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();



const publicKey = '-----BEGIN PUBLIC KEY-----\n' +
'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC4j1yYnnaYkuoN6CgdBO7yJ34J\n' +
'10pfIuXh23OKH6XtywbciFmaQ3SDabNP8WRyNocEAmc0ehabtLBdeYgpu+GnAgns\n' +
'oV9fTW3ue5Ane6JhqLIt5W43X2LLocnvGnihNzFfX12tCAPK+aA1H9d5niUNI2ok\n' +
'sv+Ej2pWGgNUfoUdXQIDAQAB\n' +
'-----END PUBLIC KEY-----';

const privateKey=process.env.PRIVATE_KEY;


const encryptWithRSA = (text) => {
    if (!text) {
        console.error('Attempting to encrypt with no text');
        return null;
    }
    try { 
        const formattedPublicKey = publicKey
        const encrypted = crypto.publicEncrypt(
            {
                key: formattedPublicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            },
            Buffer.from(text)
        );
        return encrypted.toString('base64');
    } catch (error) {
        console.error('Encryption failed:', error.message);
        throw error;
    }
};

const KYCSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    documentImage: {
        type: [String],
        required: true,
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'At least one document image is required.'
        }
    },
    firstName: {
        type: String,
        required: true,
        minlength: [2, 'First name must be at least 2 characters long.'],
    },
    lastName: {
        type: String,
        required: true, 
        minlength: [2, 'Last name must be at least 2 characters long.'],
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'others'],
        required: [true, 'Please provide your gender'],
    },
    dob: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return value <= new Date();
            },
            message: 'Date of birth cannot be in the future.'
        }
    },
    maritalStatus: {
        type: String,
        enum: ['single', 'married'],
        required: true,
    },
    idNumber: {
        type: String,
        required: true,
        unique: true,
    },
    documentType: {
        type: String,
        required: true,
    },
    nationality: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Resident Individual', 'Non Resident', 'Foreign National'],
        required: true,
    },
    pan: {
        type: String,
        required: false,
    },
    proofOfIdentity: {
        type: String,
        required: true,
    },
    contactInfo: {
        phoneNumber: {
            type: String,
            required: true,
            match: [/^\d{10}$/, 'Please provide a valid 10-digit phone number.'],
        },
        email: {
            type: String,
            required: true,
            validate: {
                validator: function (v) {
                    return /^\S+@\S+\.\S+$/.test(v);
                },
                message: 'Please provide a valid email address.'
            }
        },
    },
    permanentAddress: {
        streetAddress1: { type: String, required: false },
        streetAddress2: { type: String, required: false },
        city: { type: String, required: false },
        state: { type: String, required: false },
        country: { type: String, required: false },
        postalCode: {
            type: String,
            required: false,
            match: [/^\d{5,6}$/, 'Please provide a valid postal code.']
        },
    },
    documentIssuedDate: {
        type: Date,
        required: true,
    },
    documentVerified: {
        type: Boolean,
        default: false,
        set: function (value) {
            if (value === true && !this.documentVerified) {
                this.verificationTimestamp = new Date();
            }
            return value;
        },
    },
    verificationTimestamp: {
        type: Date,
        required: false,
    },
    filesUploaded: {
        type: [String],
        required: false,
    },
    declaration: {
        signedBy: {
            type: String,
            required: true,
            set: function (value) {
                if (this.isModified('signedBy')) {
                    throw new Error('The declaration cannot be changed once signed.');
                }
                return value;
            },
        },
        signedDate: {
            type: Date,
            default: Date.now,
        },
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});


KYCSchema.pre('save', async function (next) {
    if (this.isModified('userId')) {
        try {
            this.userId = encryptWithRSA(this.userId.toString());
        } catch (error) {
            console.error('Error encrypting userId:', error);
            return next(error);
        }
    }
    if (this.isModified('idNumber')) {
        try {

            this.idNumber = encryptWithRSA(this.idNumber);
        } catch (error) {
            console.error('Error encrypting idNumber:', error);
            return next(error);
        }
    }
    if (this.isModified('pan') && this.pan) {
        try {
            this.pan = encryptWithRSA(this.pan);
        } catch (error) {
            console.error('Error encrypting pan:', error);
            return next(error);
        }
    }
    next();
});

const KYC = mongoose.model('KYC', KYCSchema);

module.exports = KYC;