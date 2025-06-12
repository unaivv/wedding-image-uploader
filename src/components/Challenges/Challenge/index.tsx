import type { IChallengeProps } from "./types";
import styles from "./Challenge.module.css";
import { renderCountdown } from "./util";
import { useEffect, useState } from "react";
import Upload from "../../Upload";

const Challenge = ({ challenge }: IChallengeProps) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
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
                <strong>Quedan</strong> {renderCountdown(challenge.endDate, now)}
            </p>
            <Upload onlyButton extraParams={{
                challengeId: challenge.id
            }} />
        </div>
    );
}

export default Challenge;