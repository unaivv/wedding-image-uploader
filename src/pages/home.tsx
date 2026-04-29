import { AllPhotos } from "../components/AllPhotos";
import { ChallengesPage as Challenges } from "../components/Challenges";
import { Header } from "../components/Header";

const HomePage = () => (
    <>
        <Header />
        <Challenges />
        <AllPhotos />
    </>
);

export { HomePage };
