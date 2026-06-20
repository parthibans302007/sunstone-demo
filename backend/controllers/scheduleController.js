const ScheduledReport = require('../models/ScheduledReport');
const { logAction } = require('../utils/auditLogger');

const getSchedules = async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { createdByUser: req.user._id };
        const schedules = await ScheduledReport.find(query)
            .populate('createdByUser', 'name email role')
            .sort({ createdAt: -1 });
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createSchedule = async (req, res) => {
    const { name, reportType, filters, frequency, recipients, format, deliveryMethod } = req.body;
    try {
        if (!name || !reportType) {
            return res.status(400).json({ message: 'Name and Report Type are required' });
        }
        
        const schedule = await ScheduledReport.create({
            name,
            reportType,
            filters: filters || {},
            frequency: frequency || 'weekly',
            recipients: recipients || [],
            format: format || 'csv',
            deliveryMethod: deliveryMethod || 'email',
            createdByUser: req.user._id
        });
        
        await logAction(req, 'CREATE', 'REPORTS', null, schedule);
        res.status(201).json(schedule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateSchedule = async (req, res) => {
    const { name, reportType, filters, frequency, recipients, format, deliveryMethod, isActive } = req.body;
    try {
        const schedule = await ScheduledReport.findById(req.params.id);
        if (schedule) {
            if (req.user.role !== 'admin' && schedule.createdByUser.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to update this schedule' });
            }
            
            const prevValue = { ...schedule.toObject() };
            
            schedule.name = name !== undefined ? name : schedule.name;
            schedule.reportType = reportType !== undefined ? reportType : schedule.reportType;
            schedule.filters = filters !== undefined ? filters : schedule.filters;
            schedule.frequency = frequency !== undefined ? frequency : schedule.frequency;
            schedule.recipients = recipients !== undefined ? recipients : schedule.recipients;
            schedule.format = format !== undefined ? format : schedule.format;
            schedule.deliveryMethod = deliveryMethod !== undefined ? deliveryMethod : schedule.deliveryMethod;
            schedule.isActive = isActive !== undefined ? isActive : schedule.isActive;
            
            await schedule.save();
            await logAction(req, 'UPDATE', 'REPORTS', prevValue, schedule);
            
            res.json(schedule);
        } else {
            res.status(404).json({ message: 'Schedule not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteSchedule = async (req, res) => {
    try {
        const schedule = await ScheduledReport.findById(req.params.id);
        if (schedule) {
            if (req.user.role !== 'admin' && schedule.createdByUser.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to delete this schedule' });
            }
            const prevValue = { ...schedule.toObject() };
            await schedule.deleteOne();
            await logAction(req, 'DELETE', 'REPORTS', prevValue, null);
            res.json({ success: true, message: 'Schedule removed successfully' });
        } else {
            res.status(404).json({ message: 'Schedule not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule
};
