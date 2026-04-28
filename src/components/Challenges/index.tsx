import { useEffect, useRef, useState } from "react";
import type { Challenge } from "./types";
import styles from "./Challenges.module.css";
import { Placeholder } from "rsuite";
import { getAllChallenges } from "./service";
import { Challenge as ChallengeComponent } from "./Challenge";

const ChallengesPage = () => {
    const sliderRef = useRef<HTMLDivElement>(null);

    const [challenges, setChallenges] = useState<Challenge[] | undefined | null>(undefined);

    useEffect(() => {
        setChallenges(undefined)
        getAllChallenges(import.meta.env.VITE_EVENT_ID)
            .then((challengesList) => {
                if (challengesList) {
                    setChallenges(challengesList);
                } else {
                    setChallenges(null);
                }
            })
            .catch(() => setChallenges(null));
    }, []);

    const renderChallenges = () => {
        if (challenges === undefined) {
            return (
                <div style={{ display: 'flex', gap: 12 }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Placeholder.Graph key={i} active style={{ width: 220, height: 280, borderRadius: 8 }} />
                    ))}
                </div>
            );
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

export { ChallengesPage };