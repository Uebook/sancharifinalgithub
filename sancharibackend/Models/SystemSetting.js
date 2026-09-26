import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    isEncrypted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);

export default SystemSetting;
