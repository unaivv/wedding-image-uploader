import React, { useEffect, useState, useRef } from "react";
import type { Challenge } from "./types";
import styles from "./Challenges.module.css";
import { Button, Loader } from "rsuite";
import { getAllChallenges } from "./service";

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

    const [challenges, setChallenges] = useState<Challenge[] | undefined | null>(undefined);

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setChallenges(undefined)
        getAllChallenges('683ef05ad8795795535d3b4f')
            .then((challengesList) => {
                if (challengesList) {
                    setChallenges(challengesList);
                } else {
                    setChallenges(null);
                }
            })
            .catch((error) => {
                setChallenges(null);
                console.error("Error fetching challenges:", error);
            });
    }, []);

    const renderChallenges = () => {
        if (challenges === undefined) {
            return <Loader />
        }

        if (challenges === null) {
            return <p className={styles.error}>No se han encontrado retos fotográficos.</p>;
        }

        return challenges.map((challenge) => (
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
                <Button appearance="ghost">Upload Photo</Button>
            </div>
        ))
    }

    return (
        <div className={styles.container}>
            <h2>Retos fotográficos</h2>
            <p className={styles.description}>
                Participa en nuestros retos fotográficos. Cada reto cuenta con un tema específico. Sube tus fotos y participa para ganar premios.
            </p>
            <div className={styles.sliderWrapper}>
                <div className={styles.challengesSlider} ref={sliderRef}>
                    {
                        renderChallenges()
                    }
                </div>
            </div>
        </div>
    );
};

export default ChallengesPage;