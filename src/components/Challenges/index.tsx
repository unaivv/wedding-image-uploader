import React, { useEffect, useState, useRef } from "react";
import type { Challenge } from "./types";
import styles from "./Challenges.module.css";
import { Button } from "rsuite";

const challenges: Challenge[] = [
    {
        id: "1",
        title: "Primer Baile",
        description: "Captura el momento más emotivo del primer baile de los novios.",
        topic: "Baile",
        deadline: "2025-06-10 22:00:00",
    },
    {
        id: "2",
        title: "Detalles del Vestido",
        description: "Fotografía los detalles únicos del vestido de la novia.",
        topic: "Vestido",
        deadline: "2025-06-10 23:00:00",
    },
    {
        id: "3",
        title: "Emociones Familiares",
        description: "Muestra las emociones genuinas de los familiares durante la ceremonia.",
        topic: "Familia",
        deadline: "2025-06-10 24:00:00",
    },
];

const renderCountdown = (deadline: string, now: Date): string => {
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();

    if (timeDiff <= 0) {
        return "El plazo ha expirado";
    }

    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) {
        return `${minutes} minutos`;
    }
    return `${hours} horas y ${minutes} minutos`;
};

const ChallengesPage: React.FC = () => {
    const [now, setNow] = useState(new Date());
    const sliderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.container}>
            <h2>Retos fotográficos</h2>
            <p>
                Participa en nuestros retos fotográficos. Cada reto cuenta con un tema específico. Sube tus fotos y participa para ganar premios.
            </p>
            <div className={styles.sliderWrapper}>
                <div className={styles.challengesSlider} ref={sliderRef}>
                    {challenges.map((challenge) => (
                        <div
                            key={challenge.id}
                            className={styles.challengeCard}
                        >
                            <h2>{challenge.title}</h2>
                            <p>{challenge.description}</p>
                            <p>
                                <strong>Topic:</strong> {challenge.topic}
                            </p>
                            <p>
                                <strong>Quedan</strong> {renderCountdown(challenge.deadline, now)}
                            </p>
                            <Button className={styles.uploadButton}>Upload Photo</Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChallengesPage;