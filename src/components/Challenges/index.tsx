import React, { useEffect, useState, useRef } from "react";
import type { Challenge } from "./types";
import styles from "./Challenges.module.css";
import { Loader } from "rsuite";
import { getAllChallenges } from "./service";
import ChallengeComponent from "./Challenge";

const ChallengesPage: React.FC = () => {
    const sliderRef = useRef<HTMLDivElement>(null);

    const [challenges, setChallenges] = useState<Challenge[] | undefined | null>(undefined);

    useEffect(() => {
        setChallenges(undefined)
        getAllChallenges('684c7a1e6ceed1ce4c79c9af')
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

        return challenges.map((challenge) => <ChallengeComponent challenge={challenge} key={challenge.id} />)
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