import express, { Request, Response } from "express";
import { useDatabase } from "../services/ddbb";
import UserModel from "../models/user";

const router = express.Router();

router.get("/login", async (req: Request, res: Response): Promise<void> => {
    const { token } = req.query;

    if (!token) {
        res.status(400).json({ error: "Missing required fields: token" });
        return;
    }

    let decodedToken;
    try {
        decodedToken = JSON.parse(Buffer.from((token as string).split('.')[1], 'base64').toString('utf-8'));
    } catch (error) {
        res.status(400).json({ error: "Invalid token format" });
        return;
    }

    const { picture, email, name, given_name } = decodedToken;

    try {
        const existingUser = await useDatabase(() => UserModel.findOne({ email: email.toString() }).exec());
        if (existingUser) {
            res.status(200).json(existingUser);
            return;
        }

        const user = await useDatabase(() => {
            const user = new UserModel({
                picture: picture || "",
                email: email.toString(),
                fullName: name.toString(),
                name: given_name.toString()
            });

            return user.save();
        });
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : error });
    }
});

export default router;
