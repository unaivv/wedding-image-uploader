import { Router, Request, Response } from "express";

const router = Router();

router.get("/get-all", (req: Request, res: Response) => {
  res.json({
    message: "List of users",
    users: [
      { id: 1, name: "John Doe" },
      { id: 2, name: "Jane Smith" }
    ]
  });
});

export default router;
