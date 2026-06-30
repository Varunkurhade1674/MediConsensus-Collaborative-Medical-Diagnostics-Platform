const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Report = require('../models/Report');
const AIResult = require('../models/AIResult');
const Consensus = require('../models/Consensus');
const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mediconsensus';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Report.deleteMany({});
    await AIResult.deleteMany({});
    await Consensus.deleteMany({});
    await Comment.deleteMany({});
    await ActivityLog.deleteMany({});

    console.log('Existing database cleared.');

    // 1. Create Doctors
    const drSmith = new User({
      name: 'Dr. Sarah Smith',
      email: 'drsmith@mediconsensus.com',
      password: 'password123', // Will be hashed automatically by pre-save middleware
      role: 'doctor',
      hospital: 'Mayo Clinic Neurology Dept',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'
    });
    await drSmith.save();

    const chiefJustice = new User({
      name: 'Dr. Robert Chen',
      email: 'chen@mediconsensus.com',
      password: 'password123',
      role: 'admin',
      hospital: 'Johns Hopkins Chief Medical Officer',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'
    });
    await chiefJustice.save();

    console.log('Doctors seeded successfully.');

    // 2. Create Patients
    const patient1 = new Patient({
      name: 'Eleanor Vance',
      dob: new Date(1972, 3, 22),
      gender: 'Female',
      age: 54,
      bloodGroup: 'A+',
      contactNumber: '+1 (555) 124-5678',
      medicalHistory: 'Mild Hypertension (treated with Lisinopril 10mg daily), osteopenia.'
    });
    await patient1.save();

    const patient2 = new Patient({
      name: 'Marcus Brody',
      dob: new Date(1964, 8, 15),
      gender: 'Male',
      age: 61,
      bloodGroup: 'B-',
      contactNumber: '+1 (555) 987-6543',
      medicalHistory: 'Chronic smoker (15 pack-years), Hyperlipidemia managed with Atorvastatin.'
    });
    await patient2.save();

    console.log('Patients seeded successfully.');

    // 3. Create Sample Reports
    const report1 = new Report({
      patientId: patient1._id,
      uploaderId: drSmith._id,
      fileName: 'eleanor_neurology_report.pdf',
      fileUrl: '/uploads/eleanor_neurology_report.pdf',
      fileType: 'pdf',
      ocrText: `LAB ANALYSIS REPORT - NEUROLOGICAL SCREENING
Patient Name: Eleanor Vance
Fasting Blood Glucose (FBG): 148 mg/dL
HbA1c: 7.2%
Urinalysis: Microalbuminuria detected (32 mg/g creatinine)
Subjective Symptoms: Patient reports bilateral lower extremity paresthesia (burning, tingling) starting 3 months ago. Symptoms worsen during resting state and night. Sensation testing shows reduced responses to 10g monofilament on plantar surfaces. Reflexes are normal. eGFR: 84 mL/min/1.73m2.`,
      status: 'complete',
      summary: 'High consensus diagnostic match for Type 2 Diabetes Mellitus with associated Diabetic Sensory Neuropathy.',
      tags: ['Neurology', 'Endocrinology']
    });
    await report1.save();

    const report2 = new Report({
      patientId: patient2._id,
      uploaderId: drSmith._id,
      fileName: 'marcus_brody_pulmonary.txt',
      fileUrl: '/uploads/marcus_brody_pulmonary.txt',
      fileType: 'txt',
      ocrText: `SPIROMETRY TEST & PULMONARY EVALUATION
Patient Name: Marcus Brody
FEV1/FVC ratio: 0.65 (indicates airway obstruction)
FEV1: 62% of predicted value (moderate restriction/obstruction)
Symptoms: Shortness of breath on exertion, persistent productive cough for over 6 months. Chest X-ray indicates hyperinflation of the lungs.`,
      status: 'pending',
      summary: 'Report uploaded. Pending multi-model AI comparison.',
      tags: ['Pulmonology']
    });
    await report2.save();

    console.log('Reports seeded successfully.');

    // 4. Seed AI Results for Eleanor
    const gpt4Result = new AIResult({
      reportId: report1._id,
      modelName: 'GPT-4',
      diagnosis: 'Type 2 Diabetes Mellitus with Diabetic Peripheral Neuropathy',
      probability: 95,
      confidence: 90,
      reasoningSummary: 'Fasting glucose (>126 mg/dL) and HbA1c (>6.5%) are pathognomonic for Diabetes. Bilateral tingling and diminished monofilament response support distal symmetric polyneuropathy.',
      treatmentSuggestion: '1. Metformin 500mg daily, titrate up to 1000mg BID.\n2. Lifestyle modifications (low carb diet, weight reduction).\n3. Podiatry evaluation and daily foot checks.\n4. Microalbuminuria indicates early nephropathy; consider ACE inhibitor titration.',
      evidence: 'HbA1c 7.2%, Microalbuminuria 32 mg/g, reduced monofilament response.',
      references: ['ADA Standards of Care in Diabetes (2026)', 'AAN Practice Parameter on Treatment of Painful Diabetic Neuropathy']
    });
    await gpt4Result.save();

    const claudeResult = new AIResult({
      reportId: report1._id,
      modelName: 'Claude',
      diagnosis: 'Early-stage Type 2 Diabetes & Incipient Diabetic Sensory Neuropathy',
      probability: 92,
      confidence: 95,
      reasoningSummary: 'FBG and HbA1c exceed standard diagnostic thresholds. Patient symptoms fit typical distal pattern of diabetic sensory nerve damage.',
      treatmentSuggestion: '1. Initiate Metformin 500mg twice daily.\n2. Add Gabapentin 300mg QHS if tingling prevents sleep.\n3. Annual ophthalmological screen.',
      evidence: 'Glycemic indicators plus sensory symptoms in lower limbs.',
      references: ['AACE Guidelines for Management of Diabetes Mellitus', 'IDF Clinical Practice Guidelines']
    });
    await claudeResult.save();

    const geminiResult = new AIResult({
      reportId: report1._id,
      modelName: 'Gemini',
      diagnosis: 'Type 2 Diabetes and Neurovascular Impairment',
      probability: 88,
      confidence: 85,
      reasoningSummary: 'Hyperglycemia triggers microvascular changes leading to peripheral nerve ischemia. Decreased sensation matches early structural nerve damage.',
      treatmentSuggestion: '1. Optimize glycemic control with Metformin.\n2. Prescribe lifestyle alterations.\n3. Foot health education.',
      evidence: 'Fasting glucose 148, HbA1c 7.2%, microalbuminuria 32.',
      references: ['EASD Consensus Guidelines']
    });
    await geminiResult.save();

    console.log('AI Results seeded.');

    // 5. Seed Consensus Report for Eleanor
    const consensus = new Consensus({
      reportId: report1._id,
      consensusScore: 92,
      agreementScore: 90,
      findingsMatch: [
        {
          finding: 'Type 2 Diabetes Mellitus',
          agreeingModels: ['GPT-4', 'Claude', 'Gemini'],
          disagreeingModels: []
        },
        {
          finding: 'Peripheral Sensory Neuropathy',
          agreeingModels: ['GPT-4', 'Claude', 'Gemini'],
          disagreeingModels: []
        },
        {
          finding: 'Incipient Nephropathy / Microalbuminuria',
          agreeingModels: ['GPT-4', 'Gemini'],
          disagreeingModels: ['Claude']
        }
      ],
      disagreements: [
        {
          topic: 'Nephropathy treatment timeline',
          description: 'GPT-4 recommends immediate initiation of ACE inhibitor due to microalbuminuria, whereas Claude suggests baseline consult first.'
        }
      ],
      missingFindings: [
        'Lipid panel was not requested to assess cardiovascular risk.',
        'Ophthalmological evaluation status is unspecified.'
      ],
      medicalRisks: [
        'Progression of microvascular kidney injury.',
        'Loss of protective sensation leading to diabetic foot ulceration.'
      ],
      recommendations: 'Initiate Metformin 500mg daily. Assess renal parameters, titrate Lisinopril for kidney protection, and instruct patient on strict daily foot self-inspections.'
    });
    await consensus.save();

    console.log('Consensus Report seeded.');

    // 6. Seed Comments
    const comment1 = new Comment({
      reportId: report1._id,
      authorId: drSmith._id,
      text: 'I agree with the consensus report. Given Eleanor\'s trace microalbuminuria, the nephropathic risk is high. I will follow up with an endocrinologist referral.',
      parentId: null
    });
    await comment1.save();

    const comment2 = new Comment({
      reportId: report1._id,
      authorId: chiefJustice._id,
      text: 'Excellent work. Please verify if she has had an eye screening recently. Retinopathy is highly correlated with nephropathy.',
      parentId: comment1._id
    });
    await comment2.save();

    console.log('Comments seeded.');

    // 7. Seed Activity Logs
    await new ActivityLog({
      userId: drSmith._id,
      action: 'UPLOAD_REPORT',
      details: 'Uploaded neurological diagnostic records for Eleanor Vance.'
    }).save();

    await new ActivityLog({
      userId: chiefJustice._id,
      action: 'OVERRIDE_CONSENSUS',
      details: 'Approved consensus recommendations for Eleanor Vance.'
    }).save();

    console.log('Database seeding successfully complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
