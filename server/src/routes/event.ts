import { Router, Request, Response } from "express";
import { useDatabase } from "../services/ddbb";
import EventModel, { IEvent } from "../models/event";
import { authenticateUser } from "../services/auth";

const router = Router();

router.get("/create", authenticateUser, async (req: Request, res: Response) => {

    const newEvent = new EventModel({
        name: "Wedding Ceremony",
        date: new Date("2024-06-15"),
        location: "Central Park, NYC",
        description: "A beautiful wedding ceremony in the park."
    });

    await useDatabase(async () => {
        await newEvent.save();
        console.log("New event created:", newEvent);
    })

    res.json(newEvent);
});

export default router;
