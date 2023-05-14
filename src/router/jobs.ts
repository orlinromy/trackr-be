import express, { Router } from "express";
import JobsControllers from "../controllers/jobs";
import auth from "../middleware/auth";

const router = Router();
const JobController = new JobsControllers();

router.post("/job", auth, JobController.getAllJobs);
router.post("/oneJob", auth, JobController.getOneJob);
router.patch("/job", auth, JobController.editJob);
router.patch("/status", auth, JobController.editJobStatus);
router.put("/job", auth, JobController.createNewJob);
router.delete("/job", auth, JobController.deleteJobs);
// router.patch("/logout", auth, JobController.logout);

export default router;
