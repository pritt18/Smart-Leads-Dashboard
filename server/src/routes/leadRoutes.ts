import express from "express";

import {
  createLead,
  getLeads,
  getSingleLead,
  updateLead,
  deleteLead,
} from "../controllers/leadController";

import authMiddleware from "../middlewares/authMiddleware";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  createLead
);

router.get(
  "/",
  authMiddleware,
  getLeads
);

router.get(
  "/:id",
  authMiddleware,
  getSingleLead
);

router.put(
  "/:id",
  authMiddleware,
  updateLead
);

router.delete(
  "/:id",
  authMiddleware,
  deleteLead
);

export default router;