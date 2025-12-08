import { useWaitlist } from '@/contexts/WaitlistContext';

export const useWaitlistModal = () => {
  const { openWaitlistModal, closeWaitlistModal, isWaitlistModalOpen } = useWaitlist();

  return {
    openWaitlistModal,
    closeWaitlistModal,
    isWaitlistModalOpen,
    // Convenience methods for common sources
    openFromHero: () => openWaitlistModal('hero'),
    openFromFooter: () => openWaitlistModal('footer'),
    openFromCTA: () => openWaitlistModal('cta'),
    openFromFeature: () => openWaitlistModal('feature'),
    openFromPricing: () => openWaitlistModal('pricing'),
    openFromNavigation: () => openWaitlistModal('navigation'),
  };
}; 