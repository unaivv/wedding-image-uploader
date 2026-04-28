import express, { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { useDatabase } from "../services/ddbb";
import UserModel from "../models/user";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.get("/login", async (req: Request, res: Response): Promise<void> => {
    const { token } = req.query;

    if (!token) {
        res.status(400).json({ error: "Missing required fields: token" });
        return;
    }

    let payload;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token as string,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
        if (!payload) throw new Error("Empty token payload");
    } catch {
        res.status(401).json({ error: "Invalid or expired Google token" });
        return;
    }

    const { picture, email, name, given_name } = payload;

    if (!email) {
        res.status(400).json({ error: "Token missing email claim" });
        return;
    }

    try {
        const existingUser = await useDatabase(() => UserModel.findOne({ email }).exec());
        if (existingUser) {
            res.status(200).json(existingUser);
            return;
        }

        const user = await useDatabase(() => {
            const user = new UserModel({
                picture: picture || "",
                email,
                fullName: name?.toString() || "",
                name: given_name?.toString() || "",
            });
            return user.save();
        });
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : error });
    }
});

export default router;
