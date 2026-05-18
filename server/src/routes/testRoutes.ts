import express from "express";

import authMiddleware, {
  AuthRequest,
} from "../middlewares/authMiddleware";

const router = express.Router();

router.get(
  "/protected",
  authMiddleware,
  (req: AuthRequest, res) => {
    res.json({
      message: "Protected route accessed",
      user: req.user,
    });
  }
);

export default router;