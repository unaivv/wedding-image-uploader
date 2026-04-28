import { AllPhotos } from "../components/AllPhotos";
import { ChallengesPage as Challenges } from "../components/Challenges";

const HomePage = () => {
    return (
        <>
            <h1>Unai Y MF</h1>
            <Challenges />
            <AllPhotos />
        </>
    );
}

export { HomePage };