import { useState, useEffect } from 'react';
import {
  Card,
  ProgressBar,
  Button,
  Checkbox,
  Banner,
  BlockStack,
  InlineStack,
} from '@shopify/polaris';

const onboardingSteps = [
  {
    title: 'Welcome',
    description: 'Get started - we will guide you through key setup steps.',
  },
  {
    title: 'On App embed',
    description: 'Link your Instagram account so we can display your gallery.',
    justification: 'Required to fetch and display photos in your gallery.',
  },
  {
    title: 'Create rules',
    description: 'Select the products you want your gallery to showcase.',
    justification: 'We use this to recommend the best templates for your products.',
  },
  
];

export default function OnboardingComponent({ onComplete, hasRules = false }) {
  const [activeStep, setActiveStep] = useState(hasRules ? 3 : 1);
  const [dismissed, setDismissed] = useState(false);
  const progress = ((activeStep + 1) / onboardingSteps.length) * 100;

  useEffect(() => {
    if (hasRules) {
      setActiveStep(3);
    } else {
      setActiveStep(1);
    }
  }, [hasRules]);

  const handleDismiss = () => {
    setDismissed(true);
  };

  const handleNext = () => {
    setActiveStep(activeStep + 1);
  };

  const handleFinish = () => {
    if (onComplete) {
      onComplete();
    }
    setActiveStep(0);
    setDismissed(true);
  };

  if (dismissed) {
    return (
      <Banner title="Onboarding dismissed" status="info">
        You can revisit onboarding any time from the Help menu.
      </Banner>
    );
  }

  return (
    <Card>
      <BlockStack gap="400">
        <h3 style={{ margin: 0 }}>Onboarding Guide</h3>
        <ProgressBar progress={progress} />
        <BlockStack gap="300">
          {onboardingSteps.map((step, idx) => (
            <Checkbox
              key={step.title}
              label={step.title}
              checked={idx < activeStep}
              helpText={
                step.description +
                (step.justification ? ` - ${step.justification}` : '')
              }
            />
          ))}
          <Button onClick={() => setActiveStep(2)}>
            Complete 2nd Step
          </Button>
          {activeStep === onboardingSteps.length && (
            <p style={{ fontWeight: 'bold', fontSize: '16px', marginTop: '16px' }}>
              Your app is ready. You can use the app in store.
            </p>
          )}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}