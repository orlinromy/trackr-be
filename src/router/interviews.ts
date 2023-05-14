import express, { Router } from "express";
import InterviewsController from "../controllers/interviews";
import auth from "../middleware/auth";

const router = Router();
const InterviewController = new InterviewsController();

router.put("/interview", auth, InterviewController.addInterview); // FE need to call editJobStatus when interview is added
router.patch("/interview", auth, InterviewController.editInterview);
router.delete("/interview", auth, InterviewController.deleteInterview);
router.post("/interview", auth, InterviewController.getInterviews);
router.post("/oneInterview", auth, InterviewController.getOneJobInterview);
// router.patch("/job", auth, JobController.editJob);
// router.patch("/status", auth, JobController.editJobStatus);
// router.put("/job", auth, JobController.createNewJob);
// // router.patch("/logout", auth, JobController.logout);

export default router;
