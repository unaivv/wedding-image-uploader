import { Router, Request, Response } from "express";
import { useDatabase } from "../services/ddbb";
import ChallengeModel from "../models/challenge";
import FileModel from "../models/file";

const router = Router();

router.get("/create", async (req: Request, res: Response) => {

    const newChallenge = new ChallengeModel({
        title: "Primer baile",
        event: "683ef05ad8795795535d3b4f",
        description: "Captura el momento más emotivo del primer baile de los novios.",
        endDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
        topic: "Baile",
        participants: [],
        winner: null
    });

    await useDatabase(async () => {
        await newChallenge.save();
        console.log("New Challenge created:", newChallenge);
    })

    res.json(newChallenge);
});

router.get("/list", async (req: Request, res: Response) => {
    const { eventId } = req.query;
    if (!eventId) {
        res.status(400).json({ error: "Event ID is required" });
        return;
    }
    const challenges = await useDatabase(async () => {
        return await ChallengeModel.find().populate("participants.user").populate("participants.file").exec();
    });

    res.json(challenges);
});

router.get("/delete-participant", async (req: Request, res: Response) => {
    const { challengeId, userId } = req.query;
    if (!challengeId || !userId) {
        res.status(400).json({ error: "Challenge ID and User ID are required" });
        return;
    }

    await useDatabase(async () => {
        const challenge = await ChallengeModel.findById(challengeId).exec();
        if (!challenge) {
            res.status(404).json({ error: "Challenge not found" });
            return;
        }

        const participant = challenge.participants.find(
            (p: any) => p.user.toString() === userId
        );
        if (!participant) {
            res.status(404).json({ error: "Participant not found" });
            return;
        }

        const fileId = participant.file;

        await ChallengeModel.updateOne(
            { _id: challengeId },
            { $pull: { participants: { user: userId } } }
        ).exec();

        if (fileId) {
            await FileModel.deleteOne({ _id: fileId }).exec();
        }
    });

    res.json({ message: "Participant and file removed successfully" });
});

export default router;
