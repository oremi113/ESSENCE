import WelcomeOnboarding from '../WelcomeOnboarding';

export default function WelcomeOnboardingExample() {
  return (
    <WelcomeOnboarding 
      onStart={() => console.log('Starting voice preservation journey')}
    />
  );
}