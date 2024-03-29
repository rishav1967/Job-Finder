import Job from "../models/Job.js"
import { StatusCodes } from "http-status-codes"
import { BadRequestError, NotFoundError, UnAuthenticatedError } from '../errors/index.js'
import checkPermissions from "../utils/checkPermissions.js"
import mongoose from "mongoose"
import moment from "moment"
const createJob = async (req, res) => {
    const { position, company } = req.body
    if (!position || !company) {
        throw new BadRequestError("please provide all values")
    }
    req.body.createdBy = req.user.userId
    const job = await Job.create(req.body)
    res.status(StatusCodes.CREATED).json({ job })

}
const getAllJobs = async (req, res) => {
    const jobs = await Job.find({ createdBy: req.user.userId })
    res.status(StatusCodes.OK).json({ jobs, totalJobs: jobs.length, numOfPages: 1 })
}
const updateJob = async (req, res) => {
    const { id: jobId } = req.params
    //console.log(jobId)
    const { company, position } = req.body
    if (!position || !company) {
        throw new BadRequestError("Please provide all values")
    }
    const job = await Job.findOne({ _id: jobId })
    if (!job) {
        throw new NotFoundError(`No job with id :${jobId}`)
    }
    // check for permessions

    checkPermissions(req.user, job.createdBy)

    const updatedJob = await Job.findOneAndUpdate({ _id: jobId }, req.body, {
        new: true,
        runValidators: true,
    })
    res.status(StatusCodes.OK).json({ updatedJob })
}

const deleteJob = async (req, res) => {
    const { id: jobId } = req.params
    const job = await Job.findOne({ _id: jobId })
    if (!job) {
        throw new NotFoundError(`No job with id :${jobId}`)
    }
    checkPermissions(req.user, job.createdBy)
    await job.deleteOne()//in video it is await job.remove() but it was not working
    res.status(StatusCodes.OK).json({ msg: 'Success! job removed' })
}
const showStats = async (req, res) => {
    const id = new mongoose.Types.ObjectId(req.user.userId)
    let stats = await Job.aggregate([
        { $match: { createdBy: id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ])
    stats = stats.reduce((acc, curr) => {
        const { _id: title, count } = curr
        acc[title] = count
        return acc
    }, {})
    const defaultStats = {
        pending: stats.pending || 0,
        interview: stats.interview || 0,
        declined: stats.declined || 0,
    }

    let monthlyApplications = await Job.aggregate([
        { $match: { createdBy: id } },
        {
            $group: {
                _id: {
                    year: {
                        $year: '$createdAt',
                    },
                    month: {
                        $month: '$createdAt',
                    },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 },
    ])
    monthlyApplications = monthlyApplications.map((items) => {
        const { _id: { year, month }, count } = items
        const date = moment().month(month - 1).year(year).format('MMM Y')
        return { date, count }
    }).reverse()
    res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications })
}

export { createJob, deleteJob, getAllJobs, updateJob, showStats }