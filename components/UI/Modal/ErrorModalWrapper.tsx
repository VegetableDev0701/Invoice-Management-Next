import { useAppSelector as useSelector } from '@/store/hooks';
import ModalError from './ModalError';

interface Props {
  logout?: boolean;
}

export default function ModalErrorWrapper({ logout }: Props) {
  const modalData = useSelector((state) => state.ui.errorModal);
  return (
    <ModalError
      openModal={modalData.openModal}
      message={modalData.message}
      title={modalData.title}
      logout={modalData.logout}
    />
  );
}
