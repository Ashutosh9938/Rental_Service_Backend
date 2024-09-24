const { StatusCodes } = require('http-status-codes');
const KYC = require('../models/KYC');
const User = require('../models/User');
const { BadRequestError } = require('../errors');
const sendEmail = require('../utils/sendEmail');
const cloudinary = require('cloudinary').v2;
const PDFDocument = require('pdfkit');

const submitKYC = async (req, res, next) => {
    try {
        console.log('Request Body:', req.body);

        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user) {
            return next(new BadRequestError('User not found'));
        }


        const existingKyc = await KYC.findOne({ userId });
        if (existingKyc) {
            return next(new BadRequestError('KYC already submitted'));
        } 
        

        const proofOfIdentity = req.files?.proofOfIdentity;
        const signedByFile = req.files?.signedByFile;

        if (!proofOfIdentity || !signedByFile) {
            return next(new BadRequestError('Both proof of identity and signed-by file must be uploaded'));
        }

        // Destructure and validate inputs
        const {
            firstName,
            lastName,
            gender,
            dob,
            maritalStatus,
            idNumber,
            documentType,
            nationality,
            status,
            pan,
            'contactInfo.phoneNumber': phoneNumber,
            'contactInfo.email': email,
            'addressPermanent.streetAddress1': permanentStreetAddress1,
            'addressPermanent.streetAddress2': permanentStreetAddress2,
            'addressPermanent.city': permanentCity,
            'addressPermanent.state': permanentState,
            'addressPermanent.country': permanentCountry,
            'addressPermanent.postalCode': permanentPostalCode,
            documentIssuedDate,
            'declaration.signedBy': signedBy,
        } = req.body;

        // Trim and validate all fields
        const trimmedFirstName = firstName?.trim();
        const trimmedLastName = lastName?.trim();
        const trimmedGender = gender?.trim();
        const trimmedMaritalStatus = maritalStatus?.trim();
        const trimmedStatus = status?.trim();
        const trimmedIdNumber = idNumber?.trim();
        const trimmedDocumentType = documentType?.trim();
        const trimmedNationality = nationality?.trim();
        const trimmedPan = pan?.trim();
        const trimmedPhoneNumber = phoneNumber?.trim();
        const trimmedEmail = email?.trim();
        const trimmedSignedBy = signedBy?.trim();

        if (!trimmedFirstName || !trimmedLastName || !trimmedIdNumber || !trimmedDocumentType || !trimmedNationality || !trimmedStatus || !trimmedPhoneNumber || !trimmedEmail || !trimmedSignedBy) {
            return next(new BadRequestError('Required fields are missing'));
        }

        // Validate enums
        if (!['male', 'female', 'others'].includes(trimmedGender)) {
            return next(new BadRequestError('Invalid gender value'));
        }

        if (!['single', 'married'].includes(trimmedMaritalStatus)) {
            return next(new BadRequestError('Invalid marital status value'));
        }

        if (!['Resident Individual', 'Non Resident', 'Foreign National'].includes(trimmedStatus)) {
            return next(new BadRequestError('Invalid status value'));
        }

        // Validate phone number and email
        if (!/^\d{10}$/.test(trimmedPhoneNumber)) {
            return next(new BadRequestError('Invalid phone number format'));
        }

        if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
            return next(new BadRequestError('Invalid email format'));
        }

        // Convert dates
        const dobDate = new Date(dob);
        const documentIssuedDateDate = new Date(documentIssuedDate);

        if (isNaN(dobDate.getTime()) || isNaN(documentIssuedDateDate.getTime())) {
            return next(new BadRequestError('Invalid date format'));
        }

        // Upload files
        const uploadToCloudinary = async (file) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { resource_type: 'auto', folder: 'kyc_documents' },
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                stream.end(file.data);
            });
        };

        const uploadProofOfIdentity = await uploadToCloudinary(proofOfIdentity);
        const uploadSignedBy = await uploadToCloudinary(signedByFile);

        // Create KYC entry
        const kyc = new KYC({
            userId,
            firstName: trimmedFirstName,
            lastName: trimmedLastName,
            gender: trimmedGender,
            dob: dobDate,
            maritalStatus: trimmedMaritalStatus,
            idNumber: trimmedIdNumber,
            documentType: trimmedDocumentType,
            nationality: trimmedNationality,
            status: trimmedStatus,
            pan: trimmedPan,
            contactInfo: {
                phoneNumber: trimmedPhoneNumber,
                email: trimmedEmail,
            },
            permanentAddress: {
                streetAddress1: permanentStreetAddress1?.trim(),
                streetAddress2: permanentStreetAddress2?.trim(),
                city: permanentCity?.trim(),
                state: permanentState?.trim(),
                country: permanentCountry?.trim(),
                postalCode: permanentPostalCode?.trim()
            },
            documentIssuedDate: documentIssuedDateDate,
            proofOfIdentity: uploadProofOfIdentity.secure_url,
            documentImage: [uploadProofOfIdentity.secure_url],
            declaration: {
                signedBy: trimmedSignedBy,
            },
        });

        await kyc.save();

        user.personalDocumentsubmitted = true;
        await user.save();

        // Generate and send PDF
        const pdfStream = new PDFDocument();
        const chunks = [];
        pdfStream.on('data', (chunk) => chunks.push(chunk));
        pdfStream.on('end', async () => {
            const pdfBuffer = Buffer.concat(chunks);

            const emailSubject = 'Your KYC Document Submission';
            const emailHtml = `
                <h3>KYC Document Submitted</h3>
                <p>Your KYC document has been submitted successfully. Please find the attached PDF with the details.</p>
            `;

            await sendEmail({
                to: process.env.TO,
                subject: emailSubject,
                html: emailHtml,
                attachments: [
                    {
                        filename: `${trimmedLastName}_kyc_document.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf',
                    },
                ],
            });

            res.status(StatusCodes.CREATED).json({
                msg: 'KYC submitted successfully and email with PDF sent',
                kyc,
            });
        });

        pdfStream.fontSize(20).text('KYC Document Submission', { align: 'center' });
        pdfStream.moveDown();
        pdfStream.fontSize(14).text(`Name: ${trimmedFirstName} ${trimmedLastName}`);
        pdfStream.text(`ID Number: ${trimmedIdNumber}`);
        pdfStream.text(`Document Type: ${trimmedDocumentType}`);
        pdfStream.text(`Permanent Address: ${permanentStreetAddress1 || 'N/A'}`);
        pdfStream.text(`Nationality: ${trimmedNationality}`);
        pdfStream.text(`Date of Birth: ${dob}`);
        pdfStream.text(`Document Issue Date: ${documentIssuedDate}`);
        pdfStream.text(`Proof of Identity URL: ${uploadProofOfIdentity.secure_url}`);
        pdfStream.text(`Signed Document URL: ${uploadSignedBy.secure_url}`);
        pdfStream.text(`Phone Number: ${trimmedPhoneNumber}`);
        pdfStream.text(`Email: ${trimmedEmail}`);
        pdfStream.text(`Signed By: ${trimmedSignedBy}`);
        pdfStream.end();

    } catch (error) {
        console.error('KYC submission or Cloudinary upload error:', error);
        if (error.code === 'ERR_OSSL_UNSUPPORTED') {
            console.error('RSA Encryption failed. Please check your public key format and environment variables.');
        }
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'An error occurred during KYC submission or upload' });
    }
};


// KYC Verification
const verify = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new CustomError.BadRequestError('Please provide email');
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            throw new CustomError.UnauthenticatedError('Email not found');
        }

        if (!user.personalDocumentsubmitted) {
            throw new CustomError.UnauthenticatedError('Document not submitted');
        }

        const kyc = await KYC.findOne({ userId: user._id });
        if (!kyc || !kyc.documentVerified) {
            throw new CustomError.UnauthenticatedError('Document not verified');
        }

        res.status(StatusCodes.OK).json({ msg: 'Email and document verified. Ready for payment.' });
    } catch (error) {
        console.error('Verification error:', error);
        if (error instanceof CustomError.CustomAPIError) {
            res.status(error.statusCode).json({ msg: error.message });
        } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'An error occurred during verification' });
        }
    }
};

module.exports = { submitKYC, verify };
